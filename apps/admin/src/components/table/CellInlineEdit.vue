<script setup lang="ts">
import type { DictApi } from '#/api/system/dict';
import { computed, ref } from 'vue';
import { message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import DictTag from '#/components/dict/DictTag.vue';
import { useDict } from '#/utils/dict';

interface InlineOption {
  label: string;
  value: string | number;
  color?: string;
}

const props = defineProps<{
  row: Record<string, any>;
  field: string;
  dictCode?: string;
  options?: InlineOption[];
  apiFn: (id: string, field: string, value: any) => Promise<any>;
  disabled?: boolean | ((row: Record<string, any>) => boolean);
}>();

const open = ref(false);
const loading = ref(false);

const { items: dictItems } = props.dictCode
  ? useDict(props.dictCode)
  : { items: ref<DictApi.DictItemData[]>([]) };

const selectOptions = computed(() => {
  if (props.dictCode) {
    return dictItems.value
      .filter(i => i.status === 1)
      .map(i => ({ label: i.label, value: i.value, color: i.color }));
  }
  return props.options ?? [];
});

const isDisabled = computed(() => {
  if (typeof props.disabled === 'function') return props.disabled(props.row);
  return props.disabled ?? false;
});

const currentOption = computed(() =>
  selectOptions.value.find(o => String(o.value) === String(props.row[props.field])),
);

async function onSelect(newValue: string | number) {
  open.value = false;
  if (String(newValue) === String(props.row[props.field])) return;
  const oldValue = props.row[props.field];
  props.row[props.field] = newValue;
  loading.value = true;
  try {
    await props.apiFn(props.row.id, props.field, newValue);
  } catch {
    props.row[props.field] = oldValue;
    message.error('修改失败，请重试');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="group inline-flex items-center gap-1">
    <DictTag v-if="dictCode" :code="dictCode" :value="row[field]" />
    <template v-else>
      <a-tag v-if="currentOption?.color" :color="currentOption.color">{{ currentOption.label }}</a-tag>
      <span v-else-if="currentOption">{{ currentOption.label }}</span>
      <span v-else class="text-gray-400">{{ row[field] ?? '-' }}</span>
    </template>
    <a-popover v-if="!isDisabled" v-model:open="open" trigger="click" placement="bottom">
      <template #content>
        <div class="flex flex-col gap-1 min-w-24">
          <a-button
            v-for="opt in selectOptions"
            :key="opt.value"
            size="small"
            type="text"
            class="text-left justify-start"
            @click="onSelect(opt.value)"
          >
            <a-tag v-if="opt.color" :color="opt.color" class="mr-1 pointer-events-none">{{ opt.label }}</a-tag>
            <span v-else>{{ opt.label }}</span>
          </a-button>
        </div>
      </template>
      <a-button size="small" type="text" class="!px-1 opacity-0 group-hover:opacity-100 transition-opacity" :loading="loading">
        <template #icon><IconifyIcon icon="lucide:pencil" class="size-3" /></template>
      </a-button>
    </a-popover>
  </div>
</template>
