<script setup lang="ts">
import type { SysUserApi } from '#/api/system/sys-user';

import { useAccess } from '#/composables/use-access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteSysUserApi, batchUpdateSysUserApi, getSysUserListApi } from '#/api/system/sys-user';
import BatchActionDropdown from '#/components/table/BatchActionDropdown.vue';
import { $t } from '#/locales';
import { useTableBatchAction } from '#/utils/table';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

interface PageInfo { currentPage: number; pageSize: number; }
interface QueryParams { page: PageInfo; }

const { hasAccessByCodes } = useAccess();
const systemSysUserResource = 'system:sys-user';
const canCreate = hasAccessByCodes([systemSysUserResource + ':create']);
const canBatchDelete = hasAccessByCodes([systemSysUserResource + ':batchDelete']);
const canBatchUpdate = hasAccessByCodes([systemSysUserResource + ':batchUpdate']);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onRefresh() { gridApi.query(); }

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
    showCollapseButton: true,
    submitOnChange: false,
    wrapperClass: 'grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(formDrawerApi, onRefresh),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }: QueryParams, formValues: SysUserApi.PageParams) => {
          return await getSysUserListApi({
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
  return (gridApi.grid?.getCheckboxRecords() as SysUserApi.SysUserItem[])?. map((r) => r.id) ?? [];
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid :table-title="$t('system.sys-user.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="ml-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids) => batchDeleteSysUserApi(ids)"
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
          :action="$t('common.batchUpdateField', { field: $t('system.sys-user.fields.status') })"
          field-name="status"
          dict-code="sys_user_status"
          :api-fn="batchUpdateSysUserApi"
          :get-ids="getSelectedIds"
          :on-success="onRefresh"
        />
        <BatchActionDropdown
          v-if="canBatchUpdate"
          class="ml-2"
          type="dict"
          :action="$t('common.batchUpdateField', { field: $t('system.sys-user.fields.gender') })"
          field-name="gender"
          dict-code="sys_user_gender"
          :api-fn="batchUpdateSysUserApi"
          :get-ids="getSelectedIds"
          :on-success="onRefresh"
        />
        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('system.sys-user.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
