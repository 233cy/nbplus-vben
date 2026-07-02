<script setup lang="ts">
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import ThumbCard from './components/ThumbCard.vue';
import Uploader from './Uploader.vue';

const props = withDefaults(
  defineProps<{
    /** 访问策略: owner | public | login，为空时按 accessType 默认 */
    accessPolicy?: 'login' | 'owner' | 'public';
    /** 访问类型: authorized | public | login，默认 public */
    accessType?: 'authorized' | 'login' | 'public';
    /** 是否启用秒传，默认 true */
    enableFastUpload?: boolean;
    /** 最大数量，默认 1（单张）；大于 1 时自动开启多选 */
    maxCount?: number;
    /** 最大文件大小（MB），默认 0 仅由系统参数兜底 */
    maxSize?: number;
    /** v-model：单张为逻辑路径，多张为逗号分隔的逻辑路径 */
    modelValue?: string;
    /** 是否显示数量/大小限制提示，默认 true */
    showLimit?: boolean;
  }>(),
  {
    accessType: undefined,
    accessPolicy: undefined,
    enableFastUpload: true,
    modelValue: '',
    maxCount: 1,
    maxSize: 0,
    showLimit: true,
  },
);

defineEmits<{
  change: [logicalPaths: string[], fullUrls: string[]];
  'update:modelValue': [value: string];
}>();

const currentAccessType = computed(() => props.accessType ?? 'public');

const limitText = computed(() => {
  if (!props.showLimit) return '';
  const parts: string[] = [];
  if (props.maxCount > 1) {
    parts.push($t('core.upload.limitHintCount', { count: props.maxCount }));
  }
  if (props.maxSize > 0) {
    parts.push($t('core.upload.limitHintSize', { size: props.maxSize }));
  }
  return parts.join('，');
});
</script>

<template>
  <div class="up-img-container">
    <div class="mb-2">
      <a-tag :color="currentAccessType === 'authorized' ? 'red' : currentAccessType === 'public' ? 'cyan' : 'purple'">
        <span v-if="currentAccessType === 'authorized'">{{ $t('core.upload.privateResource') }}</span>
        <span v-else-if="currentAccessType === 'public'">{{ $t('core.upload.publicResource') }}</span>
        <span v-else>{{ $t('core.upload.protectedResource') }}</span>
      </a-tag>
      <span v-if="limitText" class="ml-2 text-xs text-gray-400">{{ limitText }}</span>
    </div>
    <Uploader
      type="image"
      :model-value="modelValue"
      :access-type="accessType"
      :access-policy="accessPolicy"
      :enable-fast-upload="enableFastUpload"
      :max-count="maxCount"
      :max-size="maxSize"
      @update:model-value="$emit('update:modelValue', $event)"
      @change="(p, u) => $emit('change', p, u)"
    >
      <template #default="{ files, canAdd, pick }">
        <div class="grid-list">
          <ThumbCard v-for="f in files" :key="f.uid" :file="f" />
          <div v-if="canAdd" class="add-btn" @click="pick">
            <IconifyIcon icon="ant-design:plus-outlined" class="text-xl text-gray-400" />
            <div class="mt-1 text-xs text-gray-500">{{ $t('core.upload.uploadAction') }}</div>
          </div>
        </div>
      </template>
    </Uploader>
  </div>
</template>

<style scoped>
.up-img-container {
  width: 100%;
}

.grid-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.add-btn {
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

.add-btn:hover {
  border-color: #1677ff;
}

.dark .add-btn {
  background-color: rgb(255 255 255 / 4%);
  border-color: #434343;
}

.dark .add-btn:hover {
  border-color: #1668dc;
}
</style>
