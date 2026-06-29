<script setup lang="ts">
import type { PermissionNode } from './usePermissionTree';

import { computed, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Input } from 'ant-design-vue';

import mockPermissions from './mock-permissions.json';
import { usePermissionTree } from './usePermissionTree';

const props = withDefaults(
  defineProps<{
    /** 当前已选权限 ID */
    checkedKeys?: string[];
    /** 是否只读（权限包预览态） */
    readonly?: boolean;
    /** 搜索占位符 */
    searchPlaceholder?: string;
    /** 菜单权限树 */
    treeData: PermissionNode[];
  }>(),
  {
    checkedKeys: () => [],
    readonly: false,
    searchPlaceholder: '搜索菜单或权限点...',
  },
);

const emit = defineEmits<{
  change: [keys: string[]];
  reset: [];
}>();

export interface PermissionAssignPanelExpose {
  /** 获取当前已选 ID 列表 */
  getCheckedKeys: () => string[];
  /** 覆盖设置已选 ID */
  setCheckedKeys: (keys: string[]) => void;
  /** 批量勾选指定 ID */
  checkByIds: (ids: string[]) => void;
  /** 取消勾选指定 ID */
  uncheckByIds: (ids: string[]) => void;
  /** 清空所有勾选 */
  uncheckAll: () => void;
}

interface FlattenedMenu {
  node: PermissionNode;
  buttons: PermissionNode[];
}

interface FlattenedGroup {
  dir: PermissionNode;
  path: string;
  menus: FlattenedMenu[];
}

/** 是否使用本地 mock 数据做性能测试；生产环境保持 false */
const USE_MOCK_DATA = false;

const {
  checkedKeys,
  currentCheckedKeys,
  expandedKeys,
  searchTerm,
  filteredTree,
  checkedCount,
  totalCount,
  toggleCheck,
  getNodeCheckState,
  isDisabled,
  expandAll,
  collapseAll,
  checkAll,
  uncheckAll,
  checkByType,
  checkByIds: treeCheckByIds,
  uncheckByIds: treeUncheckByIds,
} = usePermissionTree({
  treeData: () => (USE_MOCK_DATA ? mockPermissions : props.treeData),
  checkedKeys: () => props.checkedKeys,
  readonly: () => props.readonly,
});

watch(
  currentCheckedKeys,
  (keys, prevKeys) => {
    if (prevKeys && keys.length === prevKeys.length && keys.every((k, i) => k === prevKeys[i])) {
      return;
    }
    emit('change', keys);
  },
  { deep: true },
);

/** 收集树中所有目录节点，并记录完整父级路径 */
const allDirectories = computed(() => {
  const result: { node: PermissionNode; path: string }[] = [];

  function walk(nodes: PermissionNode[], path: string[]) {
    for (const node of nodes) {
      if (node.type === 1) {
        result.push({ node, path: [...path, node.title].join(' / ') });
        if (node.children?.length) walk(node.children, [...path, node.title]);
      }
    }
  }

  walk(filteredTree.value, []);
  return result;
});

/** 将所有目录平铺为独立卡片：目录 -> 菜单（含内/外链） -> 按钮 */
const flattenedTree = computed(() => {
  const groups: FlattenedGroup[] = [];

  for (const { node: dir, path } of allDirectories.value) {
    const menus: FlattenedMenu[] = (dir.children || [])
      .filter(child => [2, 4, 5].includes(child.type))
      .map(child => ({
        node: child,
        buttons: child.children?.filter(item => item.type === 3) ?? [],
      }));

    if (menus.length > 0) {
      groups.push({ dir, path, menus });
    }
  }

  return groups;
});

function toggleExpand(node: PermissionNode) {
  const next = new Set(expandedKeys.value);
  if (next.has(node.id)) next.delete(node.id);
  else next.add(node.id);
  expandedKeys.value = next;
}

function isExpanded(node: PermissionNode): boolean {
  return expandedKeys.value.has(node.id);
}

function checkStateClass(state: number): string {
  if (state === 2) return 'bg-primary text-primary-foreground border-primary';
  if (state === 1) return 'bg-primary/60 text-primary-foreground border-primary/60';
  return 'border-border bg-background';
}

