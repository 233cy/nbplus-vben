import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RoleApi } from '#/api/sys/role';

import { h } from 'vue';

import { deleteRoleApi, inlineUpdateRoleApi } from '#/api/sys/role';
import { $t } from '#/locales';
import { useTableDelete } from '#/utils/table';
import { formatUnixTime } from '#/utils/time';

import { useRolePermission } from '../permissions';

const dataScopeMap: Record<number, string> = {
  1: 'sys.role.dataScope.all',
  2: 'sys.role.dataScope.dept',
  3: 'sys.role.dataScope.deptAndBelow',
  4: 'sys.role.dataScope.self',
  5: 'sys.role.dataScope.custom',
};

/**
 * 角色列表列定义
 */
export function useColumns(
  onEditClick: (id: string) => Promise<void>,
  onDetailClick: (id: string) => Promise<void>,
  onAssignMenus: (row: RoleApi.RoleItem) => void,
  onAssignDataScope: (row: RoleApi.RoleItem) => void,
  onRefresh: () => void,
): VxeTableGridOptions['columns'] {
  const { canDetail, canUpdate, canDelete, canAssignMenus, canAssignDataScope } = useRolePermission();

  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'code',
      title: $t('sys.role.fields.code'),
      minWidth: 140,
      sortable: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: async (row: RoleApi.RoleItem) => onDetailClick(row.id),
        },
      },
    },
    {
      field: 'name',
      title: $t('sys.role.fields.name'),
      minWidth: 160,
      sortable: true,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'input',
          disabled: !canUpdate,
          apiFn: (id: string, field: string, value: any) => inlineUpdateRoleApi(id, field, value),
        },
      },
    },
    {
      field: 'dataScope',
      title: $t('sys.role.fields.dataScope'),
      minWidth: 160,
      slots: {
        default: ({ row }: any) => h('span', $t(dataScopeMap[row.dataScope] || 'sys.role.dataScope.all')),
      },
    },
    {
      field: 'status',
      title: $t('sys.role.fields.status'),
      width: 100,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'select',
          dictCode: 'is_enable',
          disabled: !canUpdate,
          apiFn: (id: string, field: string, value: any) => inlineUpdateRoleApi(id, field, value),
        },
      },
    },
    {
      field: 'sort',
      title: $t('sys.role.fields.sort'),
      width: 100,
      sortable: true,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'number',
          disabled: !canUpdate,
          apiFn: (id: string, field: string, value: any) => inlineUpdateRoleApi(id, field, value),
        },
      },
    },
    {
      field: 'remark',
      title: $t('sys.role.fields.remark'),
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
              onClick: (row: RoleApi.RoleItem) => onEditClick(row.id),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: RoleApi.RoleItem) => useTableDelete(deleteRoleApi, row.id, row.name, onRefresh),
            },
            {
              key: 'assignMenus',
              label: $t('sys.role.assignMenus'),
              icon: 'lucide:shield',
              hidden: !canAssignMenus,
              onClick: (row: RoleApi.RoleItem) => onAssignMenus(row),
            },
            {
              key: 'assignDataScope',
              label: $t('sys.role.assignDataScope'),
              icon: 'lucide:database',
              hidden: !canAssignDataScope,
              onClick: (row: RoleApi.RoleItem) => onAssignDataScope(row),
            },
          ],
        },
      },
    },
  ];
}
