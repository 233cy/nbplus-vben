<script setup lang="ts">
import type { RoleApi } from '#/api/auth/role';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, RadioGroup, Space, Tree } from 'ant-design-vue';

import { assignRoleDataScopeApi, getRoleDataScopeApi, getRoleDeptTreeApi } from '#/api/auth/role';
import { $t } from '#/locales';

const emit = defineEmits<{
  success: [];
}>();

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onConfirm: handleSubmit,
  onOpenChange: handleOpenChange,
});

const dataScopeOptions = computed(() => [
  { label: $t('auth.role.dataScope.all'), value: 1 },
  { label: $t('auth.role.dataScope.dept'), value: 2 },
  { label: $t('auth.role.dataScope.deptAndBelow'), value: 3 },
  { label: $t('auth.role.dataScope.self'), value: 4 },
  { label: $t('auth.role.dataScope.custom'), value: 5 },
]);

const dataScope = ref(1);
const deptTree = ref<any[]>([]);
const checkedDeptKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const roleId = ref('');

const isCustom = computed(() => dataScope.value === 5);

function convertDeptTree(nodes: RoleApi.DeptTreeItem[]): any[] {
  return nodes.map(node => ({
    title: node.name,
    key: node.id,
    children: node.children?.length ? convertDeptTree(node.children) : [],
  }));
}

async function handleOpenChange(isOpen: boolean) {
  if (!isOpen) return;

  const data = modalApi.getData();
  if (!data?.id) return;

  roleId.value = data.id;
  const [scopeRes, treeRes] = await Promise.all([getRoleDataScopeApi(data.id), getRoleDeptTreeApi()]);

  dataScope.value = scopeRes.dataScope;
  checkedDeptKeys.value = scopeRes.deptIds || [];
  deptTree.value = convertDeptTree(treeRes);

  const expanded: string[] = [];
  function collect(nodes: any[]) {
    for (const node of nodes) {
      expanded.push(node.key);
      if (node.children?.length) {
        collect(node.children);
      }
    }
  }
  collect(deptTree.value);
  expandedKeys.value = expanded;
}

function handleExpandAll() {
  expandedKeys.value = getAllKeys(deptTree.value);
}

function handleCollapseAll() {
  expandedKeys.value = [];
}

function handleCheckAll() {
  checkedDeptKeys.value = getAllKeys(deptTree.value);
}

function handleUncheckAll() {
  checkedDeptKeys.value = [];
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
    await assignRoleDataScopeApi(roleId.value, dataScope.value, isCustom.value ? checkedDeptKeys.value : []);
    message.success($t('auth.role.msg.ASSIGN_DATA_SCOPE_SUCCESS'));
    emit('success');
    modalApi.close();
  } finally {
    modalApi.setState({ loading: false });
  }
}
</script>

<template>
  <Modal :title="$t('auth.role.dataScopeModal.title')" width="640px">
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium">{{ $t('auth.role.dataScopeModal.scopeLabel') }}</label>
      <RadioGroup v-model:value="dataScope" :options="dataScopeOptions" />
    </div>

    <div class="mb-2 flex items-center justify-between">
      <span class="text-sm font-medium">{{ $t('auth.role.fields.dataScopeCustom') }}</span>
      <Space v-if="isCustom">
        <Button size="small" @click="handleExpandAll">{{ $t('auth.role.dataScopeModal.expandAll') }}</Button>
        <Button size="small" @click="handleCollapseAll">{{ $t('auth.role.dataScopeModal.collapseAll') }}</Button>
        <Button size="small" @click="handleCheckAll">{{ $t('auth.role.dataScopeModal.checkAll') }}</Button>
        <Button size="small" @click="handleUncheckAll">{{ $t('auth.role.dataScopeModal.uncheckAll') }}</Button>
      </Space>
    </div>

    <Tree
      v-model:checked-keys="checkedDeptKeys"
      v-model:expanded-keys="expandedKeys"
      :tree-data="deptTree"
      :disabled="!isCustom"
      checkable
      block-node
      class="max-h-[45vh] overflow-y-auto rounded border p-2"
    />
  </Modal>
</template>