function checkStateIcon(state: number): string {
  if (state === 2) return 'lucide:check';
  if (state === 1) return 'lucide:minus';
  return '';
}

function checkButtonClass(checked: boolean): string {
  return checked ? 'border-primary bg-card text-primary shadow-sm' : 'border-border bg-background/50 text-foreground';
}

function getNodeIcon(type: number): string {
  switch (type) {
    case 2: {
      return 'lucide:layout-dashboard';
    }
    case 3: {
      return 'lucide:mouse-pointer-click';
    }
    case 4: {
      return 'lucide:frame';
    }
    case 5: {
      return 'lucide:external-link';
    }
    default: {
      return 'lucide:circle';
    }
  }
}

function getNodeIconClass(disabled: boolean): string {
  return disabled ? 'text-muted-foreground' : 'text-primary';
}

defineExpose<PermissionAssignPanelExpose>({
  getCheckedKeys: () => currentCheckedKeys.value,
  setCheckedKeys: (keys: string[]) => {
    checkedKeys.value = new Set(keys.map(String));
  },
  checkByIds: (ids: string[]) => {
    treeCheckByIds(ids.map(String));
  },
  uncheckByIds: (ids: string[]) => {
    treeUncheckByIds(ids.map(String));
  },
  uncheckAll: () => {
    uncheckAll();
  },
});
</script>

