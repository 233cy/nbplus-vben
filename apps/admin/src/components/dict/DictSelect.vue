<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';

import { Select, Tag } from 'ant-design-vue';

import { useDict } from '#/utils/dict';

interface Props {
  allowClear?: boolean;
  code: string;
  disabled?: boolean;
  /** 下拉菜单是否与选择器等宽，默认 true；传 false 时按选项内容撑开 */
  dropdownMatchSelectWidth?: boolean | number;
  multiple?: boolean;
  /** 是否只显示启用的字典项，默认 true */
  onlyEnabled?: boolean;
  placeholder?: string;
  /** 是否显示搜索框，默认 true */
  showSearch?: boolean;
  /** 指定 option value 的类型，默认 'string'，传 'number' 时自动转换 */
  valueType?: 'number' | 'string';
}

const props = withDefaults(defineProps<Props>(), {
  allowClear: true,
  dropdownMatchSelectWidth: false,
  placeholder: undefined,
  valueType: undefined,
});

const modelValue = defineModel<null | number | number[] | string | string[] | undefined>('value');

const { items, loading } = useDict(props.code);

// antd Select 的 value 不接受 null，这里做一层转换
const selectValue = computed({
  get: () => (modelValue.value === null ? undefined : modelValue.value),
  set: val => {
    modelValue.value = val ?? null;
  },
});

const options = computed(() => {
  const list = props.onlyEnabled === false ? items.value : items.value.filter(i => i.status === 1);
  // valueType 明确指定时优先使用，否则根据 modelValue 当前类型推断
  const asNumber =
    props.valueType === 'number' ||
    (props.valueType !== 'string' && (typeof modelValue.value === 'number' || (Array.isArray(modelValue.value) && typeof modelValue.value[0] === 'number')));
  return list.map(i => ({
    label: i.label,
    value: asNumber ? Number(i.value) : i.value,
    color: i.color,
  }));
});

/**
 * options 加载完成后，如果 modelValue 已有值，强制触发一次重新赋值
 * 解决：setValues 比字典加载先完成时，Select 拿到 value 但 options 为空导致反显失败
 */
watch(loading, isLoading => {
  if (!isLoading && modelValue.value !== null && modelValue.value !== undefined) {
    const current = modelValue.value;
    nextTick(() => {
      modelValue.value = undefined;
      nextTick(() => {
        modelValue.value = current;
      });
    });
  }
});
</script>

<template>
  <Select
    v-model:value="selectValue"
    :options="options"
    :loading="loading"
    :placeholder="placeholder"
    :allow-clear="allowClear"
    :dropdown-match-select-width="dropdownMatchSelectWidth ?? false"
    :mode="multiple ? 'multiple' : undefined"
    :disabled="disabled"
    :show-search="showSearch ?? true"
    option-filter-prop="label"
  >
    <template #option="{ label, color }">
      <Tag v-if="color" :color="color" class="mr-1">{{ label }}</Tag>
      <span v-else>{{ label }}</span>
    </template>
  </Select>
</template>
