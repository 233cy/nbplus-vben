import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { deleteNotificationTemplateApi, updateNotificationTemplateApi } from '#/api/sys/notificationTemplate';
import { $t } from '#/locales';
import { useTableDelete } from '#/utils/table';
import { formatUnixTime } from '#/utils/time';

import { useNotificationTemplatePermission } from '../permissions';

/**
 * 通知模板列表列定义
 */
export function useColumns(
  onEditClick: (id: string) => Promise<void>,
  onDetailClick: (id: string) => Promise<void>,
  onTestSendClick: (row: NotificationTemplateApi.Template) => void,
  onRefresh: () => void,
): VxeTableGridOptions['columns'] {
  const { canDetail, canUpdate, canDelete, canInlineUpdate, canTestSend } = useNotificationTemplatePermission();

  async function handleToggle(row: NotificationTemplateApi.Template, field: 'status', newVal: number) {
    await updateNotificationTemplateApi({ id: row.id, [field]: newVal });
  }

  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'code',
      title: $t('sys.notification-template.fields.code'),
      minWidth: 120,
      sortable: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: async (row: NotificationTemplateApi.Template) => onDetailClick(row.id),
        },
      },
    },
    {
      field: 'name',
      title: $t('sys.notification-template.fields.name'),
      minWidth: 140,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellInlineEdit',
            attrs: {
              type: 'input',
              apiFn: (id: string, _field: string, value: any) => updateNotificationTemplateApi({ id, name: value }),
            },
          }
        : undefined,
    },
    {
      field: 'bizType',
      title: $t('sys.notification-template.fields.bizType'),
      minWidth: 120,
      formatter: ({ row }: { row: NotificationTemplateApi.Template }) => row.bizType || '-',
      cellRender: canInlineUpdate
        ? {
            name: 'CellInlineEdit',
            attrs: {
              type: 'input',
              apiFn: (id: string, _field: string, value: any) => updateNotificationTemplateApi({ id, bizType: value }),
            },
          }
        : undefined,
    },
    {
      field: 'status',
      title: $t('common.status'),
      width: 100,
      cellRender: canInlineUpdate
        ? {
            name: 'CellSwitch',
            attrs: {
              beforeChange: (newVal: number, row: NotificationTemplateApi.Template) => handleToggle(row, 'status', newVal),
            },
          }
        : { name: 'CellDict', props: { code: 'is_enable' } },
    },
    {
      field: 'sort',
      title: $t('sys.notification-template.fields.sort'),
      width: 100,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellInlineEdit',
            attrs: {
              type: 'number',
              apiFn: (id: string, _field: string, value: any) => updateNotificationTemplateApi({ id, sort: value }),
              // 排序变更后刷新列表，按新排序重新排列
              afterSuccess: () => onRefresh(),
            },
          }
        : undefined,
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
      width: 200,
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
              onClick: (row: NotificationTemplateApi.Template) => onEditClick(row.id),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: NotificationTemplateApi.Template) => useTableDelete(deleteNotificationTemplateApi, row.id, row.name, onRefresh),
            },
            {
              key: 'test-send',
              label: $t('sys.notification-template.testSend'),
              icon: 'lucide:send',
              hidden: !canTestSend,
              onClick: (row: NotificationTemplateApi.Template) => onTestSendClick(row),
            },
          ],
        },
      },
    },
  ];
}
