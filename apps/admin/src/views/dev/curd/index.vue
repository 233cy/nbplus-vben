<script setup lang="ts">
import type { CurdAdminApi } from '#/api/dev/curdAdmin';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, message, Popconfirm, Space, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCurdTableApi, getCurdTableListApi } from '#/api/dev/curdAdmin';
import { $t } from '#/locales';

import FieldForm from './components/field-form.vue';
import MenuForm from './components/menu-form.vue';
import TableForm from './components/table-form.vue';
import { useCurd } from './composables/useCurd';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const curd = useCurd();

const [TableFormModal, tableFormModalApi] = useVbenModal({
  connectedComponent: TableForm,
});

const fieldFormRef = ref<InstanceType<typeof FieldForm> | null>(null);
const menuFormRef = ref<InstanceType<typeof MenuForm> | null>(null);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
    showCollapseButton: true,
    submitOnChange: false,
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        queryApi: getCurdTableListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

curd.gridApi.value = gridApi;

function onEditClick(row: CurdAdminApi.CurdTable) {
  tableFormModalApi.setData({ row }).open();
}

function onDeleteClick(row: CurdAdminApi.CurdTable) {
  deleteCurdTableApi(row.id).then(() => {
    curd.onRefresh();
    message.success($t('dev.curd.deleteSuccess'));
  });
}

function onCreateClick() {
  tableFormModalApi.setData({}).open();
}

function onFieldConfigClick(row: CurdAdminApi.CurdTable) {
  fieldFormRef.value?.open(row);
}

function onCreateMenuClick(row: CurdAdminApi.CurdTable) {
  menuFormRef.value?.open(row);
}

function onGenerateClick(row: CurdAdminApi.CurdTable) {
  curd.onGenerate(row);
}
</script>

<template>
  <Page auto-content-height>
    <TableFormModal @success="curd.onRefresh" />
    <FieldForm ref="fieldFormRef" />
    <MenuForm ref="menuFormRef" />

    <Grid :table-title="$t('dev.curd.pageTitle')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreateClick">
          <Plus class="size-5" />
          {{ $t('dev.curd.table.add') }}
        </Button>
      </template>

      <template #operation="{ row }">
        <Space>
          <Tooltip :title="$t('dev.curd.field.title')">
            <Button size="small" type="text" @click="onFieldConfigClick(row as CurdAdminApi.CurdTable)">
              <IconifyIcon icon="ant-design:table-outlined" />
            </Button>
          </Tooltip>
          <Tooltip :title="$t('dev.curd.generate')">
            <Button size="small" type="text" :loading="curd.generateLoading.value[row.id]" @click="onGenerateClick(row as CurdAdminApi.CurdTable)">
              <IconifyIcon icon="ant-design:code-outlined" />
            </Button>
          </Tooltip>
          <Tooltip :title="$t('dev.curd.createMenu')">
            <Button size="small" type="text" @click="onCreateMenuClick(row as CurdAdminApi.CurdTable)">
              <IconifyIcon icon="ant-design:menu-outlined" />
            </Button>
          </Tooltip>
          <Tooltip :title="$t('common.edit')">
            <Button size="small" type="text" @click="onEditClick(row as CurdAdminApi.CurdTable)">
              <IconifyIcon icon="ant-design:edit-outlined" />
            </Button>
          </Tooltip>
          <Popconfirm :title="$t('dev.curd.table.confirmDelete')" @confirm="onDeleteClick(row as CurdAdminApi.CurdTable)">
            <Tooltip :title="$t('common.delete')">
              <Button size="small" type="text" danger>
                <IconifyIcon icon="ant-design:delete-outlined" />
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
