<script setup lang="ts">
import type { TusBody } from '@uppy/tus';
import type { UploadFile } from 'ant-design-vue';

import { markRaw, onBeforeUnmount, ref } from 'vue'; // 🌟 引入了 markRaw

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import XHRUpload from '@uppy/xhr-upload';
import { message } from 'ant-design-vue';

import { deleteOssFile, getTusFileInfo, getTusUrl, getUploadUrl } from '#/api/core/upload';

import { getChunkSizeMB, getChunkThresholdMB, resolveUploadErrorMsg, validateFileBySystem } from './composables/useFileUpload';

const props = withDefaults(
  defineProps<{
    /** 访问策略: owner | public | login，为空时按 accessType 默认 */
    accessPolicy?: 'login' | 'owner' | 'public';
    /** 访问类型: authorized | public | login，默认 public */
    accessType?: 'authorized' | 'login' | 'public';
  }>(),
  {
    accessType: undefined,
    accessPolicy: undefined,
  },
);

/** 从 accessType 推算实际的访问类型 */
function resolveAccessType(): string {
  return props.accessType ?? 'public';
}

/** 从 accessPolicy 推算实际的访问策略 */
function resolveAccessPolicy(): string {
  return props.accessPolicy ?? 'public';
}

const TUS_ENDPOINT = getTusUrl();
const SIMPLE_ENDPOINT = getUploadUrl();
// 切片大小取自系统参数 storage.chunk_size_mb（Uppy 初始化时读取，调整后需刷新页面生效）
const CHUNK_SIZE = getChunkSizeMB() * 1024 * 1024;

/** 动态获取认证头，解决 Uppy 绕过 requestClient 导致 401 的问题 */
function getAuthHeaders(): Record<string, string> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Meta = Record<string, unknown>;

// 🌟 扩充 status 状态，增加 queued，并补充延迟注入的变量
interface UIFile extends Omit<UploadFile, 'status'> {
  downloadUrl?: string;
  engine: 'tus' | 'xhr';
  eta: number;
  fileId?: string;
  isStart: boolean;
  name: string;
  paused: boolean;
  percent: number;
  speed: number;
  status: 'done' | 'error' | 'paused' | 'queued' | 'uploading' | 'wait';
  totalMB: number;
  uid: string;
  uploadedMB: number;
  uppyId: string;
  logicalPath?: string;
  uploadKey: string;
  rawFile?: any; // 🌟 用于暂存未交给 Uppy 的原始文件对象
  isAddedToUppy?: boolean; // 🌟 标记是否已经正式塞进 Uppy 引擎
  errorMsg?: string; // 上传失败原因（展示在列表「上传失败」后）
  preFailed?: boolean; // 选择文件时即被前端校验拦截（体积/类型），不可重试
}

const uploadFiles = ref<UIFile[]>([]);

// =================================
// 引擎初始化
// =================================
const uppyTus = new Uppy<Meta, TusBody>({ autoProceed: false, id: 'uppy-tus' }).use(Tus, {
  endpoint: TUS_ENDPOINT,
  chunkSize: CHUNK_SIZE,
  limit: 1, // 大文件强制排队，单线程稳健上传
  retryDelays: [5000, 10_000],
  removeFingerprintOnSuccess: true,
  headers: getAuthHeaders, // 注入认证头（函数引用，每次请求时动态获取最新 token），防止 401
});

const uppyXhr = new Uppy<Meta, TusBody>({ autoProceed: false, id: 'uppy-xhr' }).use(XHRUpload, {
  endpoint: `${SIMPLE_ENDPOINT}`,
  fieldName: 'file',
  formData: true,
  bundle: false,
  limit: 5, // 🌟 小文件也强制排队，配合延迟注入实现精准控制
  headers: getAuthHeaders, // 注入认证头（函数引用，每次请求时动态获取最新 token），防止 401
});

// =============================
// 统一事件监听
// =============================
const progressData = new Map<string, { lastBytes: number; lastTime: number }>();

