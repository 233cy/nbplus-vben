<script setup lang="ts">
import type { MenuProps } from 'ant-design-vue';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Dropdown, Menu, MenuItem, SubMenu } from 'ant-design-vue';

import { useDict } from '#/utils/dict';
import { useTableBatchAction } from '#/utils/table';

interface OptionItem {
  label: string;
  value: number | string;
}

/**
 * multi 模式下每个字段的配置，dictCode 和 options 二选一
 */
interface FieldItem {
  fieldName: string;
  label: string;
  dictCode?: string;
  options?: OptionItem[];
}

/**
 * type 说明：
 *   'direct'  → 直接触发，只传 ids，无下拉
 *   'field'   → 字段+固定值，传 { ids, [fieldName]: fieldValue }，无下拉
 *   'dict'    → 字典下拉，选中后传 { ids, [fieldName]: value }
 *   'select'  → 自定义选项下拉，同 dict 但 options 手动传入
 *   'multi'   → 多字段二级下拉，每个字段可用 dictCode 或 options
 */
type BatchActionType = 'dict' | 'direct' | 'field' | 'multi' | 'select';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 操作名称，用于确认文案 */
    action: string;
    /** 批量操作接口 */
    apiFn: (ids: string[], ...args: any[]) => Promise<any>;
    /** 倒计时秒数 */
    countdown?: number;
    /** 字典 code（type='dict' 时必传） */
    dictCode?: string;
    /** 字典/选项对应的字段名（type='dict'|'select'|'field' 时必传） */
    fieldName?: string;
    /** 固定字段值（type='field' 时必传） */
    fieldValue?: any;
    /** multi 模式：多字段配置 */
    fields?: FieldItem[];
    /** 获取已选中行 id 的函数 */
    getIds: () => string[];
    /** 按钮图标 */
    icon?: string;
    /** 操作成功回调 */
    onSuccess: () => void;
    /** 自定义选项（type='select' 时必传） */
    options?: OptionItem[];
    /** 模式 */
    type: BatchActionType;
  }>(),
  {
    icon: 'lucide:layers',
    countdown: 3,
    dictCode: undefined,
    fieldName: undefined,
    options: undefined,
    fieldValue: undefined,
    fields: undefined,
  },
);

// 单字典模式（dict）
const { items: dictItems } = useDict(props.dictCode ?? '');

// multi 模式：为每个有 dictCode 的 field 预加载字典
const fieldDictMap = computed(() => {
  if (props.type !== 'multi' || !props.fields) return {} as Record<string, any>;
  return Object.fromEntries(
    props.fields
      .filter(f => !!f.dictCode)
      .map(f => {
        const { items } = useDict(f.dictCode!);
        return [f.fieldName, items];
      }),
  );
});

function getFieldOptions(field: FieldItem): OptionItem[] {
  if (field.options) return field.options;
  const items = fieldDictMap.value[field.fieldName];
  return (items?.value ?? [])
    .filter((i: any) => i.status === 1)
    .map((i: any) => ({ label: i.label, value: i.value }));
}

const isDropdown = computed(() => ['dict', 'select', 'multi'].includes(props.type));

const menuItems = computed<OptionItem[]>(() => {
  if (props.type === 'select') return props.options ?? [];
  return dictItems.value.filter(i => i.status === 1).map(i => ({ label: i.label, value: i.value }));
});

function triggerAction(label: string, fieldName?: string, value?: any) {
  useTableBatchAction(
    ids => props.apiFn(ids, fieldName, value),
    props.getIds(),
    label,
    props.onSuccess,
    { countdown: props.countdown },
  );
}

/** dict / select 模式 */
const onMenuClick: MenuProps['onClick'] = ({ key }) => {
  const item = menuItems.value.find(i => String(i.value) === String(key));
  if (!item) return;
  triggerAction(item.label, props.fieldName, item.value);
};

/** direct / field 模式 */
function onDirectClick() {
  triggerAction(
    props.action,
    props.type === 'field' ? props.fieldName : undefined,
    props.type === 'field' ? props.fieldValue : undefined,
  );
}

/** multi 模式 */
function onMultiItemClick(field: FieldItem, item: OptionItem) {
  triggerAction(`${field.label} → ${item.label}`, field.fieldName, item.value);
}
</script>

<template>
  <!-- multi：多字段二级下拉 -->
  <Dropdown v-if="type === 'multi'" v-bind="$attrs">
    <slot>
      <Button>
        <IconifyIcon :icon="icon" class="size-4" />
        {{ action }}
        <IconifyIcon icon="lucide:chevron-down" class="size-4" />
      </Button>
    </slot>
    <template #overlay>
      <Menu>
        <SubMenu v-for="field in fields" :key="field.fieldName" :title="field.label">
          <MenuItem
            v-for="item in getFieldOptions(field)"
            :key="`${field.fieldName}-${item.value}`"
            @click="onMultiItemClick(field, item)"
          >
            {{ item.label }}
          </MenuItem>
        </SubMenu>
      </Menu>
    </template>
  </Dropdown>

  <!-- dict / select：单字段下拉 -->
  <Dropdown v-else-if="isDropdown" v-bind="$attrs">
    <slot>
      <Button>
        <IconifyIcon :icon="icon" class="size-4" />
        {{ action }}
        <IconifyIcon icon="lucide:chevron-down" class="size-4" />
      </Button>
    </slot>
    <template #overlay>
      <Menu @click="onMenuClick">
        <MenuItem v-for="item in menuItems" :key="item.value">
          {{ item.label }}
        </MenuItem>
      </Menu>
    </template>
  </Dropdown>

  <!-- direct / field：直接触发 -->
  <span v-else v-bind="$attrs">
    <slot :on-click="onDirectClick">
      <Button @click="onDirectClick">
        <IconifyIcon :icon="icon" class="size-4" />
        {{ action }}
      </Button>
    </slot>
  </span>
</template>
