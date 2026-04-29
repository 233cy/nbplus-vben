<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { VCropper } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { message } from 'ant-design-vue';

import { getTusFileInfo, getTusUrl, getUploadUrl } from '#/api/core/upload';
import { requestClient } from '#/api/request';
import { pathToFullUrl } from '#/utils/upload';

const props = withDefaults(
  defineProps<{
    /** 裁剪比例，默认 1:1 */
    aspectRatio?: string;
    /** 是否私有资源：1私有 2公开 3登录可查阅 */
    isPrivate?: number;
    /**
     * v-model 绑定值，存储逻辑路径（logicalPath）。
     * 组件内部自动调用 pathToFullUrl 接口将其转换为 fullUrl 用于回显，
     * 上传成功后同样自动更新显示，外部无需关心 fullUrl。
     */
    modelValue?: string;
    /** 头像框形状 */
    shape?: 'circle' | 'square';
  }>(),
  {
    aspectRatio: '1:1',
    isPrivate: 2,
    modelValue: '',
    shape: 'circle',
  },
);

const emit = defineEmits<{
  change: [logicalPath: string, fullUrl: string];
  'update:modelValue': [logicalPath: string];
}>();

const UPLOAD_CONFIG = {
  accept: 'image/png, image/jpeg, image/jpg, image/gif, image/webp',
  maxSize: 10, // MB
  tusThreshold: 2, // 超过此值走 TUS 分片上传
};

const previewVisible = ref(false);
const cropperVisible = ref(false);
const tempImage = ref('');
const originalFile = ref<File | null>(null);
const uploading = ref(false);
const cropperRef = ref<any>(null);

// 回显用的完整访问 URL，由 modelValue（logicalPath）自动解析得到
const internalDisplayUrl = ref('');
// 只有合法的 http(s) URL 才渲染到 img src，避免 public:// 等逻辑路径触发无效网络请求
const displaySrc = computed(() => (internalDisplayUrl.value.startsWith('http') ? internalDisplayUrl.value : ''));
// 标记是否刚刚完成上传（上传成功后 fullUrl 已知，跳过 watch 里的转换请求）
let skipNextWatch = false;

watch(
  () => props.modelValue,
  async logicalPath => {
    if (skipNextWatch) {
      skipNextWatch = false;
      return;
    }
    internalDisplayUrl.value = await pathToFullUrl(logicalPath);
  },
  { immediate: true },
);

/**
 * 查看头像大图
 */
function handlePreview() {
  previewVisible.value = true;
}

/**
 * 文件选择前拦截
 */
function handleBeforeUpload(file: File) {
  // 根据配置验证文件格式
  if (UPLOAD_CONFIG.accept && UPLOAD_CONFIG.accept !== '*') {
    const acceptList = UPLOAD_CONFIG.accept.split(',').map(t => t.trim());
    if (!acceptList.includes(file.type)) {
      message.error($t('upload.onlySupportImageFormat', { accept: UPLOAD_CONFIG.accept }));
      return false;
    }
  }

  // 验证大小
  const isLtMaxSize = file.size / 1024 / 1024 < UPLOAD_CONFIG.maxSize;
  if (!isLtMaxSize) {
    message.error($t('upload.imageSizeLimit', { maxSize: UPLOAD_CONFIG.maxSize }));
    return false;
  }

  // 读取本地文件为 base64 以便放入弹窗预览和裁剪
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.addEventListener('load', () => {
    tempImage.value = reader.result as string;
    originalFile.value = file;
    cropperVisible.value = true;
  });

  return false; // 阻止 a-upload 默认的自动上传行为
}

/**
 * 确认裁剪并上传
 */
async function handleCropOk() {
  if (!cropperRef.value || !originalFile.value) return;

  try {
    uploading.value = true;
    // 调用 VCropper 实例方法获取裁剪后的 blob
    const blob = await cropperRef.value.getCropImage('image/jpeg', 0.92, 'blob');
    if (!blob) {
      message.error($t('upload.cropFailed'));
      return;
    }

    const fileName = originalFile.value.name || 'avatar.jpg';

    // === 动态判定上传引擎 ===
    // blob.size 单位是 byte，转换为 MB
    const isBigFile = blob.size / 1024 / 1024 > UPLOAD_CONFIG.tusThreshold;

    isBigFile ? await uploadWithTus(blob, fileName) : await uploadWithXhr(blob, fileName);
  } catch {
    message.error($t('upload.uploadFailed'));
  } finally {
    uploading.value = false;
  }
}

/**
 * XHR 普通表单直传
 */