function bindEvents(instance: Uppy<Meta, TusBody>, engineType: 'tus' | 'xhr') {
  instance.on('file-added', file => {
    const target = uploadFiles.value.find(f => f.uid === file.meta.uid);
    if (target) target.uppyId = file.id;
  });

  // 🌟 【关键修复 1】：监听正式启动瞬间，解决按钮点了没反应（假死）的 Bug
  instance.on('upload-started' as any, (file: any) => {
    const target = uploadFiles.value.find(f => f.uppyId === file?.id);
    if (target) {
      target.isStart = true;
      target.status = 'uploading';
      target.paused = false;
    }
  });

  instance.on('upload-progress', (file, progress) => {
    const target = uploadFiles.value.find(f => f.uppyId === file?.id);
    if (!target || !progress.bytesTotal) return;

    // 突破排队，UI 状态更新
    if (target.status === 'queued' || target.status === 'wait') {
      target.status = 'uploading';
      target.isStart = true;
      target.paused = false;
    }

    const now = Date.now();
    const pd = progressData.get(file!.id) ?? { lastBytes: progress.bytesUploaded, lastTime: now };
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

    const uppyFile = instance.getFile(file!.id);
    const isReallyPaused = uppyFile?.isPaused || false;

    target.paused = isReallyPaused;
    target.status = isReallyPaused ? 'paused' : 'uploading';
    target.isStart = true;

    progressData.set(file!.id, { lastBytes: progress.bytesUploaded, lastTime: now });
  });

  instance.on('upload-success', (file, response: any) => {
    const target = uploadFiles.value.find(f => f.uppyId === file?.id);
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
        });
      }
    } else {
      const xhrData = response?.body?.data;
      if (xhrData) {
        target.fileId = xhrData.uploadKey;
        target.logicalPath = xhrData.logicalPath;
        target.downloadUrl = xhrData.fullUrl;
      }
    }
    message.success($t('upload.uploadSuccess', { name: file?.name }));
  });

  instance.on('upload-error', (file, _error, response) => {
    const target = uploadFiles.value.find(f => f.uppyId === file?.id);
    if (target) {
      target.status = 'error';
      target.errorMsg = resolveUploadErrorMsg(_error, response);
      if (engineType === 'tus' && !target.fileId) {
        const url = (file as any)?.tus?.uploadUrl || (file as any)?.response?.uploadURL || (response as any)?.uploadURL;
        if (url) {
          target.fileId = url.split('/').pop();
          console.warn('✅ 在报错瞬间成功抢救到 fileId:', target.fileId);
        }
      }
    }
  });

  instance.on('upload-pause', file => {
    const target = uploadFiles.value.find(f => f.uppyId === file?.id);
    if (target) {
      target.paused = true;
      target.status = 'paused';
    }
  });
}

bindEvents(uppyTus, 'tus');
bindEvents(uppyXhr, 'xhr');

onBeforeUnmount(() => {
  uppyTus.destroy();
  uppyXhr.destroy();
});

// =================================
// 交互逻辑
// =================================
function handleBeforeUpload(raw: any) {
  let finalName = raw.name;
  let count = 1;

  const lastDotIndex = finalName.lastIndexOf('.');
  const baseName = lastDotIndex === -1 ? finalName : finalName.slice(0, Math.max(0, lastDotIndex));
  const ext = lastDotIndex === -1 ? '' : finalName.slice(Math.max(0, lastDotIndex));

  while (uploadFiles.value.some(f => f.name === finalName)) {
    finalName = `${baseName}(${count})${ext}`;
    count++;
  }

  const renamedRaw = new File([raw], finalName, {
    type: raw.type,
    lastModified: raw.lastModified,
  }) as any;
  renamedRaw.uid = raw.uid;

  const isBigFile = renamedRaw.size > getChunkThresholdMB() * 1024 * 1024;
  const targetEngine = isBigFile ? 'tus' : 'xhr';

  const absoluteFileId = `tus-${renamedRaw.name}-${renamedRaw.size}-${renamedRaw.lastModified}`;
  const uploadKey = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  // 前端预校验：体积/类型不合规时即时拦截，直接以失败态进入列表，避免发起注定失败的上传
  const preError = validateFileBySystem(renamedRaw);
  if (preError) {
    message.error(preError);
  }

  // 🌟 【关键修复 2】：仅仅存入 Vue，绝不触发 addFile，实现延迟精准注入
  uploadFiles.value.push({
    uid: renamedRaw.uid,
    name: renamedRaw.name,
    status: preError ? 'error' : 'wait',
    percent: 0,
    uppyId: absoluteFileId,
    speed: 0,
    eta: 0,
    isStart: !!preError,
    paused: false,
    engine: targetEngine,
    totalMB: renamedRaw.size / 1024 / 1024,
    uploadedMB: 0,
    rawFile: markRaw(renamedRaw), // 🌟 暂存文件对象
    isAddedToUppy: false, // 🌟 标记未注入
    uploadKey,
    errorMsg: preError || undefined,
    preFailed: !!preError,
  });

  return false;
}

