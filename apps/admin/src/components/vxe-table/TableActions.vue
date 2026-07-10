<script setup lang="ts">
import type { MenuProps } from 'ant-design-vue';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Dropdown, Menu, MenuItem, Popconfirm, Space } from 'ant-design-vue';

export interface TableActionItem {
  /** 唯一标识 */
  key: string;
  /** 按钮文字，建议控制在 2 个字 */
  label: string;
  /** Iconify 图标名 */
  icon?: string;
  /** 是否为危险操作（红色样式） */
  danger?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 二次确认文案，传值则自动包裹 Popconfirm */
  confirmTitle?: string;
  /** 点击回调，vxe-table renderer 场景会传入当前行 */
  onClick: (row?: any) => void;
}

const props = withDefaults(
  defineProps<{
    /** 操作项列表 */
    actions: TableActionItem[];
    /** 直接平铺展示的最大数量，默认 2 */
    maxVisible?: number;
    /** 「更多」按钮是否显示文字，默认 false */
    moreShowLabel?: boolean;
    /**
     * 二次确认弹窗的弹出位置
     * 表格右侧固定列建议传 'topRight'，让弹窗向左展开，避免贴边被挤压
     */
    popconfirmPlacement?: 'bottom' | 'bottomLeft' | 'bottomRight' | 'left' | 'leftBottom' | 'leftTop' | 'right' | 'rightBottom' | 'rightTop' | 'top' | 'topLeft' | 'topRight';
    /** 平铺按钮是否显示文字，默认 true */
    showLabel?: boolean;
  }>(),
  {
    maxVisible: 2,
    moreShowLabel: false,
    popconfirmPlacement: 'topRight',
    showLabel: true,
  },
);

const visibleActions = computed(() => props.actions.filter(item => !item.hidden).slice(0, props.maxVisible));

const moreActions = computed(() => props.actions.filter(item => !item.hidden).slice(props.maxVisible));

const hasMore = computed(() => moreActions.value.length > 0);

const onMenuClick: MenuProps['onClick'] = ({ key }) => {
  const item = props.actions.find(action => action.key === key);
  if (!item || item.disabled) return;
  item.onClick();
};

// Popconfirm 弹层挂到 body，避免固定操作列窄容器把确认文字挤成竖排
const getPopupContainer = () => document.body;

// 增强自动位置调整：当按钮靠近视口边缘时，弹窗主动翻转方向，避免被挤压
const autoAdjustOverflow = { adjustX: 1 as const, adjustY: 1 as const };
</script>

<template>
  <Space :size="4">
    <template v-for="item in visibleActions" :key="item.key">
      <Popconfirm
        v-if="item.confirmTitle"
        :title="item.confirmTitle"
        :auto-adjust-overflow="autoAdjustOverflow"
        :get-popup-container="getPopupContainer"
        :placement="props.popconfirmPlacement"
        @confirm="item.onClick"
      >
        <Button type="link" size="small" :danger="item.danger" :disabled="item.disabled" :loading="item.loading">
          <IconifyIcon v-if="item.icon" :icon="item.icon" class="size-4" :class="{ 'mr-1': showLabel }" />
          <span v-if="showLabel">{{ item.label }}</span>
        </Button>
      </Popconfirm>
      <Button v-else type="link" size="small" :danger="item.danger" :disabled="item.disabled" :loading="item.loading" @click="item.onClick">
        <IconifyIcon v-if="item.icon" :icon="item.icon" class="size-4" :class="{ 'mr-1': showLabel }" />
        <span v-if="showLabel">{{ item.label }}</span>
      </Button>
    </template>

    <Dropdown v-if="hasMore" trigger="click">
      <Button type="link" size="small">
        <span v-if="moreShowLabel" class="mr-1">{{ $t('common.more') }}</span>
        <IconifyIcon :icon="moreShowLabel ? 'lucide:chevron-down' : 'lucide:more-horizontal'" class="size-4" />
      </Button>
      <template #overlay>
        <Menu style="min-width: 120px" @click="onMenuClick">
          <MenuItem v-for="item in moreActions" :key="item.key" :disabled="item.disabled">
            <span class="inline-flex items-center whitespace-nowrap" :class="{ 'text-red-500': item.danger }">
              <IconifyIcon v-if="item.icon" :icon="item.icon" class="mr-1 size-4 flex-shrink-0" />
              <span>{{ item.label }}</span>
            </span>
          </MenuItem>
        </Menu>
      </template>
    </Dropdown>
  </Space>
</template>
