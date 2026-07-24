import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DictApi } from '#/api/sys/dict';

import { h } from 'vue';

import { deleteDictApi, updateDictApi } from '#/api/sys/dict';
import { $t } from '#/locales';
import { useTableDelete } from '#/utils/table';

import ItemExpand from '../components/item-expand.vue';
import { useDictPermission } from '../permissions';

/**
 * 字典类型列表列定义
 */
export function useColumns(
  onEditClick: (id: string) => Promise<void>,
  onDetailClick: (id: string) => Promise<void>,
  onRefresh: () => void,
): VxeTableGridOptions['columns'] {
  const { canDetail, canUpdate, canDelete, canInlineUpdate } = useDictPermission();

  return [
    { type: 'checkbox', width: 50 },
    {
      type: 'expand',
      width: 46,
      slots: {
        content: ({ row }: { row: DictApi.DictItem }) => {
          return h(ItemExpand, { dict: row });
        },
      },
    },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'name',
      title: $t('sys.dict.fields.name'),
      minWidth: 160,
      sortable: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: async (row: DictApi.DictItem) => onDetailClick(row.id),
        },
      },
    },
    {
      field: 'code',
      title: $t('sys.dict.fields.code'),
      minWidth: 160,
      sortable: true,
    },
    {
      field: 'groups',
      title: $t('sys.dict.fields.groups'),
      minWidth: 120,
      sortable: true,
      formatter: ({ cellValue }: { cellValue: any }) => cellValue || '-',
    },
    {
      field: 'status',
      title: $t('common.status'),
      width: 100,
      sortable: true,
      cellRender: {
        name: 'CellDict',
        props: { code: 'is_enable' },
      },
    },
    {
      field: 'sort',
      title: $t('sys.dict.fields.sort'),
      width: 100,
      sortable: true,
      cellRender: canInlineUpdate
        ? {
            name: 'CellInlineEdit',
            attrs: {
              type: 'number',
              apiFn: (id: string, _field: string, value: any) => updateDictApi({ id, sort: value }),
            },
          }
        : undefined,
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
              onClick: (row: DictApi.DictItem) => onEditClick(row.id),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: DictApi.DictItem) => useTableDelete(deleteDictApi, row.id, row.name, onRefresh),
            },
          ],
        },
      },
    },
  ];
}
