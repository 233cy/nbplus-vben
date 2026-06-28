<script setup lang="ts">
import type { QueueFile, UploadType } from './composables/useUploadQueue';

import { computed, provide, ref, watch } from 'vue';

import { resolveLogicalPaths } from '#/api/core/upload';

import MediaPreviewModal from './components/MediaPreviewModal.vue';
import { getAllowedFileExtensions, getAllowedImageExtensions, getAllowedMediaExtensions } from './composables/useFileUpload';
import { UPLOAD_CTX, useUploadQueue } from './composables/useUploadQueue';

const props = withDefaults(
  defineProps<{
    /** 选完是否自动开始上传（队列 limit:1 串行），默认 true */
    accessPolicy?: 'login' | 'owner' | 'public';
    accessType?: 'authorized' | 'login' | 'public';
    autoStart?: boolean;
    maxCount?: number;
    maxSize?: number;
    /** v-model：逗号分隔的逻辑路径 */
    modelValue?: string;
    type: UploadType;
  }>(),
  {
    accessType: undefined,
    accessPolicy: undefined,
    autoStart: true,
    maxCount: 1,
    maxSize: 0,
    modelValue: '',
  },
);

const isMultiple = computed(() => props.maxCount > 1);

const emit = defineEmits<{
  change: [logicalPaths: string[], fullUrls: string[]];
  'update:modelValue': [value: string];
}>();

const queue = useUploadQueue({
  type: props.type,
  accessType: props.accessType,
  accessPolicy: props.accessPolicy,
  multiple: isMultiple.value,
  maxCount: props.maxCount,
  maxSize: props.maxSize,
});
const { files, addFiles, addResolved, canAddMore, start, togglePause, retry, remove, download } = queue;

const inputRef = ref<HTMLInputElement>();

// accept：按 type 取系统参数白名单拼成 .mp4,.jpg 形式；file 取 allowed_file_types
const acceptAttr = computed(() => {
  if (props.type === 'media') {
    const e = getAllowedMediaExtensions();
    return e.length > 0 ? e.map(x => `.${x}`).join(',') : 'video/*,audio/*';
  }
  if (props.type === 'image' || props.type === 'avatar') {
    const e = getAllowedImageExtensions();
    return e.length > 0 ? e.map(x => `.${x}`).join(',') : 'image/*';
  }
  if (props.type === 'file') {
    const e = getAllowedFileExtensions();
    return e.length > 0 ? e.map(x => `.${x}`).join(',') : '';
  }
  return '';
});

function pick() {
  inputRef.value?.click();
}

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) {
    addFiles(input.files);
    if (props.autoStart) start();
  }
  input.value = ''; // 重置，允许再次选择同名文件
}

// ===== 预览 =====
const previewVisible = ref(false);
const previewFile = ref<null | QueueFile>(null);
function openPreview(f: QueueFile) {
  previewFile.value = f;
  previewVisible.value = true;
}

// ===== v-model 回显：逻辑路径 → fullUrl，注入已完成项 =====
watch(
  () => props.modelValue,
  async val => {
    const paths = val ? val.split(',').filter(Boolean) : [];
    const existing = new Set(files.value.map(f => f.logicalPath).filter(Boolean));
    const toAdd = paths.filter(p => !existing.has(p));
    if (toAdd.length === 0) return;
    const map = await resolveLogicalPaths(toAdd);
    toAdd.forEach(p => addResolved(p, map[p] || ''));
  },
  { immediate: true },
);

// ===== v-model 同步：已完成项的逻辑路径回写，值相同不 emit 避免回环 =====
watch(
  files,
  () => {
    const done = files.value.filter(f => f.status === 'done' && f.logicalPath);
    const paths = done.map(f => f.logicalPath as string);
    const urls = done.map(f => f.downloadUrl || '');
    const val = paths.join(',');
    if (val !== (props.modelValue ?? '')) {
      emit('update:modelValue', val);
      emit('change', paths, urls);
    }
  },
  { deep: true },
);

// 给缩略卡片子组件注入操作上下文
provide(UPLOAD_CTX, { start, togglePause, retry, remove, download, openPreview });

defineExpose({ files, addFiles, start, togglePause, retry, remove, download, pick, canAddMore });
</script>

<template>
  <div>
    <input ref="inputRef" type="file" :accept="acceptAttr" :multiple="isMultiple" class="hidden" @change="onInputChange" />
    <slot
      :files="files"
      :can-add="canAddMore()"
      :pick="pick"
      :start="start"
      :toggle-pause="togglePause"
      :retry="retry"
      :remove="remove"
      :download="download"
      :open-preview="openPreview"
    ></slot>
    <MediaPreviewModal v-model:open="previewVisible" :file="previewFile" />
  </div>
</template>
