<script setup lang="ts">
import type { DictApi } from '#/api/system/dict';

import { computed, nextTick, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, InputNumber, message } from 'ant-design-vue';

import DictTag from '#/components/dict/DictTag.vue';
import { useDict } from '#/utils/dict';

type EditType = 'input' | 'number' | 'select';

interface InlineOption {
  label: string;
  value: number | string;
  color?: string;
}

const props = defineProps<{
  apiFn: (id: string, field: string, value: any) => Promise<any>;
  dictCode?: string;
  disabled?: ((row: Record<string, any>) => boolean) | boolean;
  field: string;
  options?: InlineOption[];
  row: Record<string, any>;
  type?: EditType;
}>();

const open = ref(false);
const loading = ref(false);
const editing = ref(false);
const editValue = ref<any>();
const inputRef = ref<HTMLInputElement | null>(null);

const { items: dictItems } = props.dictCode ? useDict(props.dictCode) : { items: ref<DictApi.DictItemData[]>([]) };

const editType = computed(() => props.type ?? 'select');

const selectOptions = computed(() => {
  if (props.dictCode) {
    return dictItems.value.filter(i => i.status === 1).map(i => ({ label: i.label, value: i.value, color: i.color }));
  }
  return props.options ?? [];
});

const isDisabled = computed(() => {
  if (typeof props.disabled === 'function') return props.disabled(props.row);
  return props.disabled ?? false;
});

const currentOption = computed(() => selectOptions.value.find(o => String(o.value) === String(props.row[props.field])));

const displayValue = computed(() => {
  const value = props.row[props.field];
  return value === null || value === undefined || value === '' ? '-' : value;
});

function startEdit() {
  if (isDisabled.value) return;
  editValue.value = props.row[props.field];
  if (editType.value === 'select') {
    open.value = true;
  } else {
    editing.value = true;
    nextTick(() => {
      inputRef.value?.focus?.();
    });
  }
}

async function submit() {
  const newValue =
    editType.value === 'number' ? (editValue.value === '' || editValue.value === null || editValue.value === undefined ? null : Number(editValue.value)) : editValue.value;

  if (newValue === props.row[props.field]) {
    editing.value = false;
    return;
  }

  const oldValue = props.row[props.field];
  // eslint-disable-next-line vue/no-mutating-props
  props.row[props.field] = newValue;
  loading.value = true;
  try {
    await props.apiFn(props.row.id, props.field, newValue);
    editing.value = false;
  } catch {
    // eslint-disable-next-line vue/no-mutating-props
    props.row[props.field] = oldValue;
    message.error('修改失败，请重试');
  } finally {
    loading.value = false;
  }
}

function onBlur() {
  submit();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    submit();
  } else if (e.key === 'Escape') {
    editing.value = false;
    editValue.value = props.row[props.field];
  }
}

async function onSelect(newValue: number | string) {
  open.value = false;
  if (String(newValue) === String(props.row[props.field])) return;

  const oldValue = props.row[props.field];
  // eslint-disable-next-line vue/no-mutating-props
  props.row[props.field] = newValue;
  loading.value = true;
  try {
    await props.apiFn(props.row.id, props.field, newValue);
  } catch {
    // eslint-disable-next-line vue/no-mutating-props
    props.row[props.field] = oldValue;
    message.error('修改失败，请重试');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="group flex w-full min-w-0 items-center gap-1">
    <!-- 下拉/字典模式 -->
    <template v-if="editType === 'select'">
      <DictTag v-if="dictCode" :code="dictCode" :value="row[field]" />
      <template v-else>
        <a-tag v-if="currentOption?.color" :color="currentOption.color">{{ currentOption.label }}</a-tag>
        <span v-else-if="currentOption">{{ currentOption.label }}</span>
        <span v-else class="text-gray-400">{{ row[field] ?? '-' }}</span>
      </template>
      <a-popover v-if="!isDisabled" v-model:open="open" trigger="click" placement="bottom">
        <template #content>
          <div class="flex min-w-24 flex-col gap-1">
            <a-button v-for="opt in selectOptions" :key="opt.value" size="small" type="text" class="justify-start text-left" @click="onSelect(opt.value)">
              <a-tag v-if="opt.color" :color="opt.color" class="pointer-events-none mr-1">{{ opt.label }}</a-tag>
              <span v-else>{{ opt.label }}</span>
            </a-button>
          </div>
        </template>
        <a-button size="small" type="text" class="!px-1 opacity-0 transition-opacity group-hover:opacity-100" :loading="loading">
          <template #icon><IconifyIcon icon="lucide:pencil" class="size-3" /></template>
        </a-button>
      </a-popover>
    </template>

    <!-- 文本输入模式 -->
    <template v-else-if="editType === 'input'">
      <Input v-if="editing" ref="inputRef" v-model:value="editValue" size="small" class="w-full min-w-[80px]" @blur="onBlur" @keydown="onKeydown" />
      <span v-else class="inline-edit-text">{{ displayValue }}</span>
      <a-button v-if="!isDisabled" size="small" type="text" class="!px-1 opacity-0 transition-opacity group-hover:opacity-100" :loading="loading" @click="startEdit">
        <template #icon><IconifyIcon icon="lucide:pencil" class="size-3" /></template>
      </a-button>
    </template>

    <!-- 数字输入模式 -->
    <template v-else-if="editType === 'number'">
      <InputNumber v-if="editing" ref="inputRef" v-model:value="editValue" size="small" class="w-full min-w-[80px]" @blur="onBlur" @keydown="onKeydown" />
      <span v-else class="inline-edit-text">{{ displayValue }}</span>
      <a-button v-if="!isDisabled" size="small" type="text" class="!px-1 opacity-0 transition-opacity group-hover:opacity-100" :loading="loading" @click="startEdit">
        <template #icon><IconifyIcon icon="lucide:pencil" class="size-3" /></template>
      </a-button>
    </template>
  </div>
</template>
