<script setup lang="ts">
import type { DeptApi } from '#/api/sys/userDept';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeptListApi } from '#/api/sys/userDept';
import { $t } from '#/locales';

import DeptForm from './components/dept-form.vue';
import DeptMoveModal from './components/dept-move-modal.vue';
import { useDept, useDeptMove } from './composables';
import { useUserDeptPermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { canCreate } = useUserDeptPermission();

// 先创建 grid，后续把操作回调挂到 handlers 上
const handlers = {
  onAddChild: (_row: DeptApi.DeptItem) => {},
  onDelete: (_row: DeptApi.DeptItem) => {},
  onDetail: (_row: DeptApi.DeptItem) => {},
  onEdit: (_row: DeptApi.DeptItem) => {},
  onMove: (_row: DeptApi.DeptItem) => {},
  onRefreshNode: async (_row: DeptApi.DeptItem) => {},
  onToggleStatus: async (_row: DeptApi.DeptItem, _val: number) => {},
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
        queryApi: getDeptListApi,
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
      loadMethod: async ({ row }: { row: DeptApi.DeptItem }) => {
        const { items } = await getDeptListApi({ parentId: row.id, pageSize: 1000 });
        return items;
      },
    },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const [DeptFormDrawer, deptFormDrawerApi] = useVbenDrawer({
  connectedComponent: DeptForm,
  destroyOnClose: true,
});

const dept = useDept({ gridApi });
const move = useDeptMove({
  t: $t,
  onSuccess: payload => dept.refreshByParentIds([payload.originalParentId, payload.newParentId]),
});

handlers.onAddChild = (row: DeptApi.DeptItem) => deptFormDrawerApi.setData({ parentId: row.id }).open();
handlers.onDelete = dept.handleDelete;
handlers.onDetail = (row: DeptApi.DeptItem) => deptFormDrawerApi.setData({ id: row.id, isDetail: true }).open();
handlers.onEdit = (row: DeptApi.DeptItem) => deptFormDrawerApi.setData({ id: row.id }).open();
handlers.onMove = move.openMove;
handlers.onRefreshNode = dept.handleRefreshNode;
handlers.onToggleStatus = dept.handleToggleStatus;

async function handleFormSuccess(payload: { originalParentId?: null | string; parentId?: null | string }) {
  const parentIds = [payload.parentId, payload.originalParentId].filter((id): id is null | string => id !== undefined);
  await dept.refreshByParentIds(parentIds);
}
</script>

<template>
  <Page auto-content-height>
    <DeptFormDrawer @success="handleFormSuccess" />

    <DeptMoveModal
      v-model:visible="move.visible.value"
      v-model:move-parent-id="move.moveParentId.value"
      :loading="move.loading.value"
      :move-item="move.moveItem.value"
      :tree-data="move.treeSelectData.value"
      @submit="move.handleMove"
    />

    <Grid :table-title="$t('sys.user-dept.pageTitle')">
      <template #toolbar-tools>
        <Space :size="8">
          <Button @click="dept.expandAll">
            <template #icon>
              <IconifyIcon icon="ant-design:node-expand-outlined" />
            </template>
            {{ $t('sys.user-dept.expandAll') }}
          </Button>
          <Button @click="dept.collapseAll">
            <template #icon>
              <IconifyIcon icon="ant-design:node-collapse-outlined" />
            </template>
            {{ $t('sys.user-dept.collapseAll') }}
          </Button>
          <Button v-if="canCreate" type="primary" @click="deptFormDrawerApi.setData({}).open()">
            <Plus class="size-4" />
            {{ $t('sys.user-dept.addRoot') }}
          </Button>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
