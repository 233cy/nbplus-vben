<script setup lang="ts">
import type { QueueFile } from '../composables/useUploadQueue';

import { computed } from 'vue';

import { $t } from '@vben/locales';

const props = defineProps<{
  file?: null | QueueFile;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

/** 只有合法 http(s) 地址才渲染，避免 public:// 等逻辑路径触发无效请求 */
const src = computed(() => {
  const url = props.file?.downloadUrl || props.file?.thumbUrl || '';
  return url.startsWith('http') || url.startsWith('blob:') ? url : '';
});

function onClose() {
  emit('update:open', false);
}
</script>

<template>
  <a-modal :open="open" :footer="null" :title="$t('core.upload.preview')" width="800px" centered destroy-on-close @cancel="onClose">
    <img v-if="file?.kind === 'image'" :src="src" alt="preview" class="w-full" />
    <video v-else-if="file?.kind === 'video'" :src="src" class="w-full" controls autoplay></video>
    <audio v-else-if="file?.kind === 'audio'" :src="src" class="w-full" controls autoplay></audio>
  </a-modal>
</template>
