<script setup lang="ts">
import type { ApprovalApi } from '#/api/sys/approval';

import { useVbenModal } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDoneListApi } from '#/api/sys/approval';
import { $t } from '#/locales';
import SnapshotModal from '#/views/approval/components/snapshot-modal.vue';
import { useApprovalJump } from '#/views/approval/composables/useApprovalJump';

import { useDoneColumns } from '../schema/columns';

const [SnapshotModalComponent, snapshotModalApi] = useVbenModal({
  connectedComponent: SnapshotModal,
  destroyOnClose: true,
});

const { jumpToDetail } = useApprovalJump((bizType, bizId) => {
  snapshotModalApi.setData({ bizType, bizId }).open();
});

function onTitleClick(row: ApprovalApi.DoneItem) {
  jumpToDetail(row.bizType, row.bizId);
}

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useDoneColumns(onTitleClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getDoneListApi,
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
    <Grid :table-title="$t('approval.todo.tabs.done')" />
  </div>
</template>
