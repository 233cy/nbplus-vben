<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ApprovalApi } from '#/api/sys/approval';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { cancelApprovalApi, getMineListApi } from '#/api/sys/approval';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';
import { useApprovalJump } from '#/views/approval/composables/useApprovalJump';

/** 实例状态对应的 Tag 颜色 */
const statusColorMap: Record<number, string> = {
  1: 'processing',
  2: 'success',
  3: 'error',
  4: 'default',
};

// 演示模块自身已注册 demo_leave 详情路由，标题/查看直接跳详情页
const { jumpToDetail } = useApprovalJump(() => {});

async function onCancel(row: ApprovalApi.MineItem) {
  await cancelApprovalApi('demo_leave', row.bizId);
  message.success($t('demos.approval.cancelSuccess'));
  gridApi.query();
}

const columns: VxeTableGridOptions['columns'] = [
  {
    field: 'title',
    title: $t('approval.todo.fields.title'),
    minWidth: 220,
    cellRender: {
      name: 'CellLink',
      attrs: {
        onClick: (row: ApprovalApi.MineItem) => jumpToDetail(row.bizType, row.bizId),
      },
    },
  },
  {
    field: 'bizId',
    title: $t('approval.instance.fields.bizId'),
    minWidth: 160,
  },
  {
    field: 'status',
    title: $t('common.status'),
    width: 100,
    cellRender: {
      name: 'CellTag',
      options: [1, 2, 3, 4].map(value => ({
        color: statusColorMap[value],
        label: $t(`approval.common.instanceStatus.${value}`),
        value,
      })),
    },
  },
  {
    field: 'createdAt',
    title: $t('approval.todo.fields.createdAt'),
    formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
    width: 160,
  },
  {
    align: 'center',
    field: 'operation',
    fixed: 'right',
    title: $t('common.operation'),
    width: 160,
    showOverflow: false,
    cellRender: {
      name: 'TableActions',
      attrs: {
        actions: [
          {
            key: 'view',
            label: $t('demos.approval.view'),
            icon: 'lucide:eye',
            onClick: (row: ApprovalApi.MineItem) => jumpToDetail(row.bizType, row.bizId),
          },
          {
            key: 'cancel',
            label: $t('demos.approval.cancel'),
            icon: 'lucide:undo-2',
            danger: true,
            confirmTitle: $t('demos.approval.cancelConfirm'),
            // 仅审批中可撤销
            hidden: (row: ApprovalApi.MineItem) => row.status !== 1,
            onClick: (row: ApprovalApi.MineItem) => onCancel(row),
          },
        ],
      },
    },
  },
];

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns,
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        // 固定过滤本演示的 bizType
        queryApi: (params: any) => getMineListApi({ ...params, bizType: 'demo_leave' }),
      } as any,
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

defineExpose({
  refresh: () => gridApi.query(),
});
</script>

<template>
  <Grid :table-title="$t('demos.approval.tabs.mine')" />
</template>
