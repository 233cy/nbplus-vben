<script setup lang="ts">
import type { MenuAdminApi } from '#/api/auth/menuAdmin';

import { IconifyIcon } from '@vben/icons';

import { Button, Popconfirm, Space, Spin, Switch, Tag, Tooltip, Tree } from 'ant-design-vue';

import { $t } from '#/locales';

import { getTypeTag } from '../data';

const props = defineProps<{
  checkedKeys: string[];
  expandedKeys: string[];
  loading: boolean;
  toggleLoading: Record<string, boolean>;
  treeData: MenuAdminApi.MenuItem[];
}>();

const emit = defineEmits<{
  create: [parentId: string];
  delete: [id: string];
  drop: [info: any];
  edit: [item: MenuAdminApi.MenuItem];
  'generate-permission': [item: MenuAdminApi.MenuItem];
  move: [item: MenuAdminApi.MenuItem];
  toggle: [id: string];
  'toggle-keep-alive': [item: MenuAdminApi.MenuItem];
  'toggle-status': [item: MenuAdminApi.MenuItem];
  'update:checkedKeys': [keys: string[]];
  'update:expandedKeys': [keys: string[]];
}>();

function onCheck(keys: any) {
  emit('update:checkedKeys', Array.isArray(keys) ? keys : keys.checked);
}

function onExpand(keys: any) {
  emit('update:expandedKeys', keys as string[]);
}

function allowDrop(info: any): boolean {
  if (!info.dropNode) return false;
  const dragNode = info.dragNode;
  const dropNode = info.dropNode;
  const dragParent = findParentId(props.treeData, dragNode.key);
  const dropParent = findParentId(props.treeData, dropNode.key);
  return dragParent === dropParent;
}

function findParentId(nodes: MenuAdminApi.MenuItem[], targetId: string, parentId: null | string = null): null | string {
  for (const node of nodes) {
    if (node.id === targetId) return parentId;
    if (node.children?.length) {
      const found = findParentId(node.children, targetId, node.id);
      if (found !== null) return found;
    }
  }
  return null;
}

function isExpanded(id: string) {
  return props.expandedKeys.includes(id);
}

function getStatusText(item: MenuAdminApi.MenuItem) {
  return item.status === 1 ? $t('dev.menu.status.enabled') : $t('dev.menu.status.disabled');
}

function getKeepAliveText(item: MenuAdminApi.MenuItem) {
  return item.isKeepAlive ? $t('dev.menu.keepAlive.on') : $t('dev.menu.keepAlive.off');
}
</script>

