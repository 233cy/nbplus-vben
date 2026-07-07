<script setup lang="ts">
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMenuListApi } from '#/api/sys/menuAdmin';
import { $t } from '#/locales';

import MenuForm from './components/menu-form.vue';
import MenuMethodPicker from './components/menu-method-picker.vue';
import MenuMoveModal from './components/menu-move-modal.vue';
import MenuPermissionModal from './components/menu-permission-modal.vue';
import { useMenu, useMenuForm, useMenuMove, useMenuPermission } from './composables';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const handlers = {
  onAddChild: (_row: MenuAdminApi.MenuItem) => {},
  onDelete: (_row: MenuAdminApi.MenuItem) => {},
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

const menu = useMenu({ gridApi });
const form = useMenuForm({ gridApi, t: $t });
const move = useMenuMove({ gridApi, t: $t });
const permission = useMenuPermission({ reload: () => gridApi.query(), t: $t });

handlers.onAddChild = (row: MenuAdminApi.MenuItem) => form.openCreate(row.id);
handlers.onDelete = menu.handleDelete;
handlers.onEdit = form.openEdit;
handlers.onGeneratePermission = permission.openGeneratePermission;
handlers.onMove = move.openMove;
handlers.onRefreshNode = menu.handleRefreshNode;

function handlePickMethod() {
  permission.openPickMethod();
}

function onMethodPicked(permissionCode: string, title?: string) {
  form.form.value.permission = permissionCode;
  if (title && !form.form.value.title) {
    form.form.value.title = title;
  }
}

const checkedCount = computed(() => (gridApi.grid as any)?.getCheckboxRecords?.().length ?? 0);

async function handleBatchDelete() {
  const rows = (gridApi.grid as any)?.getCheckboxRecords?.() ?? [];
  const ids = rows.map((row: MenuAdminApi.MenuItem) => row.id);
  await menu.handleBatchDelete(ids);
}
</script>

<template>
  <Page auto-content-height>
    <MenuForm
      v-model:form="form.form.value"
      v-model:visible="form.visible.value"
      :is-edit="form.isEdit.value"
      :loading="form.loading.value"
      :title="form.title.value"
      :available-types="form.availableTypes.value"
      @submit="form.handleSubmit"
      @open-pick-method="handlePickMethod"
    />

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
      v-model:gen-prefix="permission.genPrefix.value"
      v-model:gen-selected="permission.genSelected.value"
      :loading="permission.genLoading.value"
      :gen-item="permission.genItem.value"
      :permission-options="permission.permissionOptions"
      @submit="permission.handleGeneratePermission"
    />

    <MenuMethodPicker
      v-model:visible="permission.pickVisible.value"
      v-model:controller-prefix="permission.pickControllerPrefix.value"
      v-model:permission-prefix="permission.pickPermissionPrefix.value"
      v-model:selected="permission.pickSelected.value"
      :loading="permission.pickLoading.value"
      :methods="permission.methodOptions()"
      @scan="permission.handleScanMethods"
      @pick="permission.handlePickMethod(onMethodPicked)"
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
          <Button :disabled="checkedCount === 0" danger @click="handleBatchDelete">
            <template #icon>
              <IconifyIcon icon="ant-design:delete-outlined" />
            </template>
            {{ $t('common.batchDelete') }} {{ checkedCount > 0 ? `(${checkedCount})` : '' }}
          </Button>
          <Button type="primary" @click="form.openCreate()">
            <Plus class="size-4" />
            {{ $t('sys.menu.addRoot') }}
          </Button>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
