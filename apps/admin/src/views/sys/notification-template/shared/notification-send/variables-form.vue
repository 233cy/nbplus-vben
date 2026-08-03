<script setup lang="ts">
import { computed } from 'vue';

import { Input } from 'ant-design-vue';

import { $t } from '#/locales';

interface Props {
  /** 模板变量定义：key → 变量说明 */
  variables: Record<string, string>;
}

const props = defineProps<Props>();

/** 变量值：key → 输入内容 */
const modelValue = defineModel<Record<string, string>>({ default: () => ({}) });

const entries = computed(() => Object.entries(props.variables || {}));
</script>

<template>
  <div v-if="entries.length === 0" class="text-sm text-gray-500">
    {{ $t('sys.notification-template.testSendNoVariables') }}
  </div>
  <div v-else class="space-y-3">
    <div v-for="[key, desc] in entries" :key="key">
      <label class="mb-1 block text-sm">
        {{ key }}
        <span v-if="desc" class="ml-1 text-xs text-gray-500">({{ desc }})</span>
      </label>
      <Input v-model:value="modelValue[key]" :placeholder="desc || key" />
    </div>
  </div>
</template>
