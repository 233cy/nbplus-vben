<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { VCropper } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { resolveLogicalPath } from '#/api/core/upload';

import { validateFileBySystem } from './composables/useFileUpload';
import { useUploadQueue } from './composables/useUploadQueue';

const props = withDefaults(
  defineProps<{
    /** 访问策略: owner | public | login，为空时按 accessType 默认 */
    accessPolicy?: 'login' | 'owner' | 'public';
    /** 访问类型: authorized | public | login，默认 public */
    accessType?: 'authorized' | 'login' | 'public';
    /** 是否启用秒传，默认 true */
    enableFastUpload?: boolean;
    /** 裁剪比例，默认 1:1 */
    aspectRatio?: string;
    /** v-model：存逻辑路径，组件自动解析为 fullUrl 回显 */
    modelValue?: string;
    /** 头像框形状 */
    shape?: 'circle' | 'square';
  }>(),
  {
    aspectRatio: '1:1',
    accessType: undefined,
    accessPolicy: undefined,
    enableFastUpload: true,
    modelValue: '',
    shape: 'circle',
  },
);

const emit = defineEmits<{
  change: [logicalPath: string, fullUrl: string];
  'update:modelValue': [logicalPath: string];
}>();

const queue = useUploadQueue({
  type: 'avatar',
  accessType: props.accessType,
  accessPolicy: props.accessPolicy,
  enableFastUpload: props.enableFastUpload,
  multiple: false,
  maxCount: 1,
});
const { retry } = queue;

const ACCEPT = 'image/png, image/jpeg, image/jpg, image/gif, image/webp';

const previewVisible = ref(false);
const cropperVisible = ref(false);
const tempImage = ref('');
const originalFile = ref<File | null>(null);
const cropperRef = ref<any>(null);

const current = computed(() => queue.files.value[0]);
const displaySrc = computed(() => {
  const url = current.value?.thumbUrl || current.value?.downloadUrl || '';
  return url.startsWith('http') || url.startsWith('blob:') ? url : '';
});
const uploading = computed(() => {
  const s = current.value?.status;
  return s === 'queued' || s === 'uploading' || s === 'wait' || s === 'checking';
});
const isError = computed(() => current.value?.status === 'error');
const percent = computed(() => current.value?.percent ?? 0);

const currentAccessType = computed(() => props.accessType ?? 'public');

// 回显：modelValue（逻辑路径）→ fullUrl
watch(
  () => props.modelValue,
  async val => {
    if (val === (current.value?.logicalPath ?? '')) return;
    queue.clear();
    if (val) {
      const url = await resolveLogicalPath(val);
      queue.addResolved(val, url);
    }
  },
  { immediate: true },
);

// 同步：上传完成后回写逻辑路径（值相同不 emit 避免回环）
watch(
  queue.files,
  () => {
    const f = current.value;
    if (f?.status === 'done' && f.logicalPath && f.logicalPath !== props.modelValue) {
      emit('update:modelValue', f.logicalPath);
      emit('change', f.logicalPath, f.downloadUrl || '');
    }
  },
  { deep: true },
);

function handlePreview() {
  previewVisible.value = true;
}