async function uploadWithXhr(blob: Blob, fileName: string) {
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('isPrivate', props.isPrivate.toString());

  const res: any = await requestClient.post(getUploadUrl(), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  handleUploadSuccess(res.logicalPath, res.fullUrl);
}

/**
 * TUS 分片断点续传
 */
function uploadWithTus(blob: Blob, fileName: string) {
  return new Promise<void>((resolve, reject) => {
    // 将 Blob 伪装成 File 对象交给 Uppy
    const fileForUppy = new File([blob], fileName, { type: blob.type });

    const uppy = new Uppy({
      autoProceed: true,
      allowMultipleUploadBatches: true,
    }).use(Tus, {
      endpoint: getTusUrl(),
      retryDelays: [1000, 3000],
      removeFingerprintOnSuccess: true,
    });

    uppy.addFile({
      name: fileName,
      type: fileForUppy.type,
      data: fileForUppy,
      meta: {
        isPrivate: props.isPrivate,
      },
    });

    uppy.on('upload-success', async (file, response: any) => {
      try {
        const tusUrl = response?.uploadURL || (file as any).uploadURL;
        if (tusUrl) {
          const fileId = tusUrl.split('/').pop();
          const infoRes: any = await getTusFileInfo({ uploadKey: fileId });
          handleUploadSuccess(infoRes.logicalPath, infoRes.fullUrl);
          resolve();
        } else {
          throw new Error('未获取到 Tus 上传地址');
        }
      } catch (error) {
        reject(error);
      } finally {
        uppy.destroy();
      }
    });

    uppy.on('upload-error', (_file, error) => {
      uppy.destroy();
      reject(error);
    });
  });
}

/**
 * 统一处理上传成功逻辑
 * @param logicalPath 逻辑路径，用于存库（emit 给父组件）
 * @param fullUrl 完整访问 URL，用于回显
 */
function handleUploadSuccess(logicalPath: string, fullUrl: string) {
  if (logicalPath && fullUrl) {
    skipNextWatch = true; // 上传成功，fullUrl 已知，跳过 watch 里的转换请求
    internalDisplayUrl.value = fullUrl;
    emit('update:modelValue', logicalPath);
    emit('change', logicalPath, fullUrl);
    message.success($t('upload.avatarUploadSuccess'));
    cropperVisible.value = false;
  } else {
    message.error($t('upload.uploadFailedNoUrl'));
  }
}

/**
 * 弹窗关闭时清理临时图片
 */
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
    <a-upload :accept="UPLOAD_CONFIG.accept" :before-upload="handleBeforeUpload" :show-upload-list="false" name="file">
      <!-- 【核心】暴露默认插槽，允许外部完全自定义触发器和回显内容 -->
      <slot :image="displaySrc" :loading="uploading" name="default">
        <!-- 如果外部没有传入插槽，就渲染默认的 Antd 头像上传样式 -->
        <div :class="shape" class="default-avatar-trigger group">
          <img v-if="displaySrc" :src="displaySrc" alt="avatar" class="avatar-image" />
          <div v-else class="avatar-placeholder">
            <IconifyIcon v-if="uploading" icon="ant-design:loading-outlined" class="animate-spin text-xl text-gray-400" />
            <IconifyIcon v-else icon="ant-design:plus-outlined" class="text-xl text-gray-400" />
            <div class="mt-2 text-sm text-gray-500">{{ $t('upload.uploadAvatar') }}</div>
          </div>

          <!-- 悬浮遮罩 (仅在有图片时显示操作按钮) -->
          <div v-if="displaySrc" class="avatar-mask">
            <IconifyIcon v-if="uploading" icon="ant-design:loading-outlined" class="animate-spin text-2xl text-white" />
            <div v-else class="flex w-full items-center justify-center gap-4 text-white">
              <!-- 查看大图 (阻止冒泡避免触发上传) -->
              <div class="group/preview flex cursor-pointer flex-col items-center transition-colors hover:text-blue-400" @click.stop="handlePreview">
                <IconifyIcon icon="ant-design:eye-outlined" class="text-xl" />
                <span class="mt-1 text-xs opacity-90 group-hover/preview:opacity-100">{{ $t('upload.preview') }}</span>
              </div>
              <!-- 修改头像 (允许冒泡以触发 a-upload) -->
              <div class="group/edit flex cursor-pointer flex-col items-center transition-colors hover:text-blue-400">
                <IconifyIcon icon="ant-design:camera-outlined" class="text-xl" />
                <span class="mt-1 text-xs opacity-90 group-hover/edit:opacity-100">{{ $t('upload.modify') }}</span>
              </div>
            </div>
          </div>
        </div>
      </slot>
    </a-upload>
    <div class="mt-2">
      <a-tag :color="isPrivate === 1 ? 'red' : isPrivate === 2 ? 'cyan' : 'purple'">
        <span v-if="isPrivate === 1">{{ $t('upload.privateResource') }}</span>
        <span v-else-if="isPrivate === 2">{{ $t('upload.publicResource') }}</span>
        <span v-else-if="isPrivate === 3">{{ $t('upload.protectedResource') }}</span>
      </a-tag>
    </div>

    <!-- 裁剪弹窗 -->
    <a-modal
      v-model:open="cropperVisible"
      :confirm-loading="uploading"
      destroy-on-close
      :title="$t('upload.cropAndUpload')"
      width="700px"
      @cancel="handleModalCancel"
      @ok="handleCropOk"
    >
      <div class="flex justify-center p-4">
        <VCropper v-if="cropperVisible && tempImage" ref="cropperRef" :width="600" :height="600" :aspect-ratio="aspectRatio" :img="tempImage" />
      </div>
    </a-modal>

    <!-- 查看大图弹窗 -->
    <a-modal v-model:open="previewVisible" :footer="null" :title="$t('upload.previewAvatar')" width="800px" centered @cancel="previewVisible = false">
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

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 40%);
  opacity: 0;
  transition: opacity 0.3s;
}

.default-avatar-trigger:hover .avatar-mask {
  opacity: 1;
}

/* 适配暗黑模式 */
.dark .default-avatar-trigger {
  background-color: rgb(255 255 255 / 4%);
  border-color: #434343;
}

.dark .default-avatar-trigger:hover {
  border-color: #1668dc;
}
</style>
