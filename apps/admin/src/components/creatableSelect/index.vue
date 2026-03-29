<script setup lang="ts">
import { defineComponent, nextTick, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { Button, Divider, Input, Select, Space } from 'ant-design-vue';

// 用于渲染 dropdownRender 传入的 vnode，避免 () => menu 每次创建新函数导致无限更新
const VNodes = defineComponent({
  props: { vnodes: { type: Object, required: true } },
  render() { return this.vnodes; },
});

interface Option {
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    addPlaceholder?: string;
    allowClear?: boolean;
    disabled?: boolean;
    onAdd?: (value: string) => boolean | Promise<boolean> | void;
    options?: Option[];
    placeholder?: string;
  }>(),
  {
    options: () => [],
    addPlaceholder: undefined,
    onAdd: undefined,
    allowClear: true,
    placeholder: undefined,
    disabled: false,
  },
);

const emit = defineEmits<{
  add: [value: string];
}>();

const modelValue = defineModel<string | undefined>('value');

const localOptions = ref<Option[]>([]);
const mergedOptions = ref<Option[]>([...props.options]);

watch(
  () => props.options,
  (val) => {
    mergedOptions.value = [...val, ...localOptions.value];
  },
  { immediate: true },
);

const newItemName = ref('');
const inputRef = ref();

async function handleAdd(e: Event) {
  e.preventDefault();
  const val = newItemName.value.trim();
  if (!val) return;

  let shouldAppend = true;
  if (props.onAdd) {
    const result = await props.onAdd(val);
    if (result === false) shouldAppend = false;
  }

  if (shouldAppend && !mergedOptions.value.some((o) => o.value === val)) {
    const newOpt = { label: val, value: val };
    localOptions.value.push(newOpt);
    mergedOptions.value = [...props.options, ...localOptions.value];
  }

  // 选中新增的值
  modelValue.value = val;
  emit('add', val);
  newItemName.value = '';
  nextTick(() => inputRef.value?.focus());
}
</script>

<template>
  <Select
    v-model:value="modelValue"
    :options="mergedOptions"
    :allow-clear="allowClear"
    :placeholder="placeholder"
    :disabled="disabled"
    show-search
    :filter-option="(input: string, opt: any) => opt?.value?.toLowerCase().includes(input.toLowerCase())"
  >
    <template #dropdownRender="{ menuNode: menu }">
      <VNodes :vnodes="menu" />
      <Divider style="margin: 4px 0" />
      <Space style="width: 100%; padding: 4px 8px">
        <Input ref="inputRef" v-model:value="newItemName" :placeholder="addPlaceholder ?? $t('common.inputToAdd')" style="flex: 1" @keydown.enter="handleAdd" />
        <Button type="text" @click="handleAdd">
          <template #icon><span class="i-ant-design:plus-outlined"></span></template>
          {{ $t('common.add') }}
        </Button>
      </Space>
    </template>
  </Select>
</template>
