import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TaskApi } from '#/api/sys/task';

import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

/**
 * 我的任务列表列定义（个人视角：无权限码，取消/重试仅按状态可见）.
 */
export function useColumns(
  onCancel: (row: TaskApi.TaskItem) => Promise<void>,
  onRetry: (row: TaskApi.TaskItem) => Promise<void>,
  onDelete: (row: TaskApi.TaskItem) => Promise<void>,
): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'type',
      title: $t('sys.task.type'),
      cellRender: { name: 'CellDict', props: { code: 'sys_task_type' } },
    },
    {
      field: 'name',
      title: $t('sys.task.name'),
      showOverflow: 'tooltip',
    },
    {
      field: 'status',
      title: $t('sys.task.status'),
      formatter: ({ row }: { row: TaskApi.TaskItem }) => {
        const text = $t(`sys.task.statusText.${row.status}`);
        if (row.status === 3 && row.failCount > 0) {
          return `${text}（${$t('sys.task.failSuffix', { count: row.failCount })}）`;
        }
        return text;
      },
    },
    {
      field: 'progress',
      title: $t('sys.task.progress'),
      align: 'center',
      formatter: ({ row }: { row: TaskApi.TaskItem }) => {
        if (row.totalCount === 0) {
          return row.status === 2 ? $t('common.loading') : '-';
        }
        const done = row.doneCount + row.failCount;
        const percent = Math.min(100, Math.round((done / row.totalCount) * 100));
        return `${done}/${row.totalCount}（${percent}%）`;
      },
    },
    {
      field: 'error',
      title: $t('sys.task.errorDetail'),
      showOverflow: 'tooltip',
      formatter: ({ row }: { row: TaskApi.TaskItem }) => {
        if (row.error) return row.error;
        const failures = row.result?.failures;
        if (failures?.length) {
          return failures.map(f => `${f.id}：${f.reason}`).join('；');
        }
        return '-';
      },
    },
    {
      field: 'duration',
      title: $t('sys.task.duration'),
      formatter: ({ row }: { row: TaskApi.TaskItem }) => {
        if (!row.startedAt) return '-';
        const end = row.finishedAt ?? Math.floor(Date.now() / 1000);
        return `${Math.max(0, end - row.startedAt)}s`;
      },
    },
    {
      field: 'createdAt',
      title: $t('sys.task.createdAt'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      title: $t('common.operation'),
      width: 150,
      showOverflow: false,
      cellRender: {
        name: 'TableActions',
        attrs: {
          actions: [
            {
              key: 'cancel',
              label: $t('sys.task.cancel'),
              icon: 'lucide:circle-x',
              danger: true,
              confirmTitle: $t('sys.task.cancelConfirm'),
              hidden: (row: TaskApi.TaskItem) => !(row.status === 1 || row.status === 2),
              onClick: (row: TaskApi.TaskItem) => onCancel(row),
            },
            {
              key: 'retry',
              label: $t('sys.task.retry'),
              icon: 'lucide:rotate-cw',
              confirmTitle: $t('sys.task.retryConfirm'),
              hidden: (row: TaskApi.TaskItem) => !(row.status === 4 || row.status === 5),
              onClick: (row: TaskApi.TaskItem) => onRetry(row),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('sys.task.deleteConfirm'),
              hidden: (row: TaskApi.TaskItem) => row.status === 1 || row.status === 2,
              onClick: (row: TaskApi.TaskItem) => onDelete(row),
            },
          ],
        },
      },
    },
  ];
}
