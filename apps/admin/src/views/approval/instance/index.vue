<script setup lang="ts">
import type { ApprovalInstanceApi } from '#/api/sys/approvalInstance';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getApprovalInstanceListApi } from '#/api/sys/approvalInstance';
import { $t } from '#/locales';

import DetailDrawer from './components/detail-drawer.vue';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const [DetailDrawerComponent, detailDrawerApi] = useVbenDrawer({
  connectedComponent: DetailDrawer,
  destroyOnClose: true,
});

function onDetailClick(row: ApprovalInstanceApi.InstanceItem) {
  detailDrawerApi.setData({ id: row.id }).open();
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
    showCollapseButton: true,
    submitOnChange: false,
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(onDetailClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getApprovalInstanceListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});
</script>

<template>
  <Page auto-content-height>
    <DetailDrawerComponent />
    <Grid :table-title="$t('approval.instance.pageTitle')" />
  </Page>
</template>
