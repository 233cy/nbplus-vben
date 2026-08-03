<script setup lang="ts">
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteMenuPkgApi, batchUpdateMenuPkgApi, getMenuPkgDetailApi, getMenuPkgListApi } from '#/api/sys/menuPkg.js';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { $t } from '#/locales';

import AssignMenus from './components/assign-menus.vue';
import Form from './components/form.vue';
import { useMenuPkg } from './composables/useMenuPkg';
import { useMenuPkgPermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { canCreate, canBatchDelete, canBatchUpdate } = useMenuPkgPermission();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [AssignMenusModal, assignMenusModalApi] = useVbenModal({
  connectedComponent: AssignMenus,
  destroyOnClose: true,
});

async function onEditClick(id: string) {
  const res = await getMenuPkgDetailApi(id);
  formDrawerApi.setData(res).open();
}

async function onDetailClick(id: string) {
  const res = await getMenuPkgDetailApi(id);
  formDrawerApi.setData({ ...res, readonly: true }).open();
}

function onAssignMenus(row: any) {
  assignMenusModalApi.setData({ id: row.id, name: row.name }).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
    showCollapseButton: true,
    submitOnChange: false,
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(onEditClick, onDetailClick, onAssignMenus, () => menuPkg.onRefresh()),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getMenuPkgListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const menuPkg = useMenuPkg(gridApi);
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="menuPkg.onRefresh" />
    <AssignMenusModal @success="menuPkg.onRefresh" />

    <Grid :table-title="$t('sys.menu-pkg.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="ml-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteMenuPkgApi(ids)"
          :get-ids="menuPkg.getSelectedIds"
          :on-success="menuPkg.onRefresh"
        >
          <template #default="{ onClick }">
            <Button danger @click="onClick">
              <IconifyIcon icon="lucide:trash-2" class="size-4" />
              {{ $t('common.batchDelete') }}
            </Button>
          </template>
        </BatchActionDropdown>

        <BatchActionDropdown
          v-if="canBatchUpdate"
          class="ml-2 mr-2"
          type="multi"
          :action="$t('common.batchUpdate')"
          :api-fn="batchUpdateMenuPkgApi"
          :get-ids="menuPkg.getSelectedIds"
          :on-success="menuPkg.onRefresh"
          :fields="[{ fieldName: 'status', label: $t('common.status'), dictCode: 'is_enable' }]"
        />

        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('sys.menu-pkg.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
