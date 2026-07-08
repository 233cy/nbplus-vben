<script setup lang="ts">
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteMenuApi, getMenuListApi } from '#/api/sys/menuAdmin';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import MenuForm from './components/menu-form.vue';
import MenuMoveModal from './components/menu-move-modal.vue';
import MenuPermissionModal from './components/menu-permission-modal.vue';
import { useMenu, useMenuMove, useMenuPermission } from './composables';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const handlers = {
  onAddChild: (_row: MenuAdminApi.MenuItem) => {},
  onDelete: (_row: MenuAdminApi.MenuItem) => {},
  onDetail: (_row: MenuAdminApi.MenuItem) => {},
  onEdit: (_row: MenuAdminApi.MenuItem) => {},
  onGeneratePermission: (_row: MenuAdminApi.MenuItem) => {},
  onMove: (_row: MenuAdminApi.MenuItem) => {},
  onRefreshNode: async (_row: MenuAdminApi.MenuItem) => {},
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: false,
    schema: useGridFormSchema(),
    submitOnChange: false,
  },
  gridOptions: {
    columns: useColumns(handlers),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getMenuListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: {
      checkStrictly: true,
    },
    treeConfig: {
      showLine: false,
      showRootLine: true,
      transform: true,
      rowField: 'id',
      parentField: 'parentId',
      hasChildField: 'hasChild',
      lazy: true,
      loadMethod: async ({ row }: { row: MenuAdminApi.MenuItem }) => {
        const { items } = await getMenuListApi({ parentId: row.id, pageSize: 1000 });
        return items;
      },
    },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const [MenuFormDrawer, menuFormDrawerApi] = useVbenDrawer({
  connectedComponent: MenuForm,
  destroyOnClose: true,
});

const { hasAccessByCodes } = useAccess();
const canBatchDelete = hasAccessByCodes(['adm:sys:menu:batchDelete']);

const menu = useMenu({ gridApi });
const move = useMenuMove({
  t: $t,
  onSuccess: (payload) => menu.refreshByParentIds([payload.originalParentId, payload.newParentId]),
});
const permission = useMenuPermission({
  t: $t,
  onSuccess: (item) => menu.refreshByParentId(item.id),
});

handlers.onAddChild = (row: MenuAdminApi.MenuItem) => menuFormDrawerApi.setData({ parentId: row.id }).open();
handlers.onDelete = menu.handleDelete;
handlers.onDetail = (row: MenuAdminApi.MenuItem) => menuFormDrawerApi.setData({ id: row.id, isDetail: true }).open();
handlers.onEdit = (row: MenuAdminApi.MenuItem) => menuFormDrawerApi.setData({ id: row.id }).open();
handlers.onGeneratePermission = permission.openGeneratePermission;
handlers.onMove = move.openMove;
handlers.onRefreshNode = menu.handleRefreshNode;

async function handleFormSuccess(payload: { parentId?: string | null; originalParentId?: string | null }) {
  const parentIds = [payload.parentId, payload.originalParentId].filter((id): id is string | null => id !== undefined);
  await menu.refreshByParentIds(parentIds);
}

const selectedRowsForBatchDelete = ref<MenuAdminApi.MenuItem[]>([]);

function handleBatchDeleteClick(onClick: () => void) {
  selectedRowsForBatchDelete.value = menu.getSelectedRows();
  onClick();
}

async function handleBatchDeleteSuccess() {
  const parentIds = selectedRowsForBatchDelete.value.map((row) => row.parentId);
  await menu.refreshByParentIds(parentIds);
  selectedRowsForBatchDelete.value = [];
}

function openCreate() {
  menuFormDrawerApi.setData({}).open();
}
</script>

<template>
  <Page auto-content-height>
    <MenuFormDrawer @success="handleFormSuccess" />

    <MenuMoveModal
      v-model:visible="move.visible.value"
      v-model:move-parent-id="move.moveParentId.value"
      :loading="move.loading.value"
      :move-item="move.moveItem.value"
      :tree-data="move.treeSelectData.value"
      @submit="move.handleMove"
    />

    <MenuPermissionModal
      v-model:visible="permission.genVisible.value"
      mode="multiple"
      :gen-item="permission.genItem.value"
      @submit="permission.handleGeneratePermission"
    />

    <Grid :table-title="$t('sys.menu.pageTitle')">
      <template #toolbar-tools>
        <Space :size="8">
          <Button @click="menu.expandAll">
            <template #icon>
              <IconifyIcon icon="ant-design:node-expand-outlined" />
            </template>
            {{ $t('sys.menu.expandAll') }}
          </Button>
          <Button @click="menu.collapseAll">
            <template #icon>
              <IconifyIcon icon="ant-design:node-collapse-outlined" />
            </template>
            {{ $t('sys.menu.collapseAll') }}
          </Button>
          <BatchActionDropdown
            v-if="canBatchDelete"
            type="direct"
            :action="$t('common.delete')"
            :api-fn="(ids: string[]) => batchDeleteMenuApi(ids)"
            :get-ids="menu.getSelectedIds"
            :on-success="handleBatchDeleteSuccess"
          >
            <template #default="{ onClick }">
              <Button danger @click="handleBatchDeleteClick(onClick)">
                <IconifyIcon icon="ant-design:delete-outlined" class="size-4" />
                {{ $t('common.batchDelete') }}
              </Button>
            </template>
          </BatchActionDropdown>
          <Button type="primary" @click="openCreate">
            <Plus class="size-4" />
            {{ $t('sys.menu.addRoot') }}
          </Button>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
