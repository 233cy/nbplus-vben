<script setup lang="ts">
import type { MenuProps } from 'ant-design-vue';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Dropdown, Menu, MenuItem } from 'ant-design-vue';

import { useDict } from '#/utils/dict';
import { useTableBatchAction } from '#/utils/table';

interface OptionItem {
  label: string;
  value: number | string;
}

/**
 * type 说明：
 *   'direct'  → 直接触发，只传 ids，无下拉
 *   'field'   → 字段+固定值，传 { ids, [fieldName]: fieldValue }，无下拉
 *   'dict'    → 字典下拉，选中后传 { ids, [fieldName]: value }
 *   'select'  → 自定义选项下拉，同 dict 但 options 手动传入
 */
type BatchActionType = 'dict' | 'direct' | 'field' | 'select';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 操作名称，用于确认文案 */
    action: string;
    /** 批量操作接口 */
    apiFn: (ids: string[], ...args: any[]) => Promise<any>;
    /** 倒计时秒数 */
    countdown?: number;
    // ── dict 模式 ─────────────────────────────────────────
    /** 字典 code（type='dict' 时必传） */
    dictCode?: string;
    /** 字典/选项对应的字段名（type='dict'|'select'|'field' 时必传） */
    fieldName?: string;

    // ── field 模式 ────────────────────────────────────────
    /** 固定字段值（type='field' 时必传） */
    fieldValue?: any;
    /** 获取已选中行 id 的函数 */
    getIds: () => string[];

    // ── 通用配置 ──────────────────────────────────────────
    /** 按钮图标 */
    icon?: string;

    /** 操作成功回调 */
    onSuccess: () => void;

    // ── select 模式 ───────────────────────────────────────
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
  },
);

const { items: dictItems } = useDict(props.dictCode ?? '');

/** 是否展示下拉菜单 */
const isDropdown = computed(() => props.type === 'dict' || props.type === 'select');

/** 下拉菜单选项 */
const menuItems = computed<OptionItem[]>(() => {
  if (props.type === 'select') return props.options ?? [];
  return dictItems.value.filter((i) => i.status === 1).map((i) => ({ label: i.label, value: i.value }));
});

function triggerAction(label: string, fieldName?: string, value?: any) {
  useTableBatchAction((ids) => props.apiFn(ids, fieldName, value), props.getIds(), label, props.onSuccess, { countdown: props.countdown });
}

/** dict / select 模式：点击菜单项 */
const onMenuClick: MenuProps['onClick'] = ({ key }) => {
  const item = menuItems.value.find((i) => String(i.value) === String(key));
  if (!item) return;
  triggerAction(item.label, props.fieldName, item.value);
};

/** direct / field 模式：点击按钮直接触发 */
function onDirectClick() {
  triggerAction(props.action, props.type === 'field' ? props.fieldName : undefined, props.type === 'field' ? props.fieldValue : undefined);
}
</script>

<template>
  <!-- dict / select：下拉菜单模式 -->
  <Dropdown v-if="isDropdown" v-bind="$attrs">
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

  <!-- direct / field：直接触发模式 -->
  <span v-else v-bind="$attrs">
    <slot :on-click="onDirectClick">
      <Button @click="onDirectClick">
        <IconifyIcon :icon="icon" class="size-4" />
        {{ action }}
      </Button>
    </slot>
  </span>
</template>
