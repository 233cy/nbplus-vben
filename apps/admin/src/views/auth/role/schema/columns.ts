import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RoleApi } from '#/api/admin/sys/role';

import { deleteRoleApi, inlineUpdateRoleApi } from '#/api/admin/sys/role';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';
import { useTableDelete } from '#/utils/table';
import { h } from 'vue';

const dataScopeMap: Record<number, string> = {
  1: 'auth.role.dataScope.all',
  2: 'auth.role.dataScope.dept',
  3: 'auth.role.dataScope.deptAndBelow',
  4: 'auth.role.dataScope.self',
  5: 'auth.role.dataScope.custom',
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
  const { hasAccessByCodes } = useAccess();
  const canDetail = hasAccessByCodes(['auth:role:detail']);
  const canUpdate = hasAccessByCodes(['auth:role:update']);
  const canDelete = hasAccessByCodes(['auth:role:delete']);
  const canAssignMenus = hasAccessByCodes(['auth:role:assignMenus']);
  const canAssignDataScope = hasAccessByCodes(['auth:role:assignDataScope']);

  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'code',
      title: $t('auth.role.fields.code'),
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
      title: $t('auth.role.fields.name'),
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
      title: $t('auth.role.fields.dataScope'),
      minWidth: 160,
      slots: {
        default: ({ row }: any) => h('span', $t(dataScopeMap[row.dataScope] || 'auth.role.dataScope.all')),
      },
    },
    {
      field: 'status',
      title: $t('auth.role.fields.status'),
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
      title: $t('auth.role.fields.sort'),
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
      title: $t('auth.role.fields.remark'),
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
      width: 180,
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
              label: $t('auth.role.assignMenus'),
              icon: 'lucide:shield',
              hidden: !canAssignMenus,
              onClick: (row: RoleApi.RoleItem) => onAssignMenus(row),
            },
            {
              key: 'assignDataScope',
              label: $t('auth.role.assignDataScope'),
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
