<script setup lang="ts">
import type { ApprovalApi } from '#/api/sys/approval';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { approveTaskApi, getTodoListApi, rejectTaskApi } from '#/api/sys/approval';
import { $t } from '#/locales';
import SnapshotModal from '#/views/approval/components/snapshot-modal.vue';
import { useApprovalJump } from '#/views/approval/composables/useApprovalJump';

import RejectModal from './reject-modal.vue';
import { useTodoColumns } from '../schema/columns';

const [SnapshotModalComponent, snapshotModalApi] = useVbenModal({
  connectedComponent: SnapshotModal,
  destroyOnClose: true,
});

const [RejectModalComponent, rejectModalApi] = useVbenModal({
  connectedComponent: RejectModal,
  destroyOnClose: true,
});

const { jumpToDetail } = useApprovalJump((bizType, bizId) => {
  snapshotModalApi.setData({ bizType, bizId }).open();
});

let currentRejectTaskId = '';

function onTitleClick(row: ApprovalApi.TodoItem) {
  jumpToDetail(row.bizType, row.bizId);
}

async function onApprove(row: ApprovalApi.TodoItem) {
  await approveTaskApi(row.taskId);
  message.success($t('approval.todo.approveSuccess'));
  gridApi.query();
}

function onReject(row: ApprovalApi.TodoItem) {
  currentRejectTaskId = row.taskId;
  rejectModalApi.open();
}

async function onRejectConfirm(comment: string) {
  await rejectTaskApi(currentRejectTaskId, comment);
  message.success($t('approval.todo.rejectSuccess'));
  gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useTodoColumns(onTitleClick, onApprove, onReject),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getTodoListApi,
      } as any,
    },
    rowConfig: { keyField: 'taskId' },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});
</script>

<template>
  <div>
    <SnapshotModalComponent />
    <RejectModalComponent @confirm="onRejectConfirm" />
    <Grid :table-title="$t('approval.todo.tabs.todo')" />
  </div>
</template>
