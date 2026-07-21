<script setup lang="ts">
import { Page, useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { NotificationMessageApi } from '#/api/sys/notificationMessage';

import {
  getNotificationMessageDetailApi,
  getNotificationMessageListApi,
  resendNotificationMessageApi,
} from '#/api/sys/notificationMessage.js';
import { $t } from '#/locales';

import Detail from './components/detail.vue';
import { useNotificationMessage } from './composables/useNotificationMessage';
import { useNotificationMessagePermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

useNotificationMessagePermission();

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: Detail,
  destroyOnClose: true,
});

async function onDetailClick(id: string) {
  const res = await getNotificationMessageDetailApi(id);
  detailDrawerApi.setData(res).open();
}

async function onResend(row: NotificationMessageApi.MessageItem) {
  await resendNotificationMessageApi(row.id);
  message.success($t('sys.notification-message.resendSuccess'));
  msg.onRefresh();
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
    columns: useColumns(onDetailClick, onResend),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getNotificationMessageListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const msg = useNotificationMessage(gridApi);
</script>

<template>
  <Page auto-content-height>
    <DetailDrawer />
    <Grid :table-title="$t('sys.notification-message.pageTitle')" />
  </Page>
</template>
