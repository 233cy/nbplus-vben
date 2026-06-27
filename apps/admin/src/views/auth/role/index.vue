<script setup lang="ts">
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteRoleApi, batchUpdateRoleApi, getRoleDetailApi, getRoleListApi } from '#/api/auth/role';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import Form from './components/form.vue';
import RoleDataScopeModal from './components/RoleDataScopeModal.vue';
import RolePermissionModal from './components/RolePermissionModal.vue';
import { useRole } from './composables/useRole';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['auth:role:create']);
const canBatchDelete = hasAccessByCodes(['auth:role:batchDelete']);
const canBatchUpdate = hasAccessByCodes(['auth:role:batchUpdate']);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

async function onEditClick(id: string) {
  const res = await getRoleDetailApi(id);
  formDrawerApi.setData(res).open();
}

async function onDetailClick(id: string) {
  const res = await getRoleDetailApi(id);
  formDrawerApi.setData({ ...res, readonly: true }).open();
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
    columns: useColumns(
      onEditClick,
      onDetailClick,
      row => permissionModalApi.setData({ id: row.id, name: row.name }).open(),
      row => dataScopeModalApi.setData({ id: row.id, name: row.name }).open(),
      () => role.onRefresh(),
    ),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getRoleListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const role = useRole(gridApi);

const [PermissionModal, permissionModalApi] = useVbenModal({
  connectedComponent: RolePermissionModal,
  destroyOnClose: true,
});

const [DataScopeModal, dataScopeModalApi] = useVbenModal({
  connectedComponent: RoleDataScopeModal,
  destroyOnClose: true,
});
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="role.onRefresh" />
    <PermissionModal @success="role.onRefresh" />
    <DataScopeModal @success="role.onRefresh" />

    <Grid :table-title="$t('auth.role.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="ml-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteRoleApi(ids)"
          :get-ids="role.getSelectedIds"
          :on-success="role.onRefresh"
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
          :api-fn="batchUpdateRoleApi"
          :get-ids="role.getSelectedIds"
          :on-success="role.onRefresh"
          :fields="[{ fieldName: 'status', label: $t('auth.role.fields.status'), dictCode: 'is_enable' }]"
        />

        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('auth.role.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
