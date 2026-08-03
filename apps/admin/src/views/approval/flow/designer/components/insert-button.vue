<script setup lang="ts">
import type { NodeType } from '../data';

import { IconifyIcon } from '@vben/icons';

import { Dropdown, Menu, MenuItem } from 'ant-design-vue';

import { $t } from '#/locales';

import { NODE_TYPES } from '../data';

/** 节点间「+」插入按钮：下拉菜单按 NODE_TYPES 注册表渲染可插入的节点类型 */
const emit = defineEmits<{
  insert: [type: NodeType];
}>();

const nodeTypeEntries = Object.entries(NODE_TYPES) as [NodeType, (typeof NODE_TYPES)[NodeType]][];

function onMenuClick(info: { key: string | number }) {
  emit('insert', info.key as NodeType);
}
</script>

<template>
  <div class="insert-btn">
    <div class="chain-line"></div>
    <Dropdown :trigger="['click']" placement="bottom">
      <button class="insert-btn-circle" type="button" @click.stop>
        <IconifyIcon icon="lucide:plus" class="size-3.5" />
      </button>
      <template #overlay>
        <Menu @click="onMenuClick">
          <MenuItem v-for="[key, def] in nodeTypeEntries" :key="key">
            <IconifyIcon :icon="def.icon" class="mr-1 inline size-3.5" />
            {{ $t(def.labelKey) }}
          </MenuItem>
        </Menu>
      </template>
    </Dropdown>
  </div>
</template>
