<script setup lang="ts">
import type { DeptApi } from '#/api/sys/userDept';

import { Page } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeptListApi } from '#/api/sys/userDept';
import { $t } from '#/locales';

import DeptForm from './components/dept-form.vue';
import DeptMoveModal from './components/dept-move-modal.vue';
import { useDept, useDeptForm, useDeptMove } from './composables';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

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

const dept = useDept({ gridApi });
const form = useDeptForm({ gridApi, t: $t });
const move = useDeptMove({ gridApi, t: $t });

handlers.onAddChild = (row: DeptApi.DeptItem) => form.openCreate(row.id);
handlers.onDelete = dept.handleDelete;
handlers.onDetail = (row: DeptApi.DeptItem) => form.openDetail(row.id);
handlers.onEdit = (row: DeptApi.DeptItem) => form.openEdit(row.id);
handlers.onMove = move.openMove;
handlers.onRefreshNode = dept.handleRefreshNode;
handlers.onToggleStatus = dept.handleToggleStatus;
</script>

<template>
  <Page auto-content-height>
    <DeptForm
      v-model:form="form.form.value"
      v-model:visible="form.visible.value"
      :is-detail="form.isDetail.value"
      :is-edit="form.isEdit.value"
      :loading="form.loading.value"
      :title="form.title.value"
      :tree-data="form.treeData.value"
      :tree-expanded-keys="form.treeExpandedKeys.value"
      :tree-loading="form.treeLoading.value"
      @submit="form.handleSubmit"
    />

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
          <Button type="primary" @click="form.openCreate()">
            <Plus class="size-4" />
            {{ $t('sys.user-dept.addRoot') }}
          </Button>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
