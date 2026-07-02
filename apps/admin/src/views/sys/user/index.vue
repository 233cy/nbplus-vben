<script setup lang="ts">
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteUserApi, batchUpdateUserApi, getUserDetailApi, getUserListApi } from '#/api/sys/user.js';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import Form from './components/form.vue';
import Online from './components/online.vue';
import { useUser } from './composables/useUser';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['org:user:create']);
const canBatchDelete = hasAccessByCodes(['org:user:batchDelete']);
const canBatchUpdate = hasAccessByCodes(['org:user:batchUpdate']);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

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
          class="ml-2 mr-2"
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

        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('sys.user.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
