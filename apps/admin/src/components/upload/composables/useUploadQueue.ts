/**
 * 上传队列引擎（无 UI 的纯逻辑 composable）。
 *
 * 从 upFile.vue 提炼，四个上传组件（文件 / 图片 / 媒体 / 头像）共用同一套：
 * - 双引擎：大文件走 TUS 断点续传、小文件走 XHR 直传，阈值取系统参数 storage.chunk_threshold_mb。
 * - 秒传：大文件先 Web Worker 计算 MD5，命中则服务端复制，未命中再走原上传。
 * - 串行队列：两个引擎都 limit:1，配合「延迟注入」实现「每次只跑一个、其余排队」。
 * - 完整状态机：wait / checking / queued / uploading / paused / done / error。
 * - 原子操作：start / togglePause / retry / remove / download，由各展示层按需组合。
 * - 隔离修复：storeFingerprintForResuming:false + 按 type 加指纹前缀，
 *   彻底消除「同一文件跨组件 / 跨会话复用旧任务」导致的 HEAD 200 缺 Upload-Offset 报错。
 */
import type { TusBody } from '@uppy/tus';

import type { InjectionKey } from 'vue';

import { markRaw, onBeforeUnmount, ref } from 'vue';

import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import XHRUpload from '@uppy/xhr-upload';
import { message } from 'ant-design-vue';

import { deleteOssFile, getTusFileInfo, getTusUrl, getUploadUrl } from '#/api/core/upload';

import {
  getAllowedImageExtensions,
  getAllowedMediaExtensions,
  getChunkSizeMB,
  getChunkThresholdMB,
  getFileExt,
  resolveUploadErrorMsg,
  validateFileBySystem,
} from './useFileUpload';
import { computeHash, fastCheck, fastCopy, getUploadSecMB } from './useFastUpload';

/** 上传业务类型：决定指纹前缀、白名单来源、缩略类型 */
export type UploadType = 'avatar' | 'file' | 'image' | 'media';

/** 缩略渲染类型 */
export type FileKind = 'audio' | 'file' | 'image' | 'video';

/** 队列文件状态机 + 展示字段 */
export interface QueueFile {
  downloadUrl?: string;
  engine: 'tus' | 'xhr';
  errorMsg?: string;
  eta: number;
  fileId?: string;
  /** 秒传相关：计算出的文件 MD5 */
  hash?: string;
  /** 秒传相关：用户是否已取消校验 */
  hashCancelled?: boolean;
  /** 秒传相关：正在运行的 Worker 任务 */
  hashJob?: { abort: () => void; promise: Promise<string> };
  isAddedToUppy: boolean;
  isStart: boolean;
  /** 缩略渲染类型：image / video / audio / file */
  kind: FileKind;
  logicalPath?: string;
  name: string;
  paused: boolean;
  percent: number;
  /** 选择即被前端校验拦截（体积 / 类型），不可重试 */
  preFailed: boolean;
  /** 秒传相关：是否已经走过秒传判断 */
  rapidChecked?: boolean;
  /** 秒传相关：是否通过秒传复制成功 */
  rapidCopied?: boolean;
  rawFile?: any;
  speed: number;
  status: 'checking' | 'done' | 'error' | 'paused' | 'queued' | 'uploading' | 'wait';
  /** 本地预览 / 回显完整 URL */
  thumbUrl?: string;
  totalMB: number;
  uid: string;
  uploadedMB: number;
  uppyId: string;
}

export interface UploadQueueOptions {
  accessPolicy?: 'login' | 'owner' | 'public';
  accessType?: 'authorized' | 'login' | 'public';
  /** 是否启用秒传，默认 true（仍受 storage.upload_sec 限制） */
  enableFastUpload?: boolean;
  maxCount?: number;
  maxSize?: number;
  multiple?: boolean;
  /** 大文件走 TUS 的阈值（MB），不传则读系统参数 */
  thresholdMB?: number;
  type: UploadType;
}

