<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { resolveLogicalPath } from '#/api/core/upload';

import { getAllowedMediaExtensions, getFileExt, resolveAccessType, useFileUpload, validateFileBySystem } from './composables/useFileUpload';

const props = withDefaults(
  defineProps<{
    /** 允许的格式，留空则自动取系统参数 storage.allowed_media_types */
    accept?: string;
    /** 访问策略: owner | public | login，为空时按 accessType 默认 */
    accessPolicy?: 'login' | 'owner' | 'public';
    /** 访问类型: authorized | public | login，默认 public */
    accessType?: 'authorized' | 'login' | 'public';
    /** 多个模式下最大数量，默认不限制 */
    maxCount?: number;
    /** 最大文件大小（MB），默认 0 表示仅由系统参数 storage.upload_max_size 兜底 */
    maxSize?: number;
    /**
     * v-model 绑定值。
     * 单个模式（multiple=false）：string，存储逻辑路径
     * 多个模式（multiple=true）：string，逗号分隔的多个逻辑路径
     */
    modelValue?: string;
    /** 是否支持多个上传，默认 false */
    multiple?: boolean;
  }>(),
  {
    accept: undefined,
    accessType: undefined,
    accessPolicy: undefined,
    modelValue: '',
    multiple: false,
    maxCount: 0,
    maxSize: 0,
  },
);

const emit = defineEmits<{
  change: [logicalPaths: string[], fullUrls: string[]];
  'update:modelValue': [value: string];
}>();

const { uploadFile } = useFileUpload();

function currentAccessType(): string {
  return resolveAccessType({ accessType: props.accessType, accessPolicy: props.accessPolicy });
}

// 已知音频扩展名；媒体白名单里除此之外的一律按视频渲染，新增视频格式无需在此维护
const AUDIO_EXTS = new Set(['aac', 'amr', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'wma']);

/** 根据逻辑路径 / 文件名推断媒体类型，决定渲染 video 还是 audio */
function mediaKind(pathOrName: string): 'audio' | 'video' {
  return AUDIO_EXTS.has(getFileExt(pathOrName)) ? 'audio' : 'video';
}

// a-upload 的 accept：优先外部传入，否则用系统参数 storage.allowed_media_types 拼成 .mp4,.mp3 形式
const acceptAttr = computed(() => {
  if (props.accept) return props.accept;
  const exts = getAllowedMediaExtensions();
  return exts.length > 0 ? exts.map(e => `.${e}`).join(',') : 'video/*,audio/*';
});

// =========================================================================
// 内部媒体列表：{ logicalPath, fullUrl, kind }
// =========================================================================
interface MediaItem {
  logicalPath: string;
  fullUrl: string;
  kind: 'audio' | 'video';
  uploading?: boolean;
}

const items = ref<MediaItem[]>([]);
const previewItem = ref<MediaItem | null>(null);
const previewVisible = ref(false);

// 将 modelValue（逗号分隔的逻辑路径）解析并转换为完整 URL
watch(
  () => props.modelValue,
  async val => {
    const paths = val ? val.split(',').filter(Boolean) : [];
    const existing = new Set(items.value.map(i => i.logicalPath));
    const toAdd = paths.filter(p => !existing.has(p));
    const toRemove = items.value.filter(i => i.logicalPath && !paths.includes(i.logicalPath));

    for (const item of toRemove) {
      items.value = items.value.filter(i => i.logicalPath !== item.logicalPath);
    }
    for (const path of toAdd) {
      const fullUrl = await resolveLogicalPath(path);
      items.value.push({ logicalPath: path, fullUrl, kind: mediaKind(path) });
    }
  },
  { immediate: true },
);

const canAdd = computed(() => {
  if (!props.multiple) return items.value.length === 0;
  if (props.maxCount > 0) return items.value.length < props.maxCount;
  return true;
});

// =========================================================================
// 文件选择
// =========================================================================
function handleBeforeUpload(file: File) {
  const ext = getFileExt(file.name);
  // 类型校验直接复用系统参数 storage.allowed_media_types，与后端白名单一致
  const mediaExts = getAllowedMediaExtensions();
  if (mediaExts.length > 0 && (!ext || !mediaExts.includes(ext))) {
    message.error($t('upload.onlySupportMediaFormat', { accept: mediaExts.join(', ') }));
    return false;
  }
  // 体积 + 总白名单兜底校验，与后端 storage.* 保持一致
  const preError = validateFileBySystem(file, props.maxSize);
  if (preError) {
    message.error(preError);
    return false;
  }

  const kind = mediaKind(file.name);
  const placeholder: MediaItem = { logicalPath: '', fullUrl: '', kind, uploading: true };
  items.value.push(placeholder);
  const idx = items.value.length - 1;

  uploadFile(file, {
    accessType: props.accessType,
    accessPolicy: props.accessPolicy,
  })
    .then(({ logicalPath, fullUrl }) => {
      items.value[idx] = { logicalPath, fullUrl, kind, uploading: false };
      emitChange();
    })
    .catch(() => {
      // 失败原因已由全局拦截器（XHR）或 composable（TUS）统一提示，这里只清理占位
      items.value.splice(idx, 1);
    });

  return false;
}

