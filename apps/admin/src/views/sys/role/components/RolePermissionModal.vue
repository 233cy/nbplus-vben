<script setup lang="ts">
import type { PermissionAssignPanelExpose } from '../shared/permission-assign-panel.vue';
import type { PermissionNode } from '../shared/usePermissionTree';

import type { RoleApi } from '#/api/sys/role';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { getMenuPkgAllApi, getMenuPkgMenuIdsApi } from '#/api/sys/menuPkg.js';
import { assignRoleMenusApi, getRoleMenuTreeApi } from '#/api/sys/role';
import { $t } from '#/locales';

import PermissionAssignPanel from '../shared/permission-assign-panel.vue';

interface MenuPkgOption {
  desc?: string;
  id: string;
  menuIds: string[];
  name: string;
}

const emit = defineEmits<{
  success: [];
}>();

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onConfirm: handleSubmit,
  onOpenChange: handleOpenChange,
});

const panelRef = ref<null | PermissionAssignPanelExpose>(null);
const treeData = ref<PermissionNode[]>([]);
const checkedKeys = ref<string[]>([]);
const packs = ref<MenuPkgOption[]>([]);
const roleId = ref('');
const roleName = ref('');
const loading = ref(false);
const selectedPackIds = ref<Set<string>>(new Set());

const hasPacks = computed(() => packs.value.length > 0);

const nodeMap = computed(() => {
  const map = new Map<string, PermissionNode>();
  function walk(nodes: PermissionNode[]) {
    for (const node of nodes) {
      map.set(String(node.id), node);
      if (node.children?.length) walk(node.children);
    }
  }
  walk(treeData.value);
  return map;
});

function getDescendantIds(node: PermissionNode): string[] {
  const result: string[] = [];
  function walk(n: PermissionNode) {
    if (!n.children?.length) return;
    for (const child of n.children) {
      result.push(String(child.id));
      walk(child);
    }
  }
  walk(node);
  return result;
}

function convertTree(nodes: RoleApi.MenuTreeItem[]): PermissionNode[] {
  return nodes
    .toSorted((a, b) => a.sort - b.sort)
    .map(node => ({
      id: String(node.id),
      type: node.type,
      title: node.title,
      subtitle: node.type === 3 ? node.permission || $t('common.button') : undefined,
      status: node.status,
      name: node.name,
      path: node.path,
      permission: node.permission,
      sort: node.sort,
      checked: node.checked,
      children: node.children?.length ? convertTree(node.children) : [],
    }));
}

async function handleOpenChange(isOpen: boolean) {
  if (!isOpen) return;

  const data = modalApi.getData();
  if (!data?.id) return;

  roleId.value = data.id;
  roleName.value = data.name ?? '';
  loading.value = true;
  selectedPackIds.value = new Set();
  try {
    const [res, packList] = await Promise.all([getRoleMenuTreeApi(data.id), getMenuPkgAllApi()]);
    treeData.value = convertTree(res);

    // 收集初始已勾选
    const checked: string[] = [];
    function collect(nodes: PermissionNode[]) {
      for (const node of nodes) {
        if (node.checked) checked.push(String(node.id));
        if (node.children?.length) collect(node.children);
      }
    }
    collect(treeData.value);
    checkedKeys.value = checked;

    // 加载权限包列表及明细，并计算哪些包已被完全选中
    packs.value = [];
    const checkedSet = new Set(checked);
    for (const item of packList) {
      try {
        const menuPkgRes = await getMenuPkgMenuIdsApi(item.id);
        const menuIds = menuPkgRes.map(String);
        const allIn = menuIds.length > 0 && menuIds.every(id => checkedSet.has(id));
        packs.value.push({
          id: String(item.id),
          name: item.name,
          desc: item.remark,
          menuIds,
        });
        if (allIn) selectedPackIds.value.add(String(item.id));
      } catch {
        // 忽略加载失败的权限包
      }
    }
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!roleId.value || !panelRef.value) return;

  modalApi.setState({ loading: true });
  try {
    const keys = panelRef.value.getCheckedKeys();
    await assignRoleMenusApi(roleId.value, keys);
    message.success($t('sys.role.msg.ASSIGN_MENUS_SUCCESS'));
    emit('success');
    modalApi.close();
  } finally {
    modalApi.setState({ loading: false });
  }
}