async function handleRemove(file: UIFile) {
  if (file.status === 'done') {
    if (file.logicalPath) {
      try {
        await deleteOssFile({ logicalPath: file.logicalPath });
        message.success($t('upload.deleteSourceSuccess'));
      } catch {
        message.error($t('upload.deleteFailed'));
        return;
      }
    }
  } else if (file.engine === 'tus' && file.fileId) {
    const tusDeleteUrl = `${TUS_ENDPOINT}/${file.fileId}`;
    fetch(tusDeleteUrl, {
      method: 'DELETE',
      headers: { 'Tus-Resumable': '1.0.0', ...getAuthHeaders() },
    }).catch(() => console.warn('TUS 临时文件清理失败'));
  }

  // 🌟 只有真正注入过 Uppy 的，才需要去清除它的引擎数据
  if (file.uppyId && file.isAddedToUppy) {
    const currentUppy = file.engine === 'tus' ? uppyTus : uppyXhr;
    currentUppy.removeFile(file.uppyId);
  }
  uploadFiles.value = uploadFiles.value.filter(f => f.uid !== file.uid);
}

function handleToggleAction(file: UIFile) {
  const currentUppy = file.engine === 'tus' ? uppyTus : uppyXhr;

  if (!file.isStart) {
    // 🌟 【关键修复 3】：只有在点击瞬间，才喂给 Uppy，指哪打哪
    if (!file.isAddedToUppy && file.rawFile) {
      currentUppy.addFile({
        id: file.uppyId,
        data: file.rawFile,
        name: file.name,
        type: file.rawFile.type,
        meta: {
          uid: file.uid,
          accessType: resolveAccessType(),
          accessPolicy: resolveAccessPolicy(),
          uploadKey: file.uploadKey,
        },
      });
      file.isAddedToUppy = true;
    }

    file.isStart = true;
    file.status = 'queued';
    currentUppy.upload();
  } else if (file.status === 'error') {
    file.errorMsg = undefined;
    if (file.engine === 'tus' && file.fileId) {
      const uppyFile = currentUppy.getFile(file.uppyId);
      currentUppy.setFileState(file.uppyId, {
        tus: Object.assign({}, uppyFile.tus, {
          uploadUrl: `${TUS_ENDPOINT}/${file.fileId}`,
        }),
      });
    }
    file.status = 'queued';
    currentUppy.retryUpload(file.uppyId);
  } else if (file.status !== 'queued' && file.engine === 'tus') {
    currentUppy.pauseResume(file.uppyId);
    const uppyFile = currentUppy.getFile(file.uppyId);
    if (uppyFile) {
      file.paused = uppyFile.isPaused || false;
      file.status = file.paused ? 'paused' : 'queued';
    }
  }
}

async function handleDownload(file: UIFile) {
  if (!file.downloadUrl) {
    try {
      const res: any = await getTusFileInfo({ uploadKey: file.fileId });
      file.downloadUrl = res.data?.fullUrl || res.fullUrl;
    } catch {
      return message.error($t('upload.getDownloadUrlFailed'));
    }
  }

  if (file.downloadUrl) {
    window.open(file.downloadUrl, '_blank');
  }
}
</script>

