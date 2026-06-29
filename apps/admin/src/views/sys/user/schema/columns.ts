import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserApi } from '#/api/sys/user';

import { deleteUserApi, inlineUpdateUserApi } from '#/api/sys/user';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';
import { useTableDelete } from '#/utils/table';

/**
 * 用户列表列定义
 */
export function useColumns(
  onEditClick: (id: string) => Promise<void>,
  onDetailClick: (id: string) => Promise<void>,
  onOnlineClick: (row: UserApi.UserItem) => void,
  onRefresh: () => void,
): VxeTableGridOptions['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canDetail = hasAccessByCodes(['org:user:detail']);
  const canUpdate = hasAccessByCodes(['org:user:update']);
  const canDelete = hasAccessByCodes(['org:user:delete']);

  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'username',
      title: $t('system.user.fields.username'),
      minWidth: 120,
      sortable: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: async (row: UserApi.UserItem) => onDetailClick(row.id),
        },
      },
    },
    {
      field: 'status',
      title: $t('system.user.fields.status'),
      cellRender: {
        name: 'CellDict',
        props: { code: 'sys_user_status' },
      },
      width: 100,
      sortable: true,
    },
    {
      field: 'nickname',
      title: $t('system.user.fields.nickname'),
      minWidth: 120,
      sortable: true,
    },
    {
      field: 'avatar',
      title: $t('system.user.fields.avatar'),
      cellRender: { name: 'CellImages' },
      width: 80,
    },
    {
      field: 'email',
      title: $t('system.user.fields.email'),
      minWidth: 120,
      sortable: true,
    },
    {
      field: 'phone',
      title: $t('system.user.fields.phone'),
      minWidth: 120,
      sortable: true,
    },
    {
      field: 'totpSecret',
      title: $t('system.user.fields.totpSecret'),
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          dictCode: 'is_bind_totp',
          disabled: (row: any) => row.totpSecret === 2,
          apiFn: (id: string, field: string, value: any) => inlineUpdateUserApi(id, field, value),
        },
      },
      width: 100,
    },
    {
      field: 'gender',
      title: $t('system.user.fields.gender'),
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          dictCode: 'sys_user_gender',
          apiFn: (id: string, field: string, value: any) => inlineUpdateUserApi(id, field, value),
        },
      },
      width: 100,
      sortable: true,
    },
    {
      field: 'deptId',
      title: $t('system.user.fields.deptId'),
      minWidth: 120,
    },
    {
      field: 'positionId',
      title: $t('system.user.fields.positionId'),
      minWidth: 140,
      formatter: ({ row }: { row: UserApi.UserItem }) => row.positionName || '-',
    },
    {
      field: 'lastLoginIp',
      title: $t('system.user.fields.lastLoginIp'),
      minWidth: 120,
      sortable: true,
    },
    {
      field: 'lastLoginTime',
      title: $t('system.user.fields.lastLoginTime'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
      width: 160,
      sortable: true,
    },
    {
      field: 'onlineCount',
      title: $t('system.user.fields.onlineCount'),
      width: 90,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: hasAccessByCodes(['org:user:online']),
          onClick: (row: UserApi.UserItem) => onOnlineClick(row),
        },
      },
    },
    {
      field: 'createdAt',
      title: $t('common.createdAt'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
      width: 160,
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
              onClick: (row: UserApi.UserItem) => onEditClick(row.id),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: UserApi.UserItem) => useTableDelete(deleteUserApi, row.id, row.username, onRefresh),
            },
          ],
        },
      },
    },
  ];
}
