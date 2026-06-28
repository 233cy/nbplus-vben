<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Space, Tree } from 'ant-design-vue';
import { message } from 'ant-design-vue';

import { assignRoleMenusApi, getRoleMenuTreeApi } from '#/api/admin/sys/role';
import { $t } from '#/locales';

import type { RoleApi } from '#/api/admin/sys/role';

const emit = defineEmits<{
  success: [];
}>();

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onConfirm: handleSubmit,
  onOpenChange: handleOpenChange,
});

const treeData = ref<any[]>([]);
const checkedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const roleId = ref('');

function convertTree(nodes: RoleApi.MenuTreeItem[]): any[] {
  return [...nodes]
    .sort((a, b) => a.sort - b.sort)
    .map((node) => ({
      title: `${node.title} ${node.type === 3 ? `(${node.permission || $t('common.button')})` : ''}`,
      key: node.id,
      checked: node.checked,
      checkable: true,
      selectable: false,
      type: node.type,
      sort: node.sort,
      children: node.children?.length ? convertTree(node.children) : [],
    }));
}

async function handleOpenChange(isOpen: boolean) {
  if (!isOpen) return;

  const data = modalApi.getData();
  if (!data?.id) return;

  roleId.value = data.id;
  const res = await getRoleMenuTreeApi(data.id);
  treeData.value = convertTree(res);

  const checked: string[] = [];
  const expanded: string[] = [];
  function collect(nodes: any[]) {
    for (const node of nodes) {
      expanded.push(node.key);
      if (node.checked) {
        checked.push(node.key);
      }
      if (node.children?.length) {
        collect(node.children);
      }
    }
  }
  collect(treeData.value);
  checkedKeys.value = checked;
  expandedKeys.value = expanded;
}

function handleExpandAll() {
  expandedKeys.value = getAllKeys(treeData.value);
}

function handleCollapseAll() {
  expandedKeys.value = [];
}

function handleCheckAll() {
  checkedKeys.value = getAllKeys(treeData.value);
}

function handleUncheckAll() {
  checkedKeys.value = [];
}

function handleCheckByType(type: number) {
  const keys: string[] = [];
  function walk(nodes: any[]) {
    for (const node of nodes) {
      if (node.type === type) {
        keys.push(node.key);
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }
  walk(treeData.value);

  const set = new Set(checkedKeys.value);
  keys.forEach((key) => set.add(key));
  checkedKeys.value = Array.from(set);
}

function getAllKeys(nodes: any[]): string[] {
  const keys: string[] = [];
  function walk(items: any[]) {
    for (const item of items) {
      keys.push(item.key);
      if (item.children?.length) {
        walk(item.children);
      }
    }
  }
  walk(nodes);
  return keys;
}

async function handleSubmit() {
  if (!roleId.value) return;

  modalApi.setState({ loading: true });
  try {
    await assignRoleMenusApi(roleId.value, checkedKeys.value);
    message.success($t('auth.role.msg.ASSIGN_MENUS_SUCCESS'));
    emit('success');
    modalApi.close();
  } finally {
    modalApi.setState({ loading: false });
  }
}
</script>

<template>
  <Modal :title="$t('auth.role.permission.title')" width="720px">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <Space wrap>
        <Button size="small" @click="handleExpandAll">{{ $t('auth.role.permission.expandAll') }}</Button>
        <Button size="small" @click="handleCollapseAll">{{ $t('auth.role.permission.collapseAll') }}</Button>
        <Button size="small" @click="handleCheckAll">{{ $t('auth.role.permission.checkAll') }}</Button>
        <Button size="small" @click="handleUncheckAll">{{ $t('auth.role.permission.uncheckAll') }}</Button>
      </Space>
      <Space wrap>
        <Button size="small" @click="() => handleCheckByType(1)">{{ $t('auth.role.permission.checkCatalog') }}</Button>
        <Button size="small" @click="() => handleCheckByType(2)">{{ $t('auth.role.permission.checkMenu') }}</Button>
        <Button size="small" @click="() => handleCheckByType(3)">{{ $t('auth.role.permission.checkButton') }}</Button>
      </Space>
    </div>

    <div class="mb-2 text-sm text-muted-foreground">
      {{ $t('auth.role.permission.selectedCount', { count: checkedKeys.length }) }}
    </div>

    <Tree
      v-model:checked-keys="checkedKeys"
      v-model:expanded-keys="expandedKeys"
      :tree-data="treeData"
      checkable
      block-node
      class="max-h-[55vh] overflow-y-auto rounded border p-2"
    />
  </Modal>
</template>
