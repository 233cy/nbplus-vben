<script setup lang="ts">
import { computed } from 'vue';

import { RadioButton, RadioGroup } from 'ant-design-vue';

import { useDict } from '#/utils/dict';

const props = defineProps<{
  /** 按钮样式模式，默认 false（普通 Radio），true 时使用 RadioButton */
  buttonStyle?: boolean;
  code: string;
  disabled?: boolean;
  /** 是否只显示启用的字典项，默认 true */
  onlyEnabled?: boolean;
  /** 指定 value 的类型，默认 'string'，传 'number' 时自动转换 */
  valueType?: 'number' | 'string';
}>();

const modelValue = defineModel<null | number | string | undefined>('value');

const { items, loading } = useDict(props.code);

const options = computed(() => {
  const list = props.onlyEnabled === false ? items.value : items.value.filter(i => i.status === 1);
  const asNumber = props.valueType === 'number' || (props.valueType !== 'string' && typeof modelValue.value === 'number');
  return list.map(i => ({
    label: i.label,
    value: asNumber ? Number(i.value) : i.value,
  }));
});
</script>

<template>
  <RadioGroup v-model:value="modelValue" :disabled="disabled || loading" :options="buttonStyle ? undefined : options" :button-style="buttonStyle ? 'solid' : undefined">
    <template v-if="buttonStyle">
      <RadioButton v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </RadioButton>
    </template>
  </RadioGroup>
</template>
