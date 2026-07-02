<script setup lang="ts">
import type { PermissionAssignPanelExpose } from '../../role/shared/permission-assign-panel.vue';
import type { PermissionNode } from '../../role/shared/usePermissionTree';

import type { MenuPkgApi } from '#/api/sys/menu-pkg';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { assignMenuPkgMenusApi, getMenuPkgMenuIdsApi, getMenuPkgMenuTreeApi } from '#/api/sys/menu-pkg';
import { $t } from '#/locales';

import PermissionAssignPanel from '../../role/shared/permission-assign-panel.vue';

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
const pkgId = ref('');
const pkgName = ref('');

function convertTree(nodes: MenuPkgApi.MenuTreeItem[]): PermissionNode[] {
  return nodes
    .toSorted((a, b) => a.sort - b.sort)
    .map(node => ({
      id: String(node.id),
      type: node.type,
      status: node.status,
      title: node.title,
      subtitle: node.type === 3 ? node.permission || $t('common.button') : undefined,
      name: node.name,
      path: node.path,
      permission: node.permission,
      sort: node.sort,
      children: node.children?.length ? convertTree(node.children) : [],
    }));
}

async function handleOpenChange(isOpen: boolean) {
  if (!isOpen) return;

  const data = modalApi.getData();
  if (!data?.id) return;

  pkgId.value = data.id;
  pkgName.value = data.name ?? '';

  const [treeRes, menuIds] = await Promise.all([getMenuPkgMenuTreeApi(), getMenuPkgMenuIdsApi(data.id)]);
  treeData.value = convertTree(treeRes);
  checkedKeys.value = menuIds.map(String);
}

async function handleSubmit() {
  if (!pkgId.value || !panelRef.value) return;

  modalApi.setState({ loading: true });
  try {
    const keys = panelRef.value.getCheckedKeys();
    await assignMenuPkgMenusApi(pkgId.value, keys);
    message.success($t('sys.menu-pkg.msg.ASSIGN_MENUS_SUCCESS'));
    emit('success');
    modalApi.close();
  } finally {
    modalApi.setState({ loading: false });
  }
}

function handlePanelChange(keys: string[]) {
  checkedKeys.value = keys;
}

function handleReset() {
  if (!pkgId.value) return;
  getMenuPkgMenuIdsApi(pkgId.value).then(ids => {
    checkedKeys.value = ids.map(String);
  });
}
</script>

<template>
  <Modal :title="$t('sys.menu-pkg.assignMenus') + (pkgName ? ` - ${pkgName}` : '')" class="!w-[1200px] max-w-[95vw]">
    <div class="flex h-[70vh] flex-col overflow-hidden rounded-lg border bg-card p-5">
      <div v-if="pkgName" class="mb-4 rounded-lg border bg-muted/30 p-4">
        <div class="text-sm font-bold uppercase tracking-wider text-muted-foreground">正在操作的权限包</div>
        <div class="mt-1 flex items-center gap-2 text-base font-semibold">
          <IconifyIcon icon="lucide:shield" class="size-4 text-primary" />
          {{ pkgName }}
        </div>
      </div>

      <PermissionAssignPanel
        ref="panelRef"
        :checked-keys="checkedKeys"
        :tree-data="treeData"
        search-placeholder="搜索菜单或权限点..."
        @change="handlePanelChange"
        @reset="handleReset"
      />
    </div>
  </Modal>
</template>
