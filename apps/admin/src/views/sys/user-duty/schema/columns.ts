import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PostApi } from '#/api/sys/userDuty';

import { deletePostApi, inlineUpdatePostApi } from '#/api/sys/userDuty';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';
import { useTableDelete } from '#/utils/table';
import { formatUnixTime } from '#/utils/time';

/**
 * 职务列表列定义
 */
export function useColumns(onEditClick: (id: string) => Promise<void>, onDetailClick: (id: string) => Promise<void>, onRefresh: () => void): VxeTableGridOptions['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canDetail = hasAccessByCodes(['org:post:detail']);
  const canUpdate = hasAccessByCodes(['org:post:update']);
  const canDelete = hasAccessByCodes(['org:post:delete']);

  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'code',
      title: $t('sys.user-duty.fields.code'),
      minWidth: 120,
      sortable: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: async (row: PostApi.PostItem) => onDetailClick(row.id),
        },
      },
    },
    {
      field: 'name',
      title: $t('sys.user-duty.fields.name'),
      minWidth: 160,
      sortable: true,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'input',
          disabled: !canUpdate,
          apiFn: (id: string, field: string, value: any) => inlineUpdatePostApi(id, field, value),
        },
      },
    },
    {
      field: 'deptFullName',
      title: $t('sys.user-duty.fields.deptId'),
      minWidth: 240,
      showOverflow: 'tooltip',
    },
    {
      field: 'level',
      title: $t('sys.user-duty.fields.level'),
      width: 130,
      sortable: true,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'number',
          disabled: !canUpdate,
          apiFn: (id: string, field: string, value: any) => inlineUpdatePostApi(id, field, value),
        },
      },
    },
    {
      field: 'status',
      title: $t('sys.user-duty.fields.status'),
      width: 120,
      sortable: true,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'select',
          disabled: !canUpdate,
          dictCode: 'is_enable',
          apiFn: (id: string, field: string, value: any) => inlineUpdatePostApi(id, field, value),
        },
      },
    },
    {
      field: 'sort',
      title: $t('sys.user-duty.fields.sort'),
      width: 130,
      sortable: true,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'number',
          disabled: !canUpdate,
          apiFn: (id: string, field: string, value: any) => inlineUpdatePostApi(id, field, value),
        },
      },
    },
    {
      field: 'remark',
      title: $t('sys.user-duty.fields.remark'),
      minWidth: 160,
      showOverflow: 'tooltip',
    },
    {
      field: 'createdAt',
      title: $t('common.createdAt'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
      width: 160,
      sortable: true,
    },
    {
      field: 'updatedAt',
      title: $t('common.updatedAt'),
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
              onClick: (row: PostApi.PostItem) => onEditClick(row.id),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: PostApi.PostItem) => useTableDelete(deletePostApi, row.id, row.name, onRefresh),
            },
          ],
        },
      },
    },
  ];
}