// =========================================================================
// 删除 / 预览 / emit
// =========================================================================
function handleRemove(idx: number) {
  items.value.splice(idx, 1);
  emitChange();
}

function handlePreview(item: MediaItem) {
  previewItem.value = item;
  previewVisible.value = true;
}

function emitChange() {
  const paths = items.value.filter(i => i.logicalPath).map(i => i.logicalPath);
  const urls = items.value.filter(i => i.fullUrl).map(i => i.fullUrl);
  emit('update:modelValue', paths.join(','));
  emit('change', paths, urls);
}

/** 只有合法的 http(s) URL 才渲染到 src，避免 public:// 等逻辑路径触发无效请求 */
function safeSrc(url: string): string {
  return url.startsWith('http') ? url : '';
}
</script>

<template>
  <div class="up-media-container">
    <div class="mb-2">
      <a-tag :color="currentAccessType() === 'authorized' ? 'red' : currentAccessType() === 'public' ? 'cyan' : 'purple'">
        <span v-if="currentAccessType() === 'authorized'">{{ $t('upload.privateResource') }}</span>
        <span v-else-if="currentAccessType() === 'public'">{{ $t('upload.publicResource') }}</span>
        <span v-else-if="currentAccessType() === 'login'">{{ $t('upload.protectedResource') }}</span>
      </a-tag>
    </div>
    <div class="media-list">
      <!-- 已上传媒体 -->
      <div v-for="(item, idx) in items" :key="idx" class="media-item group">
        <template v-if="item.uploading">
          <div class="media-placeholder">
            <IconifyIcon icon="ant-design:loading-outlined" class="animate-spin text-xl text-gray-400" />
          </div>
        </template>
        <template v-else>
          <!-- 视频：显示首帧缩略 -->
          <video v-if="item.kind === 'video'" :src="safeSrc(item.fullUrl)" class="media-thumb" muted preload="metadata"></video>
          <!-- 音频：图标占位 -->
          <div v-else class="media-audio-thumb">
            <IconifyIcon icon="ant-design:sound-outlined" class="text-3xl text-gray-400" />
          </div>

          <!-- 类型角标 -->
          <span class="media-badge">
            <IconifyIcon :icon="item.kind === 'video' ? 'ant-design:play-circle-outlined' : 'ant-design:audio-outlined'" />
          </span>

          <div class="media-mask">
            <div class="flex gap-3 text-white">
              <div class="flex cursor-pointer flex-col items-center hover:text-blue-300" @click="handlePreview(item)">
                <IconifyIcon icon="ant-design:play-circle-outlined" class="text-lg" />
                <span class="text-xs">{{ $t('upload.preview') }}</span>
              </div>
              <div class="flex cursor-pointer flex-col items-center hover:text-red-300" @click="handleRemove(idx)">
                <IconifyIcon icon="ant-design:delete-outlined" class="text-lg" />
                <span class="text-xs">{{ $t('upload.delete') }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 上传触发器 -->
      <a-upload v-if="canAdd" :accept="acceptAttr" :before-upload="handleBeforeUpload" :show-upload-list="false" :multiple="multiple" name="file">
        <div class="media-add-btn">
          <IconifyIcon icon="ant-design:plus-outlined" class="text-xl text-gray-400" />
          <div class="mt-1 text-xs text-gray-500">{{ $t('upload.uploadAction') }}</div>
        </div>
      </a-upload>
    </div>

    <!-- 预览：视频 / 音频内联播放 -->
    <a-modal v-model:open="previewVisible" :footer="null" :title="$t('upload.previewMedia')" width="800px" centered destroy-on-close @cancel="previewVisible = false">
      <video v-if="previewItem?.kind === 'video'" :src="safeSrc(previewItem?.fullUrl ?? '')" class="w-full" controls autoplay></video>
      <audio v-else-if="previewItem" :src="safeSrc(previewItem?.fullUrl ?? '')" class="w-full" controls autoplay></audio>
    </a-modal>
  </div>
</template>

<style scoped>
.up-media-container {
  width: 100%;
}

.media-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.media-item {
  position: relative;
  width: 160px;
  height: 104px;
  overflow: hidden;
  background-color: #000;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
}

.media-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-audio-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #fafafa;
}

.media-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 104px;
  background-color: #fafafa;
}

.media-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px 5px;
  font-size: 12px;
  color: #fff;
  background-color: rgb(0 0 0 / 55%);
  border-radius: 4px;
}

.media-mask {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 45%);
  opacity: 0;
  transition: opacity 0.3s;
}

.media-item:hover .media-mask {
  opacity: 1;
}

.media-add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 104px;
  cursor: pointer;
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.media-add-btn:hover {
  border-color: #1677ff;
}

.dark .media-item {
  border-color: #434343;
}

.dark .media-audio-thumb,
.dark .media-placeholder,
.dark .media-add-btn {
  background-color: rgb(255 255 255 / 4%);
  border-color: #434343;
}

.dark .media-add-btn:hover {
  border-color: #1668dc;
}
</style>
