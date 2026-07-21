<script setup lang="ts">
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchDeleteNotificationChannelApi,
  batchUpdateNotificationChannelApi,
  getNotificationChannelDetailApi,
  getNotificationChannelListApi,
} from '#/api/sys/notificationChannel.js';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { $t } from '#/locales';

import Form from './components/form.vue';
import { useNotificationChannel } from './composables/useNotificationChannel';
import { useNotificationChannelPermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { canCreate, canBatchDelete, canBatchUpdate } = useNotificationChannelPermission();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

async function onEditClick(id: string) {
  const res = await getNotificationChannelDetailApi(id);
  formDrawerApi.setData(res).open();
}

async function onDetailClick(id: string) {
  const res = await getNotificationChannelDetailApi(id);
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
    columns: useColumns(onEditClick, onDetailClick, () => channel.onRefresh()),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getNotificationChannelListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const channel = useNotificationChannel(gridApi);
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="channel.onRefresh" />
    <Grid :table-title="$t('sys.notification-channel.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="ml-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteNotificationChannelApi(ids)"
          :get-ids="channel.getSelectedIds"
          :on-success="channel.onRefresh"
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
          :api-fn="batchUpdateNotificationChannelApi"
          :get-ids="channel.getSelectedIds"
          :on-success="channel.onRefresh"
          :fields="[
            { fieldName: 'status', label: $t('sys.notification-channel.fields.status'), options: [{ label: $t('common.enabled'), value: 1 }, { label: $t('common.disabled'), value: 2 }] },
          ]"
        />

        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('sys.notification-channel.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