<template>
  <a-upload
    :before-upload="handleBeforeUpload"
    :file-list="uploadFiles as any"
    :show-upload-list="{ showRemoveIcon: false, showDownloadIcon: false, showPreviewIcon: false }"
    :custom-request="() => {}"
    class="w-full"
  >
    <a-button type="primary" block>{{ $t('upload.selectFile') }}</a-button>

    <template #itemRender="{ file: rawFile }">
      <a-list item-layout="horizontal" :data-source="[rawFile as UIFile]" class="hover:text-regular mt-2 rounded-md border border-border bg-card transition-all hover:bg-muted">
        <template #renderItem="{ item: file }">
          <a-list-item class="!flex-col !items-start">
            <a-list-item-meta class="w-full">
              <template #title>
                <div class="flex items-center gap-1" style="min-width: 0">
                  <a-tooltip :title="file.name" placement="topLeft">
                    <span class="inline-block truncate" style="max-width: 200px">{{ file.name }}</span>
                  </a-tooltip>
                  <a-tag class="shrink-0" :color="file.engine === 'tus' ? 'blue' : 'green'">
                    {{ file.engine === 'tus' ? $t('upload.largeFileSpeedUp') : $t('upload.standardSpeed') }}
                  </a-tag>
                  <a-tag class="shrink-0" :color="resolveAccessType() === 'authorized' ? 'red' : resolveAccessType() === 'public' ? 'cyan' : 'purple'">
                    <span v-if="resolveAccessType() === 'authorized'">{{ $t('upload.privateResource') }}</span>
                    <span v-else-if="resolveAccessType() === 'public'">{{ $t('upload.publicResource') }}</span>
                    <span v-else-if="resolveAccessType() === 'login'">{{ $t('upload.protectedResource') }}</span>
                  </a-tag>
                </div>
              </template>

              <template #description>
                <a-progress
                  :percent="file.percent"
                  :status="file.status === 'error' ? 'exception' : file.status === 'done' ? 'success' : file.status === 'queued' ? 'normal' : 'active'"
                  :stroke-color="file.status === 'queued' ? '#d9d9d9' : file.paused ? '#faad14' : '#1677ff'"
                  class="mb-1"
                />
                <!-- 状态文字固定占位，避免进度出现时撑开布局 -->
                <div class="text-xs text-gray-500" style="min-height: 16px; line-height: 16px">
                  <template v-if="!file.isStart">
                    {{ $t('upload.pendingUpload') }}
                  </template>
                  <template v-else-if="file.status === 'queued'">
                    {{ $t('upload.waitingAllocation') }}
                  </template>
                  <template v-else-if="['uploading', 'paused'].includes(file.status)">
                    {{
                      $t('upload.progressText', {
                        uploaded: file.uploadedMB?.toFixed(2),
                        total: file.totalMB?.toFixed(2),
                        speed: file.speed?.toFixed(2),
                        eta: file.eta?.toFixed(1),
                      })
                    }}
                  </template>
                  <template v-else-if="file.status === 'done'">
                    {{ $t('upload.uploadComplete') }}
                  </template>
                  <template v-else-if="file.status === 'error'">
                    <span class="text-red-500">
                      {{ file.errorMsg ? $t('upload.uploadFailedReason', { reason: file.errorMsg }) : $t('upload.uploadFailed') }}
                    </span>
                  </template>
                </div>
              </template>

              <template #avatar>
                <IconifyIcon icon="ant-design:file-outlined" :style="{ fontSize: '24px', color: '#8c8c8c' }" />
              </template>
            </a-list-item-meta>

            <!-- 操作按钮：纵向排列，避免挤压 -->
            <div class="mt-2 flex w-full flex-wrap gap-1">
              <a-button v-if="!file.isStart" type="link" size="small" @click.stop="handleToggleAction(file)"> {{ $t('upload.uploadAction') }} </a-button>
              <a-button v-else-if="file.status === 'error' && !file.preFailed" type="link" size="small" @click.stop="handleToggleAction(file)"> {{ $t('upload.retry') }} </a-button>
              <template v-else-if="file.status !== 'done'">
                <a-button v-if="file.engine === 'tus'" type="link" size="small" :disabled="file.status === 'queued'" @click.stop="handleToggleAction(file)">
                  {{ file.status === 'queued' ? $t('upload.waiting') : file.paused ? $t('upload.resume') : $t('upload.pause') }}
                </a-button>

                <a-button v-else type="link" size="small" disabled>
                  {{ file.status === 'queued' ? $t('upload.waiting') : $t('upload.uploading') }}
                </a-button>
              </template>

              <a-button type="link" size="small" :disabled="file.status !== 'done'" @click.stop="handleDownload(file)"> {{ $t('upload.download') }} </a-button>
              <a-button type="link" danger size="small" @click.stop="handleRemove(file)"> {{ $t('upload.delete') }} </a-button>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </template>
  </a-upload>
</template>
