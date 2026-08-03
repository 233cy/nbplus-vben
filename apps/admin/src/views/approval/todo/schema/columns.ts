import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ApprovalApi } from '#/api/sys/approval';

import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

/**
 * 待审列表列定义（个人视角：无权限码，操作仅按数据可见）
 */
export function useTodoColumns(
  onTitleClick: (row: ApprovalApi.TodoItem) => void,
  onApprove: (row: ApprovalApi.TodoItem) => void,
  onReject: (row: ApprovalApi.TodoItem) => void,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'title',
      title: $t('approval.todo.fields.title'),
      minWidth: 200,
      cellRender: {
        name: 'CellLink',
        attrs: {
          onClick: (row: ApprovalApi.TodoItem) => onTitleClick(row),
        },
      },
    },
    {
      field: 'applicantName',
      title: $t('approval.todo.fields.applicantName'),
      minWidth: 120,
      formatter: ({ row }: { row: ApprovalApi.TodoItem }) => row.applicantName || '-',
    },
    {
      field: 'nodeName',
      title: $t('approval.todo.fields.nodeName'),
      minWidth: 120,
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
              key: 'approve',
              label: $t('approval.todo.approve'),
              icon: 'lucide:check',
              confirmTitle: $t('approval.todo.approveConfirm'),
              onClick: (row: ApprovalApi.TodoItem) => onApprove(row),
            },
            {
              key: 'reject',
              label: $t('approval.todo.reject'),
              icon: 'lucide:x',
              danger: true,
              onClick: (row: ApprovalApi.TodoItem) => onReject(row),
            },
          ],
        },
      },
    },
  ];
}

/**
 * 已办列表列定义
 */
export function useDoneColumns(
  onTitleClick: (row: ApprovalApi.DoneItem) => void,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'title',
      title: $t('approval.todo.fields.title'),
      minWidth: 200,
      cellRender: {
        name: 'CellLink',
        attrs: {
          onClick: (row: ApprovalApi.DoneItem) => onTitleClick(row),
        },
      },
    },
    {
      field: 'applicantName',
      title: $t('approval.todo.fields.applicantName'),
      minWidth: 120,
      formatter: ({ row }: { row: ApprovalApi.DoneItem }) => row.applicantName || '-',
    },
    {
      field: 'nodeName',
      title: $t('approval.todo.fields.nodeName'),
      minWidth: 120,
    },
    {
      field: 'status',
      title: $t('approval.todo.fields.myAction'),
      width: 110,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: $t('approval.common.taskStatus.2'), value: 2 },
          { color: 'red', label: $t('approval.common.taskStatus.3'), value: 3 },
        ],
      },
    },
    {
      field: 'comment',
      title: $t('approval.common.comment'),
      minWidth: 160,
      showOverflow: 'tooltip',
      formatter: ({ row }: { row: ApprovalApi.DoneItem }) => row.comment || '-',
    },
    {
      field: 'finishedAt',
      title: $t('approval.todo.fields.finishedAt'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
      width: 160,
    },
  ];
}
