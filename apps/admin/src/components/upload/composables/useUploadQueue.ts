/**
 * 上传队列引擎（无 UI 的纯逻辑 composable）。
 *
 * 从 upFile.vue 提炼，四个上传组件（文件 / 图片 / 媒体 / 头像）共用同一套：
 * - 双引擎：大文件走 TUS 断点续传、小文件走 XHR 直传，阈值取系统参数 storage.chunk_threshold_mb。
 * - 串行队列：两个引擎都 limit:1，配合「延迟注入」实现「每次只跑一个、其余排队」。
 * - 完整状态机：wait / queued / uploading / paused / done / error。
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

import { deleteOssFile, getTusFileInfo, getTusUrl, getUploadUrl } from '#/api/admin/core/upload';

import {
  getAllowedImageExtensions,
  getAllowedMediaExtensions,
  getChunkSizeMB,
  getChunkThresholdMB,
  getFileExt,
  resolveUploadErrorMsg,
  validateFileBySystem,
} from './useFileUpload';

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
  rawFile?: any;
  speed: number;
  status: 'done' | 'error' | 'paused' | 'queued' | 'uploading' | 'wait';
  /** 本地预览 / 回显完整 URL */
  thumbUrl?: string;
  totalMB: number;
  uid: string;
  uploadedMB: number;
  uploadKey: string;
  uppyId: string;
}

export interface UploadQueueOptions {
  accessPolicy?: 'login' | 'owner' | 'public';
  accessType?: 'authorized' | 'login' | 'public';
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
  download: (f: QueueFile) => Promise<void>;
  openPreview: (f: QueueFile) => void;
  remove: (f: QueueFile) => Promise<void>;
  retry: (f: QueueFile) => void;
  start: (f: QueueFile) => void;
  togglePause: (f: QueueFile) => void;
}

export const UPLOAD_CTX: InjectionKey<UploadCtx> = Symbol('uploadCtx');

// 已知音频扩展名；媒体白名单里除此之外的一律按视频渲染
const AUDIO_EXTS = new Set(['aac', 'amr', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'wma']);

export function useUploadQueue(options: UploadQueueOptions) {
  const files = ref<QueueFile[]>([]);

  const TUS_ENDPOINT = getTusUrl();
  const SIMPLE_ENDPOINT = getUploadUrl();
  const CHUNK_SIZE = getChunkSizeMB() * 1024 * 1024;

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
          getTusFileInfo({ uploadKey: target.fileId }).then((res: any) => {
            target.logicalPath = res.logicalPath;
            target.downloadUrl = res.fullUrl;
            if (target.kind !== 'file' && res.fullUrl) target.thumbUrl = res.fullUrl;
          });
        }
      } else {
        const xhrData = response?.body?.data;
        if (xhrData) {
          target.fileId = xhrData.uploadKey;
          target.logicalPath = xhrData.logicalPath;
          target.downloadUrl = xhrData.fullUrl;
          if (target.kind !== 'file' && xhrData.fullUrl) target.thumbUrl = xhrData.fullUrl;
        }
      }
      message.success($t('upload.uploadSuccess', { name: file?.name }));
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
      return $t('upload.errExtNotAllowed', { ext });
    }
    return validateFileBySystem(file, options.maxSize);
  }

  function canAddMore(): boolean {
    if (!options.multiple) return files.value.length === 0;
    if (options.maxCount && options.maxCount > 0) return files.value.length < options.maxCount;
    return true;
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
    const uploadKey = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
      uploadKey,
      thumbUrl,
      errorMsg: preError || undefined,
      preFailed: !!preError,
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
          uploadKey: f.uploadKey,
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
    if (f.status === 'done' && f.logicalPath) {
      try {
        await deleteOssFile({ logicalPath: f.logicalPath });
        message.success($t('upload.deleteSourceSuccess'));
      } catch {
        message.error($t('upload.deleteFailed'));
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
        const res: any = await getTusFileInfo({ uploadKey: f.fileId });
        f.downloadUrl = res.data?.fullUrl || res.fullUrl;
      } catch {
        message.error($t('upload.getDownloadUrlFailed'));
        return;
      }
    }
    if (f.downloadUrl) window.open(f.downloadUrl, '_blank');
  }

  function clear() {
    files.value.forEach(f => {
      if (f.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(f.thumbUrl);
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
      uploadKey: '',
      logicalPath,
      downloadUrl: fullUrl,
      thumbUrl: kind === 'file' ? undefined : fullUrl,
      preFailed: false,
    });
  }

  return {
    files,
    addFiles,
    addResolved,
    canAddMore,
    start,
    togglePause,
    retry,
    remove,
    download,
    clear,
  };
}