<template>
  <Spin :spinning="loading" class="h-full">
    <Tree
      :expanded-keys="expandedKeys"
      :checked-keys="checkedKeys"
      :tree-data="treeData as any"
      :field-names="{ key: 'id', title: 'title', children: 'children' }"
      :allow-drop="allowDrop"
      class="menu-tree px-2"
      checkable
      check-strictly
      draggable
      block-node
      :show-icon="false"
      :selectable="false"
      :show-line="true"
      @check="onCheck"
      @expand="onExpand"
      @drop="$emit('drop', $event)"
    >
      <template #title="item">
        <div class="group flex items-center justify-between px-2 py-2">
          <IconifyIcon icon="ant-design:holder-outlined" class="mr-1 flex-shrink-0 cursor-grab text-base text-muted-foreground" />
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <button v-if="item.children?.length" class="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground" @click.stop="$emit('toggle', item.id)">
              <IconifyIcon :icon="isExpanded(item.id) ? 'ant-design:minus-square-outlined' : 'ant-design:plus-square-outlined'" class="text-base" />
            </button>
            <span v-else class="w-4 flex-shrink-0"></span>
            <IconifyIcon v-if="item.icon" :icon="item.icon" class="flex-shrink-0 text-lg" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ item.title }}</span>
                <Tag :color="getTypeTag(item.type, $t).color" class="flex-shrink-0 text-xs">
                  {{ getTypeTag(item.type, $t).text }}
                </Tag>
                <Tag v-if="item.isHidden" color="default" class="flex-shrink-0 text-xs">{{ $t('dev.menu.fields.isHidden') }}</Tag>
                <Tag v-if="item.badgeType" :color="item.badgeType === 'dot' ? 'red' : 'blue'" class="flex-shrink-0 text-xs">
                  {{ item.badgeType === 'dot' ? '●' : item.badge }}
                </Tag>
              </div>
              <div class="mt-0.5 flex items-center gap-3">
                <span v-if="item.name" class="font-mono text-xs text-muted-foreground">{{ item.name }}</span>
                <span v-if="item.path" class="font-mono text-xs text-muted-foreground">{{ item.path }}</span>
                <span v-if="item.component && item.type === 2" class="font-mono text-xs text-muted-foreground opacity-60">{{ item.component }}</span>
                <span v-if="item.linkSrc && [4, 5].includes(item.type)" class="font-mono text-xs text-blue-500 opacity-80">{{ item.linkSrc }}</span>
                <span v-if="item.permission" class="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-xs text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                  {{ item.permission }}
                </span>
              </div>
            </div>
          </div>

          <div class="ml-4 flex flex-shrink-0 items-center gap-3">
            <Tooltip :title="item.status === 1 ? '点击禁用' : '点击启用'">
              <div class="flex items-center gap-1" @click.stop>
                <Switch :checked="item.status === 1" :loading="toggleLoading[`${item.id}_status`]" @change="$emit('toggle-status', item)" />
                <span :class="item.status === 1 ? 'text-green-500' : 'text-red-400'" class="text-xs">{{ getStatusText(item) }}</span>
              </div>
            </Tooltip>

            <Tooltip v-if="item.type === 2" :title="item.isKeepAlive ? '关闭缓存' : '开启缓存'">
              <div class="flex items-center gap-1" @click.stop>
                <Switch :checked="item.isKeepAlive" :loading="toggleLoading[`${item.id}_keepAlive`]" @change="$emit('toggle-keep-alive', item)" />
                <span :class="item.isKeepAlive ? 'text-cyan-500' : 'text-muted-foreground'" class="text-xs">{{ getKeepAliveText(item) }}</span>
              </div>
            </Tooltip>

            <div class="h-4 w-px bg-border"></div>

            <Space :size="4" @click.stop>
              <Tooltip v-if="item.type === 2" :title="$t('dev.menu.generatePermission')">
                <Button size="small" type="text" @click="$emit('generate-permission', item)">
                  <IconifyIcon icon="ant-design:lock-outlined" />
                </Button>
              </Tooltip>
              <Tooltip v-if="item.type !== 3" :title="$t('dev.menu.addChild')">
                <Button size="small" type="text" @click="$emit('create', item.id)">
                  <IconifyIcon icon="ant-design:plus-outlined" />
                </Button>
              </Tooltip>
              <Tooltip :title="$t('dev.menu.move')">
                <Button size="small" type="text" @click="$emit('move', item)">
                  <IconifyIcon icon="ant-design:drag-outlined" />
                </Button>
              </Tooltip>
              <Tooltip :title="$t('common.edit')">
                <Button size="small" type="text" @click="$emit('edit', item)">
                  <IconifyIcon icon="ant-design:edit-outlined" />
                </Button>
              </Tooltip>
              <Popconfirm :title="$t('dev.menu.confirmDelete')" @confirm="$emit('delete', item.id)">
                <Tooltip :title="$t('common.delete')">
                  <Button size="small" type="text" danger @click.stop>
                    <IconifyIcon icon="ant-design:delete-outlined" />
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Space>
          </div>
        </div>
      </template>
    </Tree>

    <div v-if="!loading && treeData.length === 0" class="py-16 text-center text-gray-400">
      {{ $t('common.noDataAvailable') }}
    </div>
  </Spin>
</template>

<style scoped>
:deep(.menu-tree .ant-tree-treenode) {
  padding: 2px 0;
}

:deep(.menu-tree .ant-tree-node-content-wrapper) {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 0 4px;
  border-radius: 6px;
}

:deep(.menu-tree .ant-tree-node-content-wrapper:hover) {
  background-color: hsl(var(--accent));
}

:deep(.menu-tree .ant-tree-switcher) {
  display: none;
}
</style>
