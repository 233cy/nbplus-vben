<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { resolveLogicalPath } from '#/api/core/upload';

import { resolveAccessType, useFileUpload, validateFileBySystem } from './composables/useFileUpload';

const props = withDefaults(
  defineProps<{
    /** 允许的图片格式 */
    accept?: string;
    /** 访问策略: owner | public | login，为空时按 accessType 默认 */
    accessPolicy?: 'login' | 'owner' | 'public';
    /** 访问类型: authorized | public | login，默认 public */
    accessType?: 'authorized' | 'login' | 'public';
    /** 多张模式下最大数量，默认不限制 */
    maxCount?: number;
    /** 最大文件大小（MB），默认 10 */
    maxSize?: number;
    /**
     * v-model 绑定值。
     * 单张模式（multiple=false）：string，存储逻辑路径
     * 多张模式（multiple=true）：string，逗号分隔的多个逻辑路径
     */
    modelValue?: string;
    /** 是否支持多张上传，默认 false */
    multiple?: boolean;
  }>(),
  {
    accessType: undefined,
    accessPolicy: undefined,
    modelValue: '',
    multiple: false,
    maxCount: 0,
    accept: 'image/png, image/jpeg, image/jpg, image/gif, image/webp',
    maxSize: 10,
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

// =========================================================================
// 内部图片列表：{ logicalPath, fullUrl }
// =========================================================================
interface ImgItem {
  logicalPath: string;
  fullUrl: string;
  uploading?: boolean;
}

const items = ref<ImgItem[]>([]);
const previewUrl = ref('');
const previewVisible = ref(false);

// 将 modelValue（逗号分隔的逻辑路径）解析并转换为完整 URL
watch(
  () => props.modelValue,
  async val => {
    const paths = val ? val.split(',').filter(Boolean) : [];
    // 只处理新增的路径，避免重复请求
    const existing = new Set(items.value.map(i => i.logicalPath));
    const toAdd = paths.filter(p => !existing.has(p));
    const toRemove = items.value.filter(i => !paths.includes(i.logicalPath));

    for (const item of toRemove) {
      items.value = items.value.filter(i => i.logicalPath !== item.logicalPath);
    }
    for (const path of toAdd) {
      const fullUrl = await resolveLogicalPath(path);
      items.value.push({ logicalPath: path, fullUrl });
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
  const acceptList = props.accept.split(',').map(t => t.trim());
  if (!acceptList.includes(file.type)) {
    message.error($t('upload.onlySupportImageFormat', { accept: props.accept }));
    return false;
  }
  // 体积 + 扩展名白名单：取系统参数与组件 maxSize 的较严值，与后端兜底一致
  const preError = validateFileBySystem(file, props.maxSize);
  if (preError) {
    message.error(preError);
    return false;
  }

  // 占位，显示上传中状态
  const placeholder: ImgItem = { logicalPath: '', fullUrl: '', uploading: true };
  items.value.push(placeholder);
  const idx = items.value.length - 1;

  uploadFile(file, {
    accessType: props.accessType,
    accessPolicy: props.accessPolicy,
  })
    .then(({ logicalPath, fullUrl }) => {
      items.value[idx] = { logicalPath, fullUrl, uploading: false };
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

function handlePreview(url: string) {
  previewUrl.value = url;
  previewVisible.value = true;
}

function emitChange() {
  const paths = items.value.filter(i => i.logicalPath).map(i => i.logicalPath);
  const urls = items.value.filter(i => i.fullUrl).map(i => i.fullUrl);
  emit('update:modelValue', paths.join(','));
  emit('change', paths, urls);
}
</script>

<template>
  <div class="up-img-container">
    <div class="mb-2">
      <a-tag :color="currentAccessType() === 'authorized' ? 'red' : currentAccessType() === 'public' ? 'cyan' : 'purple'">
        <span v-if="currentAccessType() === 'authorized'">{{ $t('upload.privateResource') }}</span>
        <span v-else-if="currentAccessType() === 'public'">{{ $t('upload.publicResource') }}</span>
        <span v-else-if="currentAccessType() === 'login'">{{ $t('upload.protectedResource') }}</span>
      </a-tag>
    </div>
    <div class="img-list">
      <!-- 已上传图片 -->
      <div v-for="(item, idx) in items" :key="idx" class="img-item group">
        <template v-if="item.uploading">
          <div class="img-placeholder">
            <IconifyIcon icon="ant-design:loading-outlined" class="animate-spin text-xl text-gray-400" />
          </div>
        </template>
        <template v-else>
          <img :src="item.fullUrl.startsWith('http') ? item.fullUrl : ''" alt="" class="img-thumb" />
          <div class="img-mask">
            <div class="flex gap-3 text-white">
              <div class="flex cursor-pointer flex-col items-center hover:text-blue-300" @click="handlePreview(item.fullUrl)">
                <IconifyIcon icon="ant-design:eye-outlined" class="text-lg" />
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
      <a-upload v-if="canAdd" :accept="accept" :before-upload="handleBeforeUpload" :show-upload-list="false" :multiple="multiple" name="file">
        <div class="img-add-btn">
          <IconifyIcon icon="ant-design:plus-outlined" class="text-xl text-gray-400" />
          <div class="mt-1 text-xs text-gray-500">{{ $t('upload.uploadAction') }}</div>
        </div>
      </a-upload>
    </div>

    <!-- 预览大图 -->
    <a-modal v-model:open="previewVisible" :footer="null" :title="$t('upload.preview')" width="800px" centered @cancel="previewVisible = false">
      <img v-if="previewUrl" :src="previewUrl" alt="preview" class="w-full" />
    </a-modal>
  </div>
</template>

<style scoped>
.up-img-container {
  width: 100%;
}

.img-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.img-item {
  position: relative;
  width: 104px;
  height: 104px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
}

.img-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #fafafa;
}

.img-mask {
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

.img-item:hover .img-mask {
  opacity: 1;
}

.img-add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 104px;
  height: 104px;
  cursor: pointer;
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.img-add-btn:hover {
  border-color: #1677ff;
}

.dark .img-item {
  border-color: #434343;
}

.dark .img-placeholder,
.dark .img-add-btn {
  background-color: rgb(255 255 255 / 4%);
  border-color: #434343;
}

.dark .img-add-btn:hover {
  border-color: #1668dc;
}
</style>
