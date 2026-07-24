import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NotificationChannelApi } from '#/api/sys/notificationChannel';

import { deleteNotificationChannelApi, updateNotificationChannelApi } from '#/api/sys/notificationChannel';
import { $t } from '#/locales';
import { useTableDelete } from '#/utils/table';
import { formatUnixTime } from '#/utils/time';

import { useNotificationChannelPermission } from '../permissions';

/**
 * 通知渠道列表列定义
 */
export function useColumns(
  onEditClick: (id: string) => Promise<void>,
  onDetailClick: (id: string) => Promise<void>,
  onRefresh: () => void,
): VxeTableGridOptions['columns'] {
  const { canDetail, canUpdate, canDelete, canInlineUpdate } = useNotificationChannelPermission();

  async function handleToggle(row: NotificationChannelApi.ChannelItem, field: 'status', newVal: number) {
    await updateNotificationChannelApi({ id: row.id, [field]: newVal });
  }

  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'code',
      title: $t('sys.notification-channel.fields.code'),
      minWidth: 120,
      sortable: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: async (row: NotificationChannelApi.ChannelItem) => onDetailClick(row.id),
        },
      },
    },
    {
      field: 'name',
      title: $t('sys.notification-channel.fields.name'),
      minWidth: 140,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellInlineEdit',
            attrs: {
              type: 'input',
              apiFn: (id: string, _field: string, value: any) => updateNotificationChannelApi({ id, name: value }),
            },
          }
        : undefined,
    },
    {
      field: 'driver',
      title: $t('sys.notification-channel.fields.driver'),
      minWidth: 200,
      formatter: ({ row }: { row: NotificationChannelApi.ChannelItem }) => row.driver || '-',
    },
    {
      field: 'status',
      title: $t('common.status'),
      width: 100,
      cellRender: canInlineUpdate
        ? {
            name: 'CellSwitch',
            attrs: {
              beforeChange: (newVal: number, row: NotificationChannelApi.ChannelItem) => handleToggle(row, 'status', newVal),
            },
          }
        : { name: 'CellDict', props: { code: 'is_enable' } },
    },
    {
      field: 'sort',
      title: $t('sys.notification-channel.fields.sort'),
      width: 100,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellInlineEdit',
            attrs: {
              type: 'number',
              apiFn: (id: string, _field: string, value: any) => updateNotificationChannelApi({ id, sort: value }),
              // 排序变更后刷新列表，按新排序重新排列
              afterSuccess: () => onRefresh(),
            },
          }
        : undefined,
    },
    {
      field: 'isDefault',
      title: $t('sys.notification-channel.fields.isDefault'),
      width: 120,
      cellRender: canInlineUpdate
        ? {
            name: 'CellInlineEdit',
            attrs: {
              dictCode: 'is_yes_no',
              apiFn: (id: string, _field: string, value: any) => updateNotificationChannelApi({ id, isDefault: value }),
              // 设为默认渠道时后端会重置同驱动其他渠道，需刷新列表
              afterSuccess: () => onRefresh(),
            },
          }
        : { name: 'CellDict', props: { code: 'is_yes_no' } },
    },
    {
      field: 'createdAt',
      title: $t('common.createdAt'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
      width: 160,
      sortable: true,
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
              key: 'edit',
              label: $t('common.edit'),
              icon: 'lucide:pencil',
              hidden: !canUpdate,
              onClick: (row: NotificationChannelApi.ChannelItem) => onEditClick(row.id),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: NotificationChannelApi.ChannelItem) => useTableDelete(deleteNotificationChannelApi, row.id, row.name, onRefresh),
            },
          ],
        },
      },
    },
  ];
}