<template>
  <div class="permission-assign-panel flex h-full flex-col overflow-hidden">
    <!-- Toolbar -->
    <div class="mb-3 flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
      <Input v-model:value="searchTerm" allow-clear class="max-w-[180px]" :placeholder="searchPlaceholder">
        <template #prefix>
          <IconifyIcon icon="lucide:search" class="size-4 text-muted-foreground" />
        </template>
      </Input>

      <div class="flex flex-wrap items-center gap-2">
        <div class="inline-flex flex-wrap gap-2 rounded-lg border bg-background p-1.5">
          <Button size="small" @click="expandAll">展开全部</Button>
          <Button size="small" @click="collapseAll">收起全部</Button>
          <Button size="small" :disabled="readonly" @click="checkAll">全选</Button>
          <Button size="small" :disabled="readonly" @click="uncheckAll">清空</Button>
          <Button size="small" :disabled="readonly" @click="emit('reset')">恢复默认</Button>
        </div>

        <div class="inline-flex flex-wrap gap-2 rounded-lg border bg-background p-1.5">
          <Button size="small" :disabled="readonly" @click="() => checkByType(2)">菜单</Button>
          <Button size="small" :disabled="readonly" @click="() => checkByType(3)">按钮</Button>
        </div>

        <span class="ml-2 text-sm text-muted-foreground">
          已选 <span class="font-mono text-base font-bold text-primary">{{ checkedCount }}</span> / {{ totalCount }}
        </span>
      </div>
    </div>

    <!-- Tree Content：目录 -> 菜单/内链/外链 -> 按钮，三层平铺 -->
    <div class="flex-1 space-y-3 overflow-y-auto pr-2">
      <div v-for="group in flattenedTree" :key="group.dir.id" class="overflow-hidden rounded-xl border bg-card shadow-sm">
        <!-- Level 1：目录 -->
        <div
          class="flex items-center justify-between border-b bg-muted/50 p-3 transition-colors"
          :class="isDisabled(group.dir) ? 'cursor-not-allowed opacity-60' : readonly ? '' : 'cursor-pointer hover:bg-muted/70'"
          @click="!readonly && !isDisabled(group.dir) && toggleCheck(group.dir, getNodeCheckState(group.dir) !== 2)"
        >
          <div class="flex items-center gap-3">
            <Button type="text" size="small" @click.stop="toggleExpand(group.dir)">
              <IconifyIcon :icon="isExpanded(group.dir) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="size-4" />
            </Button>
            <button
              type="button"
              class="flex size-4 items-center justify-center rounded border transition-all"
              :class="checkStateClass(getNodeCheckState(group.dir))"
              :disabled="readonly || isDisabled(group.dir)"
              @click.stop="toggleCheck(group.dir, getNodeCheckState(group.dir) !== 2)"
            >
              <IconifyIcon v-if="checkStateIcon(getNodeCheckState(group.dir))" :icon="checkStateIcon(getNodeCheckState(group.dir))" class="size-3 stroke-[3]" />
            </button>
            <span class="flex items-center gap-1.5 text-base font-bold" :class="isDisabled(group.dir) ? 'text-muted-foreground' : ''">
              <IconifyIcon icon="lucide:layers" class="size-4 shrink-0 text-muted-foreground" />
              <span class="break-all">{{ group.path }}</span>
            </span>
          </div>
          <span class="font-mono text-xs text-muted-foreground">ID: {{ group.dir.id }}</span>
        </div>

        <!-- Level 2：菜单 / 内链 / 外链 -->
        <div v-if="isExpanded(group.dir) && group.menus.length > 0" class="divide-y p-4">
          <div v-for="menu in group.menus" :key="menu.node.id" class="py-3 first:pt-0 last:pb-0">
            <div
              class="flex items-center justify-between gap-4 rounded-lg p-2 transition-colors"
              :class="isDisabled(menu.node) ? 'cursor-not-allowed opacity-60' : readonly ? '' : 'cursor-pointer hover:bg-muted/50'"
              @click="!readonly && !isDisabled(menu.node) && toggleCheck(menu.node, getNodeCheckState(menu.node) !== 2)"
            >
              <div class="flex items-center gap-2.5">
                <button
                  type="button"
                  class="flex size-4 items-center justify-center rounded border transition-all"
                  :class="checkStateClass(getNodeCheckState(menu.node))"
                  :disabled="readonly || isDisabled(menu.node)"
                  @click.stop="toggleCheck(menu.node, getNodeCheckState(menu.node) !== 2)"
                >
                  <IconifyIcon v-if="checkStateIcon(getNodeCheckState(menu.node))" :icon="checkStateIcon(getNodeCheckState(menu.node))" class="size-3 stroke-[3]" />
                </button>
                <span class="flex items-center gap-1.5 text-sm font-semibold" :class="isDisabled(menu.node) ? 'text-muted-foreground' : ''">
                  <IconifyIcon :icon="getNodeIcon(menu.node.type)" class="size-4 shrink-0" :class="getNodeIconClass(isDisabled(menu.node))" />
                  {{ menu.node.title }}
                </span>
              </div>
              <span class="font-mono text-xs text-muted-foreground">ID: {{ menu.node.id }}</span>
            </div>

            <!-- Level 3：按钮权限码 -->
            <div v-if="menu.buttons.length > 0" class="mt-2.5 rounded-xl border bg-muted/50 p-3">
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div
                  v-for="button in menu.buttons"
                  :key="button.id"
                  class="flex min-h-[4rem] flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition-all"
                  :class="[
                    isDisabled(button) || readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    checkButtonClass(checkedKeys.has(button.id) && !isDisabled(button)),
                  ]"
                  @click="!readonly && !isDisabled(button) && toggleCheck(button, !checkedKeys.has(button.id))"
                >
                  <div class="flex items-center justify-center gap-2">
                    <IconifyIcon :icon="getNodeIcon(button.type)" class="size-4 shrink-0" :class="getNodeIconClass(isDisabled(button))" />
                    <div
                      class="flex size-4 shrink-0 items-center justify-center rounded border"
                      :class="checkedKeys.has(button.id) && !isDisabled(button) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'"
                    >
                      <IconifyIcon v-if="checkedKeys.has(button.id) && !isDisabled(button)" icon="lucide:check" class="size-3 stroke-[3]" />
                    </div>
                    <span class="text-sm font-medium" :class="isDisabled(button) ? 'text-muted-foreground' : ''">{{ button.title }}</span>
                  </div>
                  <span v-if="button.subtitle" class="break-all px-1 text-xs" :class="isDisabled(button) ? 'text-muted-foreground/70' : 'text-muted-foreground'">{{
                    button.subtitle
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.permission-assign-panel {
  font-size: var(--font-size-base);
}
</style>
