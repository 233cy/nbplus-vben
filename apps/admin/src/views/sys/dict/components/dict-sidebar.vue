<script setup lang="ts">
import type { DictGroup } from '../composables/useDict';

import type { DictApi } from '#/api/sys/dict';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Input, Spin, Tag, Tooltip, Tree } from 'ant-design-vue';

import { sortDictApi } from '#/api/sys/dict';
import { $t } from '#/locales';

const props = defineProps<{
  activeDict: DictApi.DictItem | null;
  expandedKeys: string[];
  groups: string[];
  keyword: string;
  loading: boolean;
  treeData: DictGroup[];
}>();

const emit = defineEmits<{
  create: [groupName?: string];
  delete: [dict: DictApi.DictItem];
  edit: [dict: DictApi.DictItem];
  reload: [];
  select: [dict: DictApi.DictItem];
  'update:expandedKeys': [keys: string[]];
  'update:keyword': [value: string];
}>();

function onExpand(keys: any) {
  emit('update:expandedKeys', keys as string[]);
}

function onSelect(_keys: (number | string)[], info: any) {
  const node = info.node as DictApi.DictItem | DictGroup;
  if ('children' in node) return;
  emit('select', node);
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

// =================================================================
// 拖拽排序
//
// 排序方案：分组千位 + 字典个位
//   - 分组按顺序分配基数：1000, 2000, 3000...
//   - 分组内字典从基数 +1 开始递增：1001, 1002..., 2001, 2002...
//   - 拖拽分组排序 → 改变千位，保留组内字典的个位顺序
//   - 拖拽字典排序 → 同组内调整个位
//
// 拖拽规则：
//   - 分组 ↔ 分组：✅（不允许嵌套到其他分组内部）
//   - 字典 ↔ 同组字典：✅
//   - 字典 ↔ 异组字典：❌（不允许跨分组）
//   - 分组 ↔ 字典：❌（不允许跨层级混拖）
// =================================================================

/** 是否正在关键字过滤 */
const isFiltering = computed(() => props.keyword.trim().length > 0);

/** 拖拽落库中的加载状态 */
const sorting = ref(false);

/** 定位拖拽节点所属的父级分组 */
function findParentGroup(nodeKey: string): DictGroup | undefined {
  return props.treeData.find(g => g.children.some((c: any) => c.key === nodeKey || c.id === nodeKey));
}

// -----------------------------------------------------------------
// allowDrop — 控制哪些拖拽操作被允许
// -----------------------------------------------------------------

function allowDrop({ dragNode, dropNode, dropPosition }: any): boolean {
  const dragIsGroup = !!dragNode.children;
  const dropIsGroup = !!dropNode.children;

  // 不允许跨层级（分组 ↔ 字典）
  if (dragIsGroup !== dropIsGroup) return false;

  // 分组之间：不允许嵌套到另一分组内部
  if (dragIsGroup) return dropPosition !== 0;

  // 字典之间：允许（同组限制在 handleItemDrop 中判断）
  return true;
}

// -----------------------------------------------------------------
// handleDrop — 统一入口，按节点类型分发
// -----------------------------------------------------------------

async function handleDrop(info: any) {
  const { dragNode } = info;
  if (dragNode.children) {
    await handleGroupDrop(info);
  } else {
    await handleItemDrop(info);
  }
}

// -----------------------------------------------------------------
// handleGroupDrop — 拖拽分组排序
// 重新计算所有分组的所有字典 sort 值，只改千位、保留个位顺序
// -----------------------------------------------------------------

async function handleGroupDrop(info: any) {
  const { dragNode, node, dropPosition: rawDropPosition } = info;

  // treeData 在非过滤时 = 全量分组列表
  const groups = [...props.treeData];
  const oldIdx = groups.findIndex(g => g.key === dragNode.key);
  const dropIdx = groups.findIndex(g => g.key === node.key);

  if (oldIdx === -1 || dropIdx === -1 || oldIdx === dropIdx) return;

  // 移除拖拽分组，计算新位置
  const [dragged] = groups.splice(oldIdx, 1);
  if (!dragged) return;

  const dropPosition = rawDropPosition === 0 ? 1 : rawDropPosition;
  let targetIdx = dropIdx;
  if (dropPosition === 1) targetIdx = dropIdx + 1;
  if (oldIdx < targetIdx) targetIdx--;
  if (targetIdx < 0) targetIdx = 0;

  groups.splice(targetIdx, 0, dragged);

  // 为所有分组的所有字典重新计算 sort
  const allItems: Array<{ id: string; sort: number }> = [];
  for (let gi = 0; gi < groups.length; gi++) {
    const newBase = (gi + 1) * 1000; // 千位：新分组位置
    const group = groups[gi]!;
    const children = group.children as any[];
    for (let ii = 0; ii < children.length; ii++) {
      allItems.push({ id: children[ii].id, sort: newBase + ii + 1 }); // 个位：保留组内顺序
    }
  }

  try {
    sorting.value = true;
    await sortDictApi(allItems);
    emit('reload');
  } catch {
    // 拖拽失败不做任何展示
  } finally {
    sorting.value = false;
  }
}

// -----------------------------------------------------------------
// handleItemDrop — 拖拽字典排序（同组内）
// -----------------------------------------------------------------

async function handleItemDrop(info: any) {
  const { dragNode, node, dropPosition: rawDropPosition } = info;

  const dragGroup = findParentGroup(dragNode.key ?? dragNode.id);
  const dropGroup = findParentGroup(node.key ?? node.id);

  // 非同组不允许
  if (!dragGroup || !dropGroup || dragGroup.key !== dropGroup.key) return;

  const children = [...dragGroup.children] as any[];
  const dragIdx = children.findIndex(c => (c.key ?? c.id) === (dragNode.key ?? dragNode.id));
  const dropIdx = children.findIndex(c => (c.key ?? c.id) === (node.key ?? node.id));

  if (dragIdx === -1 || dropIdx === -1) return;

  // 移除拖拽项
  const [dragged] = children.splice(dragIdx, 1);

  // 计算插入位置：dropPosition 0 视为"放下面"
  const dropPosition = rawDropPosition === 0 ? 1 : rawDropPosition;
  let targetIdx = dropIdx;
  if (dropPosition === 1) targetIdx = dropIdx + 1;
  if (dragIdx < targetIdx) targetIdx--;
  if (targetIdx < 0) targetIdx = 0;

  children.splice(targetIdx, 0, dragged);

  // 构建排序负载：使用分组千位 + 个位递增
  const groupIndex = props.groups.indexOf(dragGroup.title);
  const groupBase = (groupIndex >= 0 ? groupIndex : 0) * 1000 + 1000;
  const items = children.map((c, i) => ({ id: c.id, sort: groupBase + i + 1 }));

  try {
    sorting.value = true;
    await sortDictApi(items);
    emit('reload');
  } catch {
    // 拖拽失败不做任何展示
  } finally {
    sorting.value = false;
  }
}
</script>

<template>
  <div class="mr-2 flex h-full flex-col rounded-[var(--radius)] border border-border bg-card">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between border-b px-3 py-2.5">
      <span class="font-medium">{{ $t('sys.dict.dictList') }}</span>
      <Tooltip :title="$t('sys.dict.addDict')">
        <Button type="primary" @click="$emit('create')">
          <IconifyIcon icon="ant-design:plus-outlined" />
        </Button>
      </Tooltip>
    </div>

    <!-- 搜索框 -->
    <div class="px-3 py-2">
      <Input :value="keyword" :placeholder="$t('sys.dict.searchPlaceholder')" allow-clear @update:value="$emit('update:keyword', $event)">
        <template #prefix>
          <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
        </template>
      </Input>
    </div>

    <!-- 字典树 -->
    <Spin :spinning="loading || sorting" class="flex-1 overflow-y-auto px-1 pb-2">
      <Tree
        v-if="treeData.length > 0"
        :tree-data="treeData as any"
        :expanded-keys="expandedKeys"
        :selected-keys="activeDict ? [activeDict.id] : []"
        :draggable="!isFiltering"
        :allow-drop="allowDrop"
        block-node
        :show-icon="false"
        @expand="onExpand"
        @select="onSelect"
        @drop="handleDrop"
      >
        <template #title="node">
          <!-- 分组节点 -->
          <div v-if="node.children" class="group flex w-full cursor-pointer items-center gap-1.5 py-0.5 font-medium text-gray-500" @click.stop="toggleExpand(node.key)">
            <IconifyIcon icon="ant-design:folder-outlined" />
            <span class="flex-1">{{ node.title }}</span>
            <span class="text-gray-400">({{ node.children?.length ?? 0 }})</span>
            <Tooltip :title="$t('sys.dict.addDictInGroup')">
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
            <div class="flex shrink-0 items-center gap-0.5" @click.stop>
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
        {{ $t('sys.dict.empty') }}
      </div>
    </Spin>
  </div>
</template>
