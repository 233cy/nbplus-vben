<script setup lang="ts">
import { ref } from 'vue';

import { VCropper } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { message } from 'ant-design-vue';

import { getTusFileInfo, getTusUrl, getUploadUrl } from '#/api/core/upload';
import { requestClient } from '#/api/request';

const props = withDefaults(
  defineProps<{
    /** 裁剪比例，默认 1:1 */
    aspectRatio?: string;
    /** 是否私有资源 */
    isPrivate?: number;
    /** 当前头像地址（支持 v-model:value） */
    modelValue?: string;
    /** 默认头像框的形状 */
    shape?: 'circle' | 'square';
  }>(),
  {
    aspectRatio: '1:1',
    isPrivate: 2, // 默认公开资源
    modelValue: '',
    shape: 'circle',
  },
);

const emit = defineEmits<{
  change: [string];
  'update:modelValue': [string];
}>();

// 全局/后台配置项 (后续可接入后台获取的配置)
const UPLOAD_CONFIG = {
  accept: 'image/png, image/jpeg, image/jpg, image/gif, image/webp',
  maxSize: 10, // 文件大小限制 (MB)
  tusThreshold: 2, // 触发 TUS 上传的阈值 (MB)，大于此值将自动使用 TUS 引擎
};

// 内部状态
const previewVisible = ref(false);
const cropperVisible = ref(false);
const tempImage = ref<string>('');
const originalFile = ref<File | null>(null);
const uploading = ref(false);
const cropperRef = ref<any>(null);

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
    const acceptList = UPLOAD_CONFIG.accept.split(',').map((t) => t.trim());
    if (!acceptList.includes(file.type)) {
      message.error($t('page.upload.onlySupportImageFormat', { accept: UPLOAD_CONFIG.accept }));
      return false;
    }
  }

  // 验证大小
  const isLtMaxSize = file.size / 1024 / 1024 < UPLOAD_CONFIG.maxSize;
  if (!isLtMaxSize) {
    message.error($t('page.upload.imageSizeLimit', { maxSize: UPLOAD_CONFIG.maxSize }));
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
      message.error($t('page.upload.cropFailed'));
      return;
    }

    const fileName = originalFile.value.name || 'avatar.jpg';

    // === 动态判定上传引擎 ===
    // blob.size 单位是 byte，转换为 MB
    const isBigFile = blob.size / 1024 / 1024 > UPLOAD_CONFIG.tusThreshold;

    isBigFile ? await uploadWithTus(blob, fileName) : await uploadWithXhr(blob, fileName);
  } catch (error) {
    console.error(error);
    message.error($t('page.upload.uploadFailed'));
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

  handleUploadSuccess(res.fullUrl || res.url || res.data?.fullUrl);
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
          const url = infoRes?.data?.fullUrl || infoRes?.fullUrl;
          handleUploadSuccess(url);
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

    uppy.on('upload-error', (file, error) => {
      uppy.destroy();
      reject(error);
    });
  });
}

/**
 * 统一处理上传成功逻辑
 */
function handleUploadSuccess(url: string) {
  if (url) {
    emit('update:modelValue', url);
    emit('change', url);
    message.success($t('page.upload.avatarUploadSuccess'));
    cropperVisible.value = false;
  } else {
    message.error($t('page.upload.uploadFailedNoUrl'));
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
      <slot :image="modelValue" :loading="uploading" name="default">
        <!-- 如果外部没有传入插槽，就渲染默认的 Antd 头像上传样式 -->
        <div :class="shape" class="default-avatar-trigger group">
          <img v-if="modelValue" :src="modelValue" alt="avatar" class="avatar-image" />
          <div v-else class="avatar-placeholder">
            <IconifyIcon v-if="uploading" icon="ant-design:loading-outlined" class="animate-spin text-xl text-gray-400" />
            <IconifyIcon v-else icon="ant-design:plus-outlined" class="text-xl text-gray-400" />
            <div class="mt-2 text-sm text-gray-500">{{ $t('page.upload.uploadAvatar') }}</div>
          </div>

          <!-- 悬浮遮罩 (仅在有图片时显示操作按钮) -->
          <div v-if="modelValue" class="avatar-mask">
            <IconifyIcon v-if="uploading" icon="ant-design:loading-outlined" class="animate-spin text-2xl text-white" />
            <div v-else class="flex w-full items-center justify-center gap-4 text-white">
              <!-- 查看大图 (阻止冒泡避免触发上传) -->
              <div class="group/preview flex cursor-pointer flex-col items-center transition-colors hover:text-blue-400" @click.stop="handlePreview">
                <IconifyIcon icon="ant-design:eye-outlined" class="text-xl" />
                <span class="mt-1 text-xs opacity-90 group-hover/preview:opacity-100">{{ $t('page.upload.preview') }}</span>
              </div>
              <!-- 修改头像 (允许冒泡以触发 a-upload) -->
              <div class="group/edit flex cursor-pointer flex-col items-center transition-colors hover:text-blue-400">
                <IconifyIcon icon="ant-design:camera-outlined" class="text-xl" />
                <span class="mt-1 text-xs opacity-90 group-hover/edit:opacity-100">{{ $t('page.upload.modify') }}</span>
              </div>
            </div>
          </div>
        </div>
      </slot>
    </a-upload>

    <!-- 裁剪弹窗 -->
    <a-modal
      v-model:open="cropperVisible"
      :confirm-loading="uploading"
      destroy-on-close
      :title="$t('page.upload.cropAndUpload')"
      width="700px"
      @cancel="handleModalCancel"
      @ok="handleCropOk"
    >
      <div class="flex justify-center p-4">
        <VCropper v-if="cropperVisible && tempImage" ref="cropperRef" :width="600" :height="600" :aspect-ratio="aspectRatio" :img="tempImage" />
      </div>
    </a-modal>

    <!-- 查看大图弹窗 -->
    <a-modal v-model:open="previewVisible" :footer="null" :title="$t('page.upload.previewAvatar')" width="800px" centered @cancel="previewVisible = false">
      <img :src="modelValue" alt="avatar" class="w-full" />
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
