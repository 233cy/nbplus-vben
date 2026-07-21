import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ConfigApi } from '#/api/sys/config';

import { deleteConfigApi, updateConfigApi } from '#/api/sys/config';
import { $t } from '#/locales';
import { useTableDelete } from '#/utils/table';
import { formatUnixTime } from '#/utils/time';

import { formatComponent } from '../data';
import { useConfigPermission } from '../permissions';

/**
 * 系统参数列表列定义
 */
export function useColumns(
  onDetailClick: (id: string) => Promise<void>,
  onEditClick: (id: string) => Promise<void>,
  onRefresh: () => void,
): VxeTableGridOptions['columns'] {
  const { canDetail, canUpdate, canDelete, canInlineUpdate } = useConfigPermission();

  async function handleToggle(row: ConfigApi.ConfigItem, field: keyof ConfigApi.ConfigItem, newVal: number) {
    await updateConfigApi({ id: row.id, [field]: newVal });
  }

  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'key',
      title: $t('sys.config.fields.key'),
      minWidth: 200,
      sortable: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: async (row: ConfigApi.ConfigItem) => onDetailClick(row.id),
        },
      },
    },
    {
      field: 'label',
      title: $t('sys.config.fields.label'),
      minWidth: 160,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellInlineEdit',
            attrs: {
              type: 'input',
              apiFn: (id: string, _field: string, value: any) => updateConfigApi({ id, label: value }),
            },
          }
        : undefined,
    },
    {
      field: 'groups',
      title: $t('sys.config.fields.groups'),
      minWidth: 120,
      sortable: true,
      formatter: ({ cellValue }: { cellValue: any }) => cellValue || '-',
    },
    {
      field: 'component',
      title: $t('sys.config.fields.component'),
      minWidth: 160,
      formatter: ({ cellValue }: { cellValue: any }) => formatComponent(cellValue),
    },
    {
      field: 'value',
      title: $t('sys.config.fields.value'),
      minWidth: 200,
      showOverflow: 'tooltip',
      formatter: ({ row }: { row: ConfigApi.ConfigItem }) => {
        if (row.isEncrypted === 1) return '******';
        return row.value || '-';
      },
    },
    {
      field: 'isPublic',
      title: $t('sys.config.fields.isPublic'),
      width: 100,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellSwitch',
            props: {
              checkedValue: 1,
              unCheckedValue: 2,
            },
            attrs: {
              beforeChange: (newVal: number, row: ConfigApi.ConfigItem) => handleToggle(row, 'isPublic', newVal),
            },
          }
        : { name: 'CellDict', props: { code: 'is_enable' } },
    },
    {
      field: 'isEncrypted',
      title: $t('sys.config.fields.isEncrypted'),
      width: 100,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellSwitch',
            props: {
              checkedValue: 1,
              unCheckedValue: 2,
            },
            attrs: {
              beforeChange: (newVal: number, row: ConfigApi.ConfigItem) => handleToggle(row, 'isEncrypted', newVal),
            },
          }
        : { name: 'CellDict', props: { code: 'is_enable' } },
    },
    {
      field: 'isSys',
      title: $t('sys.config.fields.isSys'),
      width: 120,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellSwitch',
            props: {
              checkedValue: 1,
              unCheckedValue: 2,
            },
            attrs: {
              beforeChange: (newVal: number, row: ConfigApi.ConfigItem) => handleToggle(row, 'isSys', newVal),
            },
          }
        : { name: 'CellDict', props: { code: 'is_enable' } },
    },
    {
      field: 'sort',
      title: $t('sys.config.fields.sort'),
      width: 100,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellInlineEdit',
            attrs: {
              type: 'number',
              apiFn: (id: string, _field: string, value: any) => updateConfigApi({ id, sort: value }),
            },
          }
        : undefined,
    },
    {
      field: 'createdAt',
      title: $t('sys.config.fields.createdAt'),
      width: 170,
      sortable: true,
      formatter: ({ cellValue }: { cellValue: any }) => formatUnixTime(cellValue),
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
              onClick: (row: ConfigApi.ConfigItem) => onEditClick(row.id),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: ConfigApi.ConfigItem) => useTableDelete(deleteConfigApi, row.id, row.key, onRefresh),
            },
          ],
        },
      },
    },
  ];
}
