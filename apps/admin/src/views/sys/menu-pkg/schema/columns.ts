import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MenuPkgApi } from '#/api/sys/menuPkg';

import { deleteMenuPkgApi, inlineUpdateMenuPkgApi } from '#/api/sys/menuPkg';
import { $t } from '#/locales';
import { useTableDelete } from '#/utils/table';
import { formatUnixTime } from '#/utils/time';

import { useMenuPkgPermission } from '../permissions';

/**
 * 权限包列表列定义
 */
export function useColumns(
  onEditClick: (id: string) => Promise<void>,
  onDetailClick: (id: string) => Promise<void>,
  onAssignMenus: (row: MenuPkgApi.MenuPkgItem) => void,
  onRefresh: () => void,
): VxeTableGridOptions['columns'] {
  const { canDetail, canUpdate, canDelete, canAssignMenus } = useMenuPkgPermission();

  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'code',
      title: $t('sys.menu-pkg.fields.code'),
      minWidth: 140,
      sortable: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: async (row: MenuPkgApi.MenuPkgItem) => onDetailClick(row.id),
        },
      },
    },
    {
      field: 'name',
      title: $t('sys.menu-pkg.fields.name'),
      minWidth: 160,
      sortable: true,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'input',
          disabled: !canUpdate,
          apiFn: (id: string, field: string, value: any) => inlineUpdateMenuPkgApi(id, field, value),
        },
      },
    },
    {
      field: 'status',
      title: $t('common.status'),
      width: 120,
      sortable: true,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'select',
          disabled: !canUpdate,
          dictCode: 'is_enable',
          apiFn: (id: string, field: string, value: any) => inlineUpdateMenuPkgApi(id, field, value),
        },
      },
    },
    {
      field: 'sort',
      title: $t('sys.menu-pkg.fields.sort'),
      width: 120,
      sortable: true,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'number',
          disabled: !canUpdate,
          apiFn: (id: string, field: string, value: any) => inlineUpdateMenuPkgApi(id, field, value),
        },
      },
    },
    {
      field: 'remark',
      title: $t('sys.menu-pkg.fields.remark'),
      minWidth: 180,
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
              onClick: (row: MenuPkgApi.MenuPkgItem) => onEditClick(row.id),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: MenuPkgApi.MenuPkgItem) => useTableDelete(deleteMenuPkgApi, row.id, row.name, onRefresh),
            },
            {
              key: 'assignMenus',
              label: $t('sys.menu-pkg.assignMenus'),
              icon: 'lucide:shield',
              hidden: !canAssignMenus,
              onClick: (row: MenuPkgApi.MenuPkgItem) => onAssignMenus(row),
            },
          ],
        },
      },
    },
  ];
}
