<script setup lang="ts">
import type { DeptTreeNode } from '../data';

import { IconifyIcon } from '@vben/icons';

import { Button, Popconfirm, Space, Spin, Switch, Tag, Tooltip, Tree } from 'ant-design-vue';

import { $t } from '#/locales';

const props = defineProps<{
  checkedKeys: string[];
  expandedKeys: string[];
  loading: boolean;
  toggleLoading: Record<string, boolean>;
  treeData: DeptTreeNode[];
}>();

const emit = defineEmits<{
  create: [parentId: string];
  delete: [id: string];
  drop: [info: any];
  edit: [item: DeptTreeNode];
  move: [item: DeptTreeNode];
  toggle: [id: string];
  'toggle-status': [item: DeptTreeNode];
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
  const dragParent = findParentId(props.treeData, info.dragNode.key);
  const dropParent = findParentId(props.treeData, info.dropNode.key);
  return dragParent === dropParent;
}

function findParentId(
  nodes: DeptTreeNode[],
  targetId: string,
  parentId: null | string = null,
): null | string {
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

function getStatusText(status: number) {
  return status === 1 ? $t('system.dept.status.enabled') : $t('system.dept.status.disabled');
}
</script>

<template>
  <Spin :spinning="loading" class="h-full">
    <Tree
      v-if="treeData.length > 0"
      :tree-data="treeData"
      :expanded-keys="expandedKeys"
      :checked-keys="checkedKeys"
      :field-names="{ key: 'id', title: 'title', children: 'children' }"
      :allow-drop="allowDrop"
      class="dept-tree px-2"
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
            <button
              v-if="item.children?.length"
              class="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              @click.stop="$emit('toggle', item.id)"
            >
              <IconifyIcon
                :icon="isExpanded(item.id) ? 'ant-design:minus-square-outlined' : 'ant-design:plus-square-outlined'"
                class="text-base"
              />
            </button>
            <span v-else class="w-4 flex-shrink-0"></span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ item.name }}</span>
                <Tag v-if="item.code" color="default" class="flex-shrink-0 text-xs">{{ item.code }}</Tag>
              </div>
              <div v-if="item.phone || item.email" class="mt-0.5 flex items-center gap-3">
                <span v-if="item.phone" class="font-mono text-xs text-muted-foreground">{{ item.phone }}</span>
                <span v-if="item.email" class="font-mono text-xs text-muted-foreground opacity-60">{{ item.email }}</span>
              </div>
            </div>
          </div>

          <div class="ml-4 flex flex-shrink-0 items-center gap-3">
            <Tooltip :title="item.status === 1 ? '点击禁用' : '点击启用'">
              <div class="flex items-center gap-1" @click.stop>
                <Switch
                  :checked="item.status === 1"
                  :loading="toggleLoading[`${item.id}_status`]"
                  @change="$emit('toggle-status', item)"
                />
                <span :class="item.status === 1 ? 'text-green-500' : 'text-red-400'" class="text-xs">{{ getStatusText(item.status) }}</span>
              </div>
            </Tooltip>

            <div class="h-4 w-px bg-border"></div>

            <Space :size="4" @click.stop>
              <Tooltip :title="$t('system.dept.addChild')">
                <Button size="small" type="text" @click="$emit('create', item.id)">
                  <IconifyIcon icon="ant-design:plus-outlined" />
                </Button>
              </Tooltip>
              <Tooltip :title="$t('system.dept.move')">
                <Button size="small" type="text" @click="$emit('move', item)">
                  <IconifyIcon icon="ant-design:drag-outlined" />
                </Button>
              </Tooltip>
              <Tooltip :title="$t('common.edit')">
                <Button size="small" type="text" @click="$emit('edit', item)">
                  <IconifyIcon icon="ant-design:edit-outlined" />
                </Button>
              </Tooltip>
              <Popconfirm
                :title="$t('system.dept.confirmDelete')"
                :description="$t('system.dept.confirmDeleteContent', { name: item.name })"
                @confirm="$emit('delete', item.id)"
              >
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

    <div v-else-if="!loading" class="py-16 text-center text-gray-400">
      {{ $t('common.noDataAvailable') }}
    </div>
  </Spin>
</template>

<style scoped>
:deep(.dept-tree .ant-tree-treenode) {
  padding: 2px 0;
}

:deep(.dept-tree .ant-tree-node-content-wrapper) {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 0 4px;
  border-radius: 6px;
}

:deep(.dept-tree .ant-tree-node-content-wrapper:hover) {
  background-color: hsl(var(--accent));
}

:deep(.dept-tree .ant-tree-switcher) {
  display: none;
}
</style>
