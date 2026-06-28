<script setup lang="ts">
import type { QueueFile } from './composables/useUploadQueue';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { getAllowedFileExtensions } from './composables/useFileUpload';
import { useUploadQueue } from './composables/useUploadQueue';

const props = withDefaults(
  defineProps<{
    /** 访问策略: owner | public | login，为空时按 accessType 默认 */
    accessPolicy?: 'login' | 'owner' | 'public';
    /** 访问类型: authorized | public | login，默认 public */
    accessType?: 'authorized' | 'login' | 'public';
    /** 最大数量，默认 1（单个）；大于 1 时自动开启多选 */
    maxCount?: number;
    /** 最大文件大小（MB），默认 0 仅由系统参数兜底 */
    maxSize?: number;
    /** 是否显示数量/大小限制提示，默认 true */
    showLimit?: boolean;
  }>(),
  {
    accessType: undefined,
    accessPolicy: undefined,
    maxCount: 1,
    maxSize: 0,
    showLimit: true,
  },
);

const isMultiple = computed(() => props.maxCount > 1);

const limitText = computed(() => {
  if (!props.showLimit) return '';
  const parts: string[] = [];
  if (props.maxCount > 1) {
    parts.push($t('upload.limitHintCount', { count: props.maxCount }));
  }
  if (props.maxSize > 0) {
    parts.push($t('upload.limitHintSize', { size: props.maxSize }));
  }
  return parts.join('，');
});

const { files, addFiles, start, togglePause, retry, remove, download } = useUploadQueue({
  type: 'file',
  accessType: props.accessType,
  accessPolicy: props.accessPolicy,
  multiple: isMultiple.value,
  maxCount: props.maxCount,
  maxSize: props.maxSize,
});

const acceptAttr = computed(() => {
  const exts = getAllowedFileExtensions();
  return exts.length > 0 ? exts.map(x => `.${x}`).join(',') : '';
});

function resolveAccessType(): string {
  return props.accessType ?? 'public';
}

function handleBeforeUpload(raw: any) {
  addFiles([raw]);
  return false; // 阻止 a-upload 默认上传，交给队列引擎延迟注入
}

/** 一个按钮多用途：未开始→上传，失败→重试，进行中(TUS)→暂停/继续 */
function onPrimaryAction(file: QueueFile) {
  if (!file.isStart) start(file);
  else if (file.status === 'error') retry(file);
  else if (file.status !== 'queued' && file.engine === 'tus') togglePause(file);
}
</script>

<template>
  <a-upload
    :accept="acceptAttr"
    :before-upload="handleBeforeUpload"
    :file-list="files as any"
    :multiple="isMultiple"
    :show-upload-list="{ showRemoveIcon: false, showDownloadIcon: false, showPreviewIcon: false }"
    :custom-request="() => {}"
    class="w-full"
  >
    <a-button type="primary" block>{{ $t('upload.selectFile') }}</a-button>
    <template #itemRender="{ file: rawFile }">
      <a-list item-layout="horizontal" :data-source="[rawFile as QueueFile]" class="hover:text-regular mt-2 rounded-md border border-border bg-card transition-all hover:bg-muted">
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
              <a-button v-if="!file.isStart" type="link" size="small" @click.stop="onPrimaryAction(file)"> {{ $t('upload.uploadAction') }} </a-button>
              <a-button v-else-if="file.status === 'error' && !file.preFailed" type="link" size="small" @click.stop="onPrimaryAction(file)"> {{ $t('upload.retry') }} </a-button>
              <template v-else-if="file.status !== 'done'">
                <a-button v-if="file.engine === 'tus'" type="link" size="small" :disabled="file.status === 'queued'" @click.stop="onPrimaryAction(file)">
                  {{ file.status === 'queued' ? $t('upload.waiting') : file.paused ? $t('upload.resume') : $t('upload.pause') }}
                </a-button>

                <a-button v-else type="link" size="small" disabled>
                  {{ file.status === 'queued' ? $t('upload.waiting') : $t('upload.uploading') }}
                </a-button>
              </template>

              <a-button type="link" size="small" :disabled="file.status !== 'done'" @click.stop="download(file)"> {{ $t('upload.download') }} </a-button>
              <a-button type="link" danger size="small" @click.stop="remove(file)"> {{ $t('upload.delete') }} </a-button>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </template>
  </a-upload>
  <div v-if="limitText" class="mt-1 text-xs text-gray-400">{{ limitText }}</div>
</template>
