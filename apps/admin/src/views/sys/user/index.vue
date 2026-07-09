<script setup lang="ts">
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteUserApi, batchUpdateUserApi, getUserDetailApi, getUserListApi } from '#/api/sys/user.js';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { $t } from '#/locales';
import { useTableBatchAction } from '#/utils/table';

import BatchRoleModal from './components/batch-role-modal.vue';
import Form from './components/form.vue';
import Online from './components/online.vue';
import { useUser } from './composables/useUser';
import { useUserPermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { canCreate, canBatchDelete, canBatchUpdate } = useUserPermission();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [BatchRoleModalComponent, batchRoleModalApi] = useVbenModal({
  connectedComponent: BatchRoleModal,
  destroyOnClose: true,
});

function handleBatchRoleConfirm(roleIds: string[]) {
  useTableBatchAction(
    (ids: string[]) => batchUpdateUserApi(ids, 'roleIds', roleIds),
    user.getSelectedIds(),
    $t('sys.user.batchRole.action'),
    () => user.onRefresh(),
  );
}

async function onEditClick(id: string) {
  const res = await getUserDetailApi(id);
  formDrawerApi.setData(res).open();
}

async function onDetailClick(id: string) {
  const res = await getUserDetailApi(id);
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
      row => user.onlineRef.value?.open(row.id),
      () => user.onRefresh(),
    ),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getUserListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const user = useUser(gridApi);
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="user.onRefresh" />
    <BatchRoleModalComponent @confirm="handleBatchRoleConfirm" />
    <Online :ref="user.onlineRef" />
    <Grid :table-title="$t('sys.user.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="ml-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteUserApi(ids)"
          :get-ids="user.getSelectedIds"
          :on-success="user.onRefresh"
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
          class="ml-2"
          type="multi"
          :action="$t('common.batchUpdate')"
          :api-fn="batchUpdateUserApi"
          :get-ids="user.getSelectedIds"
          :on-success="user.onRefresh"
          :fields="[
            { fieldName: 'status', label: $t('sys.user.fields.status'), dictCode: 'sys_user_status' },
            { fieldName: 'gender', label: $t('sys.user.fields.gender'), dictCode: 'sys_user_gender' },
          ]"
        />

        <Button v-if="canBatchUpdate" class="ml-2 mr-2" @click="batchRoleModalApi.setData({}).open()">
          <IconifyIcon icon="lucide:user-cog" class="size-4" />
          {{ $t('sys.user.batchRole.action') }}
        </Button>

        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('sys.user.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
