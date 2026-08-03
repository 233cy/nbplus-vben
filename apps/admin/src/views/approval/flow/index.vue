<script setup lang="ts">
import type { ApprovalFlowApi } from '#/api/sys/approvalFlow';

import { useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getApprovalFlowListApi, setApprovalFlowStatusApi } from '#/api/sys/approvalFlow';
import { $t } from '#/locales';

import DetailDrawer from './components/detail-drawer.vue';
import { useFlow } from './composables/useFlow';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const router = useRouter();

const [DetailDrawerComponent, detailDrawerApi] = useVbenDrawer({
  connectedComponent: DetailDrawer,
  destroyOnClose: true,
});

function onDetailClick(row: ApprovalFlowApi.FlowItem) {
  detailDrawerApi.setData({ id: row.id }).open();
}

/** 跳转流程设计器（仅路径字符串跳转，不直接引用设计器组件） */
function onDesignClick(row: ApprovalFlowApi.FlowItem) {
  router.push(`/approval/flow-designer?id=${row.id}`);
}

/** 启停切换：点击时状态已按当前行过滤，传相反状态 */
async function onStatusClick(row: ApprovalFlowApi.FlowItem) {
  const nextStatus = row.status === 1 ? 2 : 1;
  await setApprovalFlowStatusApi(row.id, nextStatus);
  message.success(nextStatus === 1 ? $t('approval.flow.enableSuccess') : $t('approval.flow.disableSuccess'));
  flow.onRefresh();
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
    columns: useColumns(onDetailClick, onDesignClick, onStatusClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getApprovalFlowListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const flow = useFlow(gridApi);
</script>

<template>
  <Page auto-content-height>
    <DetailDrawerComponent />
    <Grid :table-title="$t('approval.flow.pageTitle')" />
  </Page>
</template>