function handlePanelChange(keys: string[]) {
  checkedKeys.value = keys;
  syncPackSelection(keys);
}

function syncPackSelection(keys: string[]) {
  const keySet = new Set(keys.map(String));
  const next = new Set<string>();
  for (const pack of packs.value) {
    const allIn = pack.menuIds.length > 0 && pack.menuIds.every(id => keySet.has(id));
    if (allIn) next.add(pack.id);
  }
  selectedPackIds.value = next;
}

function handleReset() {
  const checked: string[] = [];
  function collect(nodes: PermissionNode[]) {
    for (const node of nodes) {
      if (node.checked) checked.push(String(node.id));
      if (node.children?.length) collect(node.children);
    }
  }
  collect(treeData.value);
  checkedKeys.value = checked;
  syncPackSelection(checked);
}

function handleApplyPack(pack: MenuPkgOption) {
  const keySet = new Set(checkedKeys.value.map(String));
  const isSelected = selectedPackIds.value.has(pack.id);

  if (isSelected) {
    for (const id of pack.menuIds) {
      const node = nodeMap.value.get(id);
      if (node) {
        keySet.delete(String(node.id));
        for (const descId of getDescendantIds(node)) keySet.delete(descId);
      } else {
        keySet.delete(id);
      }
    }
  } else {
    for (const id of pack.menuIds) {
      const node = nodeMap.value.get(id);
      if (node) {
        keySet.add(String(node.id));
        for (const descId of getDescendantIds(node)) keySet.add(descId);
      } else {
        keySet.add(id);
      }
    }
  }

  checkedKeys.value = [...keySet];
  syncPackSelection(checkedKeys.value);
}
</script>

<template>
  <Modal :title="$t('sys.role.permission.title')" class="!w-[1400px] max-w-[95vw]">
    <div class="flex h-[70vh] flex-col overflow-hidden rounded-lg border bg-card">
      <div class="flex flex-1 overflow-hidden">
        <!-- Left: Permission Packs -->
        <div v-if="hasPacks" class="w-full flex-shrink-0 border-r bg-muted/30 p-4 sm:w-80">
          <div class="mb-4 rounded-lg border bg-card p-4">
            <div class="text-sm font-bold uppercase tracking-wider text-muted-foreground">正在操作的角色</div>
            <div class="mt-1 flex items-center gap-2 text-base font-semibold">
              <IconifyIcon icon="lucide:user" class="size-4 text-primary" />
              {{ roleName }}
            </div>
          </div>

          <div class="space-y-3">
            <div class="text-sm font-bold uppercase tracking-wider text-muted-foreground">可选权限包</div>
            <div
              v-for="pack in packs"
              :key="pack.id"
              class="cursor-pointer rounded-xl border p-3 transition-all"
              :class="selectedPackIds.has(pack.id) ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'"
              @click="handleApplyPack(pack)"
            >
              <div class="flex items-start gap-2">
                <div
                  class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border"
                  :class="selectedPackIds.has(pack.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'"
                >
                  <IconifyIcon v-if="selectedPackIds.has(pack.id)" icon="lucide:check" class="size-3 stroke-[3]" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm font-semibold">{{ pack.name }}</div>
                  <div v-if="pack.desc" class="mt-0.5 text-sm leading-normal text-muted-foreground">{{ pack.desc }}</div>
                  <div class="mt-1 text-sm text-muted-foreground">{{ pack.menuIds.length }} 个权限</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Permission Panel -->
        <div class="flex flex-1 flex-col overflow-hidden p-5">
          <PermissionAssignPanel ref="panelRef" :checked-keys="checkedKeys" :tree-data="treeData" @change="handlePanelChange" @reset="handleReset" />

          <div class="mt-4 flex items-center border-t pt-4">
            <span class="text-sm text-muted-foreground">{{ hasPacks ? '点击左侧权限包可快速覆盖勾选' : '直接勾选右侧权限节点' }}</span>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
