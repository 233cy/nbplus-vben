import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NotificationMessageApi } from '#/api/sys/notificationMessage';

import { $t } from '#/locales';
import { formatCode } from '#/utils/format';
import { formatUnixTime } from '#/utils/time';

import { useNotificationMessagePermission } from '../permissions';

/**
 * 通知记录列表列定义
 */
export function useColumns(
  onDetailClick: (id: string) => Promise<void>,
  onResend: (row: NotificationMessageApi.MessageItem) => Promise<void>,
): VxeTableGridOptions['columns'] {
  const { canDetail, canResend } = useNotificationMessagePermission();

  return [
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'channel',
      title: $t('sys.notification-message.fields.channel'),
      width: 120,
      formatter: ({ row }: { row: NotificationMessageApi.MessageItem }) => row.channelName || row.channel,
    },
    {
      field: 'target',
      title: $t('sys.notification-message.fields.target'),
      minWidth: 180,
      formatter: ({ row }: { row: NotificationMessageApi.MessageItem }) => row.label || row.target || row.contact || '-',
    },
    {
      field: 'batchNo',
      title: $t('sys.notification-message.fields.batchNo'),
      minWidth: 180,
      formatter: ({ cellValue }: { cellValue: string }) => formatCode(cellValue),
    },
    {
      field: 'templateCode',
      title: $t('sys.notification-message.fields.templateCode'),
      minWidth: 140,
    },
    {
      field: 'subject',
      title: $t('sys.notification-message.fields.subject'),
      minWidth: 160,
      formatter: ({ row }: { row: NotificationMessageApi.MessageItem }) =>
        row.templateName || row.subject || '-',
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: async (row: NotificationMessageApi.MessageItem) => onDetailClick(row.id),
        },
      },
    },
    {
      field: 'response',
      title: $t('sys.notification-message.fields.response'),
      minWidth: 200,
      showOverflow: 'tooltip',
      formatter: ({ row }: { row: NotificationMessageApi.MessageItem }) => row.response || '-',
    },
    {
      field: 'status',
      title: $t('sys.notification-message.fields.status'),
      width: 100,
      formatter: ({ row }: { row: NotificationMessageApi.MessageItem }) => {
        const map: Record<number, string> = {
          1: $t('common.success'),
          2: $t('common.fail'),
          3: $t('common.pending'),
          4: $t('sys.notification-message.skipped'),
        };
        return map[row.status] ?? '-';
      },
    },
    {
      field: 'errorMsg',
      title: $t('sys.notification-message.fields.errorMsg'),
      minWidth: 180,
      formatter: ({ row }: { row: NotificationMessageApi.MessageItem }) => row.errorMsg || '-',
    },
    {
      field: 'isResend',
      title: $t('sys.notification-message.fields.isResend'),
      width: 100,
      formatter: ({ row }: { row: NotificationMessageApi.MessageItem }) => (row.isResend ? $t('common.yes') : $t('common.no')),
    },
    {
      field: 'createdAt',
      title: $t('common.createdAt'),
      width: 160,
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
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
              key: 'detail',
              label: $t('common.detail'),
              icon: 'lucide:eye',
              hidden: !canDetail,
              onClick: (row: NotificationMessageApi.MessageItem) => onDetailClick(row.id),
            },
            {
              key: 'resend',
              label: $t('sys.notification-message.resend'),
              icon: 'lucide:rotate-cw',
              // 回收站记录（已软删除）不允许重发
              hidden: (row: NotificationMessageApi.MessageItem) => !canResend || !!row.deletedAt,
              onClick: (row: NotificationMessageApi.MessageItem) => onResend(row),
            },
          ],
        },
      },
    },
  ];
}
