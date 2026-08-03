<script setup lang="ts">
import { computed } from 'vue';

import { Tag } from 'ant-design-vue';

import { useDict } from '#/utils/dict';

const props = defineProps<{
  code: string;
  /** 找不到对应字典项时的兜底文本，默认显示原始值 */
  fallback?: string;
  value: null | number | string | undefined;
}>();

const { items } = useDict(props.code);

const dictItem = computed(() => items.value.find((i) => String(i.value) === String(props.value)));
</script>

<template>
  <span v-if="value === null || value === undefined || value === ''">-</span>
  <Tag v-else-if="dictItem?.color" :color="dictItem.color">
    {{ dictItem.label }}
  </Tag>
  <span v-else-if="dictItem">{{ dictItem.label }}</span>
  <span v-else class="text-gray-400">{{ fallback ?? value }}</span>
</template>