function handleBeforeUpload(file: File) {
  const acceptList = ACCEPT.split(',').map(t => t.trim());
  if (!acceptList.includes(file.type)) {
    message.error($t('core.upload.onlySupportImageFormat', { accept: ACCEPT }));
    return false;
  }
  const preError = validateFileBySystem(file);
  if (preError) {
    message.error(preError);
    return false;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.addEventListener('load', () => {
    tempImage.value = reader.result as string;
    originalFile.value = file;
    cropperVisible.value = true;
  });
  return false; // 阻止默认上传，先裁剪
}

async function handleCropOk() {
  if (!cropperRef.value || !originalFile.value) return;
  let blob: Blob | null = null;
  try {
    blob = await cropperRef.value.getCropImage('image/jpeg', 0.92, 'blob');
  } catch {
    blob = null;
  }
  if (!blob) {
    message.error($t('core.upload.cropFailed'));
    return;
  }
  const file = new File([blob], originalFile.value.name || 'avatar.jpg', { type: blob.type });
  queue.clear(); // 头像为替换语义，先清旧再传新
  queue.addFiles([file]);
  queue.start();
  cropperVisible.value = false;
}

function handleModalCancel() {
  cropperVisible.value = false;
  setTimeout(() => {
    tempImage.value = '';
    originalFile.value = null;
  }, 300);
}
</script>

<template>
  <div class="avatar-upload-container">
    <a-upload :accept="ACCEPT" :before-upload="handleBeforeUpload" :show-upload-list="false" name="file">
      <slot :image="displaySrc" :loading="uploading" name="default">
        <div :class="[shape, { 'avatar-error': isError }]" class="default-avatar-trigger group">
          <img v-if="displaySrc" :src="displaySrc" alt="avatar" class="avatar-image" />
          <div v-else class="avatar-placeholder">
            <IconifyIcon icon="ant-design:plus-outlined" class="text-xl text-gray-400" />
            <div class="mt-2 text-sm text-gray-500">{{ $t('core.upload.uploadAvatar') }}</div>
          </div>

          <!-- 上传中圆圈进度 -->
          <div v-if="uploading" class="avatar-progress">
            <a-progress type="circle" :percent="percent" :width="72" stroke-color="hsl(var(--primary))" trail-color="rgba(255,255,255,0.3)" />
          </div>

          <!-- 悬浮遮罩（有图且非上传中时） -->
          <div v-if="displaySrc && !uploading" class="avatar-mask" :class="{ 'avatar-mask-error': isError }">
            <div class="flex w-full items-center justify-center gap-4 text-white">
              <div class="group/preview flex cursor-pointer flex-col items-center transition-colors hover:text-blue-400" @click.stop="handlePreview">
                <IconifyIcon icon="ant-design:eye-outlined" class="text-xl" />
                <span class="mt-1 text-xs opacity-90">{{ $t('core.upload.preview') }}</span>
              </div>
              <div v-if="isError" class="group/retry flex cursor-pointer flex-col items-center transition-colors hover:text-blue-400" @click.stop="current && retry(current)">
                <IconifyIcon icon="ant-design:reload-outlined" class="text-xl" />
                <span class="mt-1 text-xs opacity-90">{{ $t('core.upload.retry') }}</span>
              </div>
              <div v-else class="group/edit flex cursor-pointer flex-col items-center transition-colors hover:text-blue-400">
                <IconifyIcon icon="ant-design:camera-outlined" class="text-xl" />
                <span class="mt-1 text-xs opacity-90">{{ $t('core.upload.modify') }}</span>
              </div>
            </div>
          </div>
        </div>
      </slot>
    </a-upload>
    <div class="mt-2">
      <a-tag :color="currentAccessType === 'authorized' ? 'red' : currentAccessType === 'public' ? 'cyan' : 'purple'">
        <span v-if="currentAccessType === 'authorized'">{{ $t('core.upload.privateResource') }}</span>
        <span v-else-if="currentAccessType === 'public'">{{ $t('core.upload.publicResource') }}</span>
        <span v-else>{{ $t('core.upload.protectedResource') }}</span>
      </a-tag>
    </div>

    <!-- 裁剪弹窗 -->
    <a-modal v-model:open="cropperVisible" destroy-on-close :title="$t('core.upload.cropAndUpload')" width="700px" @cancel="handleModalCancel" @ok="handleCropOk">
      <div class="flex justify-center p-4">
        <VCropper v-if="cropperVisible && tempImage" ref="cropperRef" :width="600" :height="600" :aspect-ratio="aspectRatio" :img="tempImage" />
      </div>
    </a-modal>

    <!-- 查看大图弹窗 -->
    <a-modal v-model:open="previewVisible" :footer="null" :title="$t('core.upload.previewAvatar')" width="800px" centered @cancel="previewVisible = false">
      <img v-if="displaySrc" :src="displaySrc" alt="avatar" class="w-full" />
    </a-modal>
  </div>
</template>

<style scoped>
.avatar-upload-container {
  display: inline-block;
}

.default-avatar-trigger {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 104px;
  height: 104px;
  overflow: hidden;
  cursor: pointer;
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  transition: border-color 0.3s;
}

.default-avatar-trigger:hover {
  border-color: #1677ff;
}

.default-avatar-trigger.avatar-error {
  border-color: #ff4d4f;
}

.default-avatar-trigger.circle {
  border-radius: 50%;
}

.default-avatar-trigger.square {
  border-radius: 8px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-progress {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 45%);
}

.avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 40%);
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-mask-error {
  background-color: rgb(220 38 38 / 55%);
  opacity: 1;
}

.default-avatar-trigger:hover .avatar-mask {
  opacity: 1;
}

.dark .default-avatar-trigger {
  background-color: rgb(255 255 255 / 4%);
  border-color: #434343;
}

.dark .default-avatar-trigger:hover {
  border-color: #1668dc;
}
</style>