type Meta = Record<string, unknown>;

/** Uploader 通过 provide 注入给缩略卡片子组件的操作上下文 */
export interface UploadCtx {
  cancelHashCheck: (f: QueueFile) => void;
  download: (f: QueueFile) => Promise<void>;
  openPreview: (f: QueueFile) => void;
  remove: (f: QueueFile) => Promise<void>;
  retry: (f: QueueFile) => void;
  start: (f?: QueueFile) => void;
  togglePause: (f: QueueFile) => void;
}

export const UPLOAD_CTX: InjectionKey<UploadCtx> = Symbol('uploadCtx');

// 已知音频扩展名；媒体白名单里除此之外的一律按视频渲染
const AUDIO_EXTS = new Set(['aac', 'amr', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'wma']);

/** 同类型同时校验 MD5 的最大并发数 */
const MAX_CHECKING = 3;

export function useUploadQueue(options: UploadQueueOptions) {
  const files = ref<QueueFile[]>([]);

  const TUS_ENDPOINT = getTusUrl();
  const SIMPLE_ENDPOINT = getUploadUrl();
  const CHUNK_SIZE = getChunkSizeMB() * 1024 * 1024;

  /** 秒传开关：组件 prop 与 storage.upload_sec 共同决定 */
  const fastUploadEnabled = ref(
    options.enableFastUpload !== false && getUploadSecMB() > 0,
  );

  /** 正在校验 MD5 的槽位（存 uid） */
  const checkingSlots = ref<Set<string>>(new Set());

  /** 动态获取认证头，解决 Uppy 绕过 requestClient 导致 401 的问题 */
  function getAuthHeaders(): Record<string, string> {
    const token = useAccessStore().accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function resolveAccessType(): string {
    return options.accessType ?? 'public';
  }

  function resolveAccessPolicy(): string {
    return options.accessPolicy ?? 'public';
  }

  // =====================================================================
  // 引擎初始化：每个 composable 实例一组，limit:1 串行
  // =====================================================================
  const uppyTus = new Uppy<Meta, TusBody>({ autoProceed: false, id: `uppy-tus-${options.type}` }).use(Tus, {
    endpoint: TUS_ENDPOINT,
    chunkSize: CHUNK_SIZE,
    limit: 1,
    retryDelays: [5000, 10_000],
    removeFingerprintOnSuccess: true,
    // 隔离修复：不持久化续传指纹 + 指纹加 type 前缀，杜绝跨组件 / 跨会话串号
    storeFingerprintForResuming: false,
    fingerprint: (file: any) => Promise.resolve(`${options.type}-${file.name}-${file.size}-${file.type}`),
    headers: getAuthHeaders,
  });

  const uppyXhr = new Uppy<Meta, TusBody>({ autoProceed: false, id: `uppy-xhr-${options.type}` }).use(XHRUpload, {
    endpoint: SIMPLE_ENDPOINT,
    fieldName: 'file',
    formData: true,
    bundle: false,
    limit: 1,
    headers: getAuthHeaders,
  });

  // =====================================================================
  // 事件绑定
  // =====================================================================
  const progressData = new Map<string, { lastBytes: number; lastTime: number }>();

  function bindEvents(instance: Uppy<Meta, TusBody>, engineType: 'tus' | 'xhr') {
    instance.on('file-added', file => {
      const target = files.value.find(f => f.uid === file.meta.uid);
      if (target) target.uppyId = file.id;
    });

    instance.on('upload-started' as any, (file: any) => {
      const target = files.value.find(f => f.uppyId === file?.id);
      if (target) {
        target.isStart = true;
        target.status = 'uploading';
        target.paused = false;
      }
    });

    instance.on('upload-progress', (file, progress) => {
      const target = files.value.find(f => f.uppyId === file?.id);
      if (!target || !progress.bytesTotal) return;
      const fid = file?.id;
      if (!fid) return;

      if (target.status === 'queued' || target.status === 'wait') {
        target.status = 'uploading';
        target.isStart = true;
        target.paused = false;
      }

      const now = Date.now();
      const pd = progressData.get(fid) ?? { lastBytes: progress.bytesUploaded, lastTime: now };
      const deltaBytes = progress.bytesUploaded - pd.lastBytes;
      const deltaTime = (now - pd.lastTime) / 1000;
      const safeDeltaTime = deltaTime > 0 ? deltaTime : 0.001;
      const speed = deltaBytes / 1024 / 1024 / safeDeltaTime;
      const remaining = progress.bytesTotal - progress.bytesUploaded;

      target.speed = speed;
      target.eta = speed > 0 ? remaining / 1024 / 1024 / speed : 0;
      target.percent = Number(((progress.bytesUploaded / progress.bytesTotal) * 100).toFixed(2));
      target.uploadedMB = progress.bytesUploaded / 1024 / 1024;
      target.totalMB = progress.bytesTotal / 1024 / 1024;

      const uppyFile = instance.getFile(fid);
      const isReallyPaused = uppyFile?.isPaused || false;
      target.paused = isReallyPaused;
      target.status = isReallyPaused ? 'paused' : 'uploading';
      target.isStart = true;

      progressData.set(fid, { lastBytes: progress.bytesUploaded, lastTime: now });
    });

    instance.on('upload-success', (file, response: any) => {
      const target = files.value.find(f => f.uppyId === file?.id);
      if (!target) return;

      target.status = 'done';
      target.percent = 100;

      if (engineType === 'tus') {
        const tusUrl = response?.uploadURL || (file as any).uploadURL;
        if (tusUrl) {
          target.fileId = tusUrl.split('/').pop();
          getTusFileInfo({ fileId: target.fileId }).then((res: any) => {
            target.logicalPath = res.logicalPath;
            target.downloadUrl = res.fullUrl;
            if (target.kind !== 'file' && res.fullUrl) target.thumbUrl = res.fullUrl;
          });
        }
      } else {
        const xhrData = response?.body?.data;
        if (xhrData) {
          target.logicalPath = xhrData.logicalPath;
          target.downloadUrl = xhrData.fullUrl;
          if (target.kind !== 'file' && xhrData.fullUrl) target.thumbUrl = xhrData.fullUrl;
        }
      }
      message.success($t('core.upload.uploadSuccess', { name: file?.name }));
    });

    instance.on('upload-error', (file, error, response) => {
      const target = files.value.find(f => f.uppyId === file?.id);
      if (target) {
        target.status = 'error';
        target.errorMsg = resolveUploadErrorMsg(error, response);
        if (engineType === 'tus' && !target.fileId) {
          const url = (file as any)?.tus?.uploadUrl || (file as any)?.response?.uploadURL || (response as any)?.uploadURL;
          if (url) target.fileId = url.split('/').pop();
        }
      }
    });

    instance.on('upload-pause', file => {
      const target = files.value.find(f => f.uppyId === file?.id);
      if (target) {
        target.paused = true;
        target.status = 'paused';
      }
    });
  }

  bindEvents(uppyTus, 'tus');
  bindEvents(uppyXhr, 'xhr');

  onBeforeUnmount(() => {
    files.value.forEach(f => {
      if (f.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(f.thumbUrl);
      if (f.hashJob) f.hashJob.abort();
    });
    uppyTus.destroy();
    uppyXhr.destroy();
  });

  // =====================================================================
  // 校验 / 分类
  // =====================================================================
  function allowedExtsByType(): string[] {
    if (options.type === 'media') return getAllowedMediaExtensions();
    if (options.type === 'image' || options.type === 'avatar') return getAllowedImageExtensions();
    return []; // file：不额外限类型，交给 validateFileBySystem 的合并白名单兜底
  }

  function detectKind(name: string): FileKind {
    if (options.type === 'image' || options.type === 'avatar') return 'image';
    if (options.type === 'file') return 'file';
    return AUDIO_EXTS.has(getFileExt(name)) ? 'audio' : 'video';
  }

  /** 体积 + 按 type 的扩展名白名单校验，通过返回空字符串 */
  function validateByType(file: File): string {
    const exts = allowedExtsByType();
    const ext = getFileExt(file.name);
    if (exts.length > 0 && (!ext || !exts.includes(ext))) {
      return $t('core.upload.errExtNotAllowed', { ext });
    }
    return validateFileBySystem(file, options.maxSize);
  }

  function canAddMore(): boolean {
    if (!options.multiple) return files.value.length === 0;
    if (options.maxCount && options.maxCount > 0) return files.value.length < options.maxCount;
    return true;
  }

  // =====================================================================
  // 秒传相关
  // =====================================================================

  /** 判断文件是否应该走秒传校验 */
  function shouldCheck(f: QueueFile): boolean {
    if (!fastUploadEnabled.value) return false;
    if (f.preFailed || f.hashCancelled || f.rapidChecked) return false;
    return f.totalMB >= getUploadSecMB();
  }

  /** 尝试从 wait 队列中补充校验槽位 */
  function fillCheckingSlots() {
    if (!fastUploadEnabled.value) return;
    const waitList = files.value.filter(f => f.status === 'wait' && shouldCheck(f));
    for (const f of waitList) {
      if (checkingSlots.value.size >= MAX_CHECKING) break;
      if (!checkingSlots.value.has(f.uid)) {
        startHashCheck(f);
      }
    }
  }

  /** 启动单个文件的 MD5 校验 */
  function startHashCheck(f: QueueFile) {
    if (!f.rawFile || checkingSlots.value.has(f.uid)) return;
    if (checkingSlots.value.size >= MAX_CHECKING) return;

    f.status = 'checking';
    f.percent = 0;
    f.isStart = true;
    checkingSlots.value.add(f.uid);

    const job = computeHash(
      f.rawFile,
      (percent) => {
        if (f.status === 'checking') f.percent = percent;
      },
    );

    f.hashJob = job;

    job.promise
      .then(async (hash) => {
        if (f.hashCancelled) return;
        f.hash = hash;
        try {
          const checkRes = await fastCheck({
            hash,
            sizeByte: f.rawFile?.size ?? 0,
            originalName: f.name,
            accessType: resolveAccessType(),
            accessPolicy: resolveAccessPolicy(),
          });

          if (checkRes.hit && checkRes.logicalPath && checkRes.fullUrl) {
            const copyRes = await fastCopy({
              hash,
              sizeByte: f.rawFile?.size ?? 0,
              originalName: f.name,
              accessType: resolveAccessType(),
              accessPolicy: resolveAccessPolicy(),
            });
            f.status = 'done';
            f.percent = 100;
            f.rapidCopied = true;
            f.logicalPath = copyRes.logicalPath;
            f.downloadUrl = copyRes.fullUrl;
            if (f.kind !== 'file' && copyRes.fullUrl) f.thumbUrl = copyRes.fullUrl;
            message.success($t('core.upload.rapidCopySuccess', { name: f.name }));
          } else {
            f.rapidChecked = true;
            f.status = 'wait';
            injectAndUpload(f);
          }
        } catch (error) {
          // 秒传接口异常时兜底走普通上传
          f.hashCancelled = true;
          f.rapidChecked = true;
          f.status = 'wait';
          injectAndUpload(f);
        }
      })
      .catch(() => {
        // Worker 被取消或报错
        if (!f.hashCancelled) {
          f.hashCancelled = true;
          f.rapidChecked = true;
          f.status = 'wait';
          injectAndUpload(f);
        }
      })
      .finally(() => {
        f.hashJob = undefined;
        checkingSlots.value.delete(f.uid);
        fillCheckingSlots();
      });
  }

  /** 取消某个文件的秒传校验 */
  function cancelHashCheck(f: QueueFile) {
    if (f.status !== 'checking') return;
    f.hashCancelled = true;
    f.rapidChecked = true;
    if (f.hashJob) {
      f.hashJob.abort();
      f.hashJob = undefined;
    }
    checkingSlots.value.delete(f.uid);
    f.status = 'wait';
    injectAndUpload(f);
    fillCheckingSlots();
  }

  /** 切换秒传开关 */
  function toggleFastUpload(enabled: boolean) {
    fastUploadEnabled.value = enabled;
    if (!enabled) {
      // 关闭时取消正在校验的任务
      files.value.filter(f => f.status === 'checking').forEach(cancelHashCheck);
    } else {
      fillCheckingSlots();
    }
  }

  // =====================================================================
  // 入队（延迟注入：只存 Vue，不立即 addFile）
  // =====================================================================
  function addOne(raw: any) {
    // 同名自动加序号，避免列表内冲突
    let finalName = raw.name;
    let count = 1;
    const dot = finalName.lastIndexOf('.');
    const base = dot === -1 ? finalName : finalName.slice(0, Math.max(0, dot));
    const ext = dot === -1 ? '' : finalName.slice(Math.max(0, dot));
    while (files.value.some(f => f.name === finalName)) {
      finalName = `${base}(${count})${ext}`;
      count++;
    }

    const renamed = new File([raw], finalName, { type: raw.type, lastModified: raw.lastModified }) as any;
    renamed.uid = raw.uid ?? `${finalName}-${renamed.size}-${renamed.lastModified}`;

    const isBig = renamed.size > (options.thresholdMB ?? getChunkThresholdMB()) * 1024 * 1024;
    const engine: 'tus' | 'xhr' = isBig ? 'tus' : 'xhr';
    const uppyId = `${engine}-${renamed.name}-${renamed.size}-${renamed.lastModified}`;

    const kind = detectKind(renamed.name);
    const preError = validateByType(renamed);
    const thumbUrl = !preError && (kind === 'image' || kind === 'video') ? URL.createObjectURL(renamed) : undefined;

    files.value.push({
      uid: renamed.uid,
      name: renamed.name,
      status: preError ? 'error' : 'wait',
      percent: 0,
      uppyId,
      speed: 0,
      eta: 0,
      isStart: !!preError,
      paused: false,
      engine,
      kind,
      totalMB: renamed.size / 1024 / 1024,
      uploadedMB: 0,
      rawFile: markRaw(renamed),
      isAddedToUppy: false,
      thumbUrl,
      errorMsg: preError || undefined,
      preFailed: !!preError,
      hashCancelled: false,
      rapidChecked: false,
    });
  }

  function addFiles(rawList: File[] | FileList) {
    for (const raw of rawList) {
      if (!canAddMore()) break;
      addOne(raw);
    }
  }

  // =====================================================================
  // 原子操作
  // =====================================================================
  function injectAndUpload(f: QueueFile) {
    if (f.preFailed) return;

    // 秒传优先
    if (shouldCheck(f) && !f.rapidChecked) {
      startHashCheck(f);
      return;
    }

    const uppy = f.engine === 'tus' ? uppyTus : uppyXhr;
    if (!f.isAddedToUppy && f.rawFile) {
      uppy.addFile({
        id: f.uppyId,
        data: f.rawFile,
        name: f.name,
        type: f.rawFile.type,
        meta: {
          uid: f.uid,
          accessType: resolveAccessType(),
          accessPolicy: resolveAccessPolicy(),
        },
      });
      f.isAddedToUppy = true;
    }
    f.isStart = true;
    f.status = 'queued';
    uppy.upload();
  }

  /** 手动触发上传：传入单个文件，或不传则启动全部 wait 项 */
  function start(file?: QueueFile) {
    const targets = file ? [file] : files.value.filter(f => f.status === 'wait');
    targets.forEach(f => injectAndUpload(f));
    fillCheckingSlots();
  }

  /** 暂停 / 继续（仅 TUS 大文件支持） */
  function togglePause(f: QueueFile) {
    if (f.engine !== 'tus' || f.status === 'queued') return;
    uppyTus.pauseResume(f.uppyId);
    const uf = uppyTus.getFile(f.uppyId);
    f.paused = uf?.isPaused || false;
    f.status = f.paused ? 'paused' : 'queued';
  }

  /** 失败重试 */
  function retry(f: QueueFile) {
    if (f.preFailed) return;
    const uppy = f.engine === 'tus' ? uppyTus : uppyXhr;
    f.errorMsg = undefined;
    if (f.engine === 'tus' && f.fileId) {
      const uf = uppy.getFile(f.uppyId);
      uppy.setFileState(f.uppyId, {
        tus: Object.assign({}, uf?.tus, { uploadUrl: `${TUS_ENDPOINT}/${f.fileId}` }),
      });
    }
    f.status = 'queued';
    uppy.retryUpload(f.uppyId);
  }

  /** 删除：已完成的抹除服务端源文件，未完成的清理 TUS 临时文件 + 引擎数据 */
  async function remove(f: QueueFile) {
    if (f.status === 'checking') {
      cancelHashCheck(f);
    }

    if (f.status === 'done' && f.logicalPath) {
      try {
        await deleteOssFile({ logicalPath: f.logicalPath });
        message.success($t('core.upload.deleteSourceSuccess'));
      } catch {
        message.error($t('core.upload.deleteFailed'));
        return;
      }
    } else if (f.engine === 'tus' && f.fileId) {
      fetch(`${TUS_ENDPOINT}/${f.fileId}`, {
        method: 'DELETE',
        headers: { 'Tus-Resumable': '1.0.0', ...getAuthHeaders() },
      }).catch(() => console.warn('TUS 临时文件清理失败'));
    }

    if (f.uppyId && f.isAddedToUppy) {
      (f.engine === 'tus' ? uppyTus : uppyXhr).removeFile(f.uppyId);
    }
    if (f.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(f.thumbUrl);
    files.value = files.value.filter(item => item.uid !== f.uid);
  }

  async function download(f: QueueFile) {
    if (!f.downloadUrl) {
      try {
        const res: any = await getTusFileInfo({ fileId: f.fileId });
        f.downloadUrl = res.data?.fullUrl || res.fullUrl;
      } catch {
        message.error($t('core.upload.getDownloadUrlFailed'));
        return;
      }
    }
    if (f.downloadUrl) window.open(f.downloadUrl, '_blank');
  }

  function clear() {
    files.value.forEach(f => {
      if (f.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(f.thumbUrl);
      if (f.hashJob) f.hashJob.abort();
    });
    files.value = [];
  }

  /** 直接注入一条已完成项（用于 v-model 回显） */
  function addResolved(logicalPath: string, fullUrl: string) {
    const kind = detectKind(logicalPath);
    files.value.push({
      uid: `resolved-${logicalPath}`,
      name: logicalPath.split('/').pop() || logicalPath,
      status: 'done',
      percent: 100,
      uppyId: '',
      speed: 0,
      eta: 0,
      isStart: true,
      paused: false,
      engine: 'xhr',
      kind,
      totalMB: 0,
      uploadedMB: 0,
      isAddedToUppy: false,
      logicalPath,
      downloadUrl: fullUrl,
      thumbUrl: kind === 'file' ? undefined : fullUrl,
      preFailed: false,
      hashCancelled: false,
      rapidChecked: false,
    });
  }

  return {
    fastUploadEnabled,
    files,
    addFiles,
    addResolved,
    canAddMore,
    cancelHashCheck,
    start,
    toggleFastUpload,
    togglePause,
    retry,
    remove,
    download,
    clear,
  };
}
