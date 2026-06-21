<script setup lang="ts">
import type { UserApi } from '#/api/system/user';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteUserApi, batchUpdateUserApi, getUserDetailApi, getUserListApi } from '#/api/system/user';
import BatchActionDropdown from '#/components/table/BatchActionDropdown.vue';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import Online from './modules/online.vue';

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['system:user:create']);
const canBatchDelete = hasAccessByCodes(['system:user:batchDelete']);
const canBatchUpdate = hasAccessByCodes(['system:user:batchUpdate']);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const onlineRef = ref<InstanceType<typeof Online>>();

function onRefresh() {
  gridApi.query();
}

function onOnlineClick(row: UserApi.UserItem) {
  onlineRef.value?.open(row.id);
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
    columns: useColumns(formDrawerApi, onRefresh, onOnlineClick, onEditClick, onDetailClick),
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

function getSelectedIds(): string[] {
  return (gridApi.grid?.getCheckboxRecords() as UserApi.UserItem[])?.map(r => r.id) ?? [];
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Online ref="onlineRef" />
    <Grid :table-title="$t('system.user.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="ml-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="ids => batchDeleteUserApi(ids)"
          :get-ids="getSelectedIds"
          :on-success="onRefresh"
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
          :get-ids="getSelectedIds"
          :on-success="onRefresh"
          :fields="[
            { fieldName: 'status', label: $t('system.user.fields.status'), dictCode: 'sys_user_status' },
            { fieldName: 'gender', label: $t('system.user.fields.gender'), dictCode: 'sys_user_gender' },
          ]"
        />
        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('system.user.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
