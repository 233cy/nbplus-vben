<script setup lang="ts">
import type { UserApi } from '#/api/system/user';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteUserApi, batchUpdateUserApi, getUserListApi } from '#/api/system/user';
import BatchActionDropdown from '#/components/table/BatchActionDropdown.vue';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import Online from './modules/online.vue';

interface PageInfo {
  currentPage: number;
  pageSize: number;
}
interface QueryParams {
  page: PageInfo;
}

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

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
    showCollapseButton: true,
    submitOnChange: false,
    wrapperClass: 'grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(formDrawerApi, onRefresh, onOnlineClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }: QueryParams, formValues: UserApi.PageParams) => {
          return await getUserListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
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
          class="ml-2"
          type="dict"
          :action="$t('common.batchUpdateField', { field: $t('system.user.fields.status') })"
          field-name="status"
          dict-code="sys_user_status"
          :api-fn="batchUpdateUserApi"
          :get-ids="getSelectedIds"
          :on-success="onRefresh"
        />
        <BatchActionDropdown
          v-if="canBatchUpdate"
          class="ml-2 mr-2"
          type="dict"
          :action="$t('common.batchUpdateField', { field: $t('system.user.fields.gender') })"
          field-name="gender"
          dict-code="sys_user_gender"
          :api-fn="batchUpdateUserApi"
          :get-ids="getSelectedIds"
          :on-success="onRefresh"
        />
        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('system.user.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
