<script setup lang="ts">
import type { DictApi } from '#/api/system/dict';

import { IconifyIcon } from '@vben/icons';

import { Button, Input, Spin, Tag, Tooltip, Tree } from 'ant-design-vue';

import { $t } from '#/locales';

import type { DictGroup } from '../composables/useDict';

const props = defineProps<{
  loading: boolean;
  treeData: DictGroup[];
  keyword: string;
  expandedKeys: string[];
  activeDict: DictApi.DictItem | null;
}>();

const emit = defineEmits<{
  'update:keyword': [value: string];
  'update:expandedKeys': [keys: string[]];
  select: [dict: DictApi.DictItem];
  create: [groupName?: string];
  edit: [dict: DictApi.DictItem];
  delete: [dict: DictApi.DictItem];
}>();

function onExpand(keys: any) {
  emit('update:expandedKeys', keys as string[]);
}

function onSelect(keys: (string | number)[], info: any) {
  const node = info.node as DictGroup | DictApi.DictItem;
  if ('children' in node) return;
  emit('select', node);
}

function isActive(dict: DictApi.DictItem) {
  return props.activeDict?.id === dict.id;
}

function isExpanded(id: string) {
  return props.expandedKeys.includes(id);
}

function toggleExpand(key: string) {
  const keys = [...props.expandedKeys];
  const idx = keys.indexOf(key);
  if (idx === -1) {
    keys.push(key);
  } else {
    keys.splice(idx, 1);
  }
  emit('update:expandedKeys', keys);
}
</script>

<template>
  <div class="mr-2 flex h-full flex-col rounded-[var(--radius)] border border-border bg-card">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between border-b px-3 py-2.5">
      <span class="font-medium">{{ $t('system.dict.dictList') }}</span>
      <Tooltip :title="$t('system.dict.addDict')">
        <Button type="primary" @click="$emit('create')">
          <IconifyIcon icon="ant-design:plus-outlined" />
        </Button>
      </Tooltip>
    </div>

    <!-- 搜索框 -->
    <div class="px-3 py-2">
      <Input
        :value="keyword"
        :placeholder="$t('system.dict.searchPlaceholder')"
        allow-clear
        @update:value="$emit('update:keyword', $event)"
      >
        <template #prefix>
          <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
        </template>
      </Input>
    </div>

    <!-- 字典树 -->
    <Spin :spinning="loading" class="flex-1 overflow-y-auto px-1 pb-2">
      <Tree
        v-if="treeData.length > 0"
        :tree-data="treeData as any"
        :expanded-keys="expandedKeys"
        :selected-keys="activeDict ? [activeDict.id] : []"
        block-node
        :show-icon="false"
        @expand="onExpand"
        @select="onSelect"
      >
        <template #title="node">
          <!-- 分组节点 -->
          <div v-if="node.children" class="group flex w-full cursor-pointer items-center gap-1.5 py-0.5 font-medium text-gray-500" @click.stop="toggleExpand(node.key)">
            <IconifyIcon icon="ant-design:folder-outlined" />
            <span class="flex-1">{{ node.title }}</span>
            <span class="text-gray-400">({{ node.children?.length ?? 0 }})</span>
            <Tooltip :title="$t('system.dict.addDictInGroup')">
              <Button type="text" @click.stop="$emit('create', node.title)">
                <IconifyIcon icon="ant-design:plus-outlined" />
              </Button>
            </Tooltip>
          </div>

          <!-- 字典节点 -->
          <div v-else class="group flex w-full items-center gap-2 py-0.5">
            <div class="min-w-0 flex-1">
              <div class="truncate">{{ node.name }}</div>
              <div class="truncate font-mono text-gray-400" style="font-size: 11px">
                {{ node.code }}
              </div>
            </div>
            <Tag v-if="node.status === 2" color="error" size="small">{{ $t('common.disabled') }}</Tag>
            <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100" @click.stop>
              <Button type="text" @click="$emit('edit', node)">
                <IconifyIcon icon="ant-design:edit-outlined" />
              </Button>
              <Button type="text" danger @click="$emit('delete', node)">
                <IconifyIcon icon="ant-design:delete-outlined" />
              </Button>
            </div>
          </div>
        </template>
      </Tree>

      <div v-else-if="!loading" class="py-10 text-center text-gray-400">
        {{ $t('system.dict.empty') }}
      </div>
    </Spin>
  </div>
</template>
