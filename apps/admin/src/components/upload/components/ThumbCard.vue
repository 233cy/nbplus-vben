<script setup lang="ts">
import type { QueueFile } from '../composables/useUploadQueue';

import { computed, inject } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { UPLOAD_CTX } from '../composables/useUploadQueue';

const props = defineProps<{
  file: QueueFile;
}>();

const ctx = inject(UPLOAD_CTX);

/** 只有合法地址才渲染缩略，避免逻辑路径触发无效请求 */
const safeSrc = computed(() => {
  const url = props.file.thumbUrl || '';
  return url.startsWith('http') || url.startsWith('blob:') ? url : '';
});

const strokeColor = computed(() => (props.file.paused ? '#faad14' : 'hsl(var(--primary))'));

/** TUS 大文件进行中才允许暂停 / 继续 */
const canPause = computed(() => props.file.engine === 'tus' && props.file.status !== 'queued' && ['paused', 'uploading'].includes(props.file.status));

const kindIcon = computed(() => (props.file.kind === 'video' ? 'ant-design:play-circle-outlined' : 'ant-design:audio-outlined'));
</script>

<template>
  <div class="thumb-card group">
    <!-- 缩略层 -->
    <img v-if="file.kind === 'image'" :src="safeSrc" alt="" class="thumb" />
    <template v-else-if="file.kind === 'video'">
      <video v-if="file.status !== 'done'" :src="safeSrc" class="thumb" muted preload="metadata"></video>
      <div v-else class="thumb thumb-video-placeholder">
        <IconifyIcon icon="ant-design:play-circle-outlined" class="text-4xl text-gray-400" />
      </div>
    </template>
    <div v-else class="thumb thumb-audio">
      <IconifyIcon icon="ant-design:sound-outlined" class="text-3xl text-gray-400" />
    </div>

    <!-- 类型角标 -->
    <span v-if="file.kind !== 'image'" class="badge">
      <IconifyIcon :icon="kindIcon" />
    </span>

    <!-- 进度 / 状态遮罩：未完成时常驻 -->
    <div v-if="file.status !== 'done'" class="overlay">
      <template v-if="file.status !== 'error'">
        <div class="progress-percent">{{ Math.floor(file.percent) }}%</div>
        <a-progress :percent="file.percent" :show-info="false" :stroke-color="strokeColor" :stroke-width="6" trail-color="rgba(255,255,255,0.3)" class="progress-bar" />
        <div class="progress-label">{{ file.status === 'paused' ? $t('upload.pause') : file.status === 'queued' ? $t('upload.waiting') : $t('upload.uploading') }}</div>
      </template>
      <div v-else class="flex flex-col items-center text-red-400">
        <IconifyIcon icon="ant-design:exclamation-circle-outlined" class="text-2xl" />
        <span class="mt-1 px-1 text-center text-xs">{{ file.errorMsg || $t('upload.uploadFailed') }}</span>
      </div>
    </div>

    <!-- hover 操作遮罩 -->
    <div class="actions">
      <div v-if="file.status === 'done'" class="act" @click="ctx?.openPreview(file)">
        <IconifyIcon icon="ant-design:eye-outlined" class="text-lg" />
        <span class="text-xs">{{ $t('upload.preview') }}</span>
      </div>
      <div v-if="canPause" class="act" @click="ctx?.togglePause(file)">
        <IconifyIcon :icon="file.paused ? 'ant-design:play-circle-outlined' : 'ant-design:pause-circle-outlined'" class="text-lg" />
        <span class="text-xs">{{ file.paused ? $t('upload.resume') : $t('upload.pause') }}</span>
      </div>
      <div v-if="file.status === 'error' && !file.preFailed" class="act" @click="ctx?.retry(file)">
        <IconifyIcon icon="ant-design:reload-outlined" class="text-lg" />
        <span class="text-xs">{{ $t('upload.retry') }}</span>
      </div>
      <div class="act act-danger" @click="ctx?.remove(file)">
        <IconifyIcon icon="ant-design:delete-outlined" class="text-lg" />
        <span class="text-xs">{{ $t('upload.delete') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thumb-card {
  position: relative;
  width: 104px;
  height: 104px;
  overflow: hidden;
  background-color: #000;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-audio {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.thumb-video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.badge {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  padding: 1px 5px;
  font-size: 12px;
  color: #fff;
  background-color: rgb(0 0 0 / 55%);
  border-radius: 4px;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  background-color: rgb(0 0 0 / 55%);
}

.progress-percent {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
}

.progress-bar {
  width: 100%;
}

.progress-label {
  font-size: 12px;
  line-height: 1;
  color: rgb(255 255 255 / 85%);
}

.actions {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-color: rgb(0 0 0 / 55%);
  opacity: 0;
  transition: opacity 0.3s;
}

.thumb-card:hover .actions {
  opacity: 1;
}

.act {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s;
}

.act:hover {
  color: #4096ff;
}

.act-danger:hover {
  color: #ff7875;
}

.dark .thumb-card {
  border-color: #434343;
}

.dark .thumb-audio {
  background-color: rgb(255 255 255 / 4%);
}
</style>
