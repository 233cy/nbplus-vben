import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserApi } from '#/api/system/user';

import { useAccess } from '#/composables/use-access';

import { deleteUserApi } from '#/api/system/user';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

/** 新增/编辑表单 Schema */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.fields.username'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'password',
      label: $t('system.user.fields.password'),
      rules: 'required',
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('system.user.fields.status'),
      rules: 'required',
      componentProps: {
        code: 'sys_user_status',
      },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('system.user.fields.nickname'),
      rules: 'required',
    },
    {
      component: 'AvatarUpload',
      fieldName: 'avatar',
      label: $t('system.user.fields.avatar'),
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('system.user.fields.email'),
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: $t('system.user.fields.phone'),
    },
    {
      component: 'DictSelect',
      fieldName: 'gender',
      label: $t('system.user.fields.gender'),
      componentProps: {
        code: 'sys_user_gender',
      },
    },
  ];
}

/** 列表搜索表单 Schema */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('common.keyword'),
      componentProps: { allowClear: true, placeholder: $t('common.keywordPlaceholder') },
    },
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.fields.username'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('system.user.fields.nickname'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('system.user.fields.email'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: $t('system.user.fields.phone'),
      componentProps: { allowClear: true },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('system.user.fields.status'),
      componentProps: {
        allowClear: true,
        code: 'sys_user_status',
      },
    },
    {
      component: 'DictSelect',
      fieldName: 'gender',
      label: $t('system.user.fields.gender'),
      componentProps: {
        allowClear: true,
        code: 'sys_user_gender',
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'lastLoginTime',
      label: $t('system.user.fields.lastLoginTime'),
      componentProps: { allowClear: true, valueFormat: 'YYYY-MM-DD HH:mm:ss', showTime: true },
    },
  ];
}

/** 列表列定义 */
export function useColumns(
  formDrawerApi: { open: () => void; setData: (data: any) => any },
  onRefresh: () => void,
  onOnlineClick?: (row: UserApi.UserItem) => void,
): VxeTableGridOptions['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canDetail = hasAccessByCodes(['system:user:detail']);
  const canUpdate = hasAccessByCodes(['system:user:update']);
  const canDelete = hasAccessByCodes(['system:user:delete']);
  return [
    { type: 'checkbox', width: 50 },
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'username',
      title: $t('system.user.fields.username'),
      minWidth: 120,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: (row: UserApi.UserItem) => formDrawerApi.setData({ ...row, readonly: true }).open(),
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
    },
    {
      field: 'nickname',
      title: $t('system.user.fields.nickname'),
      minWidth: 120,
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
    },
    {
      field: 'phone',
      title: $t('system.user.fields.phone'),
      minWidth: 120,
    },
    {
      field: 'totpSecret',
      title: $t('system.user.fields.totpSecret'),
      cellRender: {
        name: 'CellDict',
        props: { code: 'is_enable' },
      },
      width: 100,
    },
    {
      field: 'gender',
      title: $t('system.user.fields.gender'),
      cellRender: {
        name: 'CellDict',
        props: { code: 'sys_user_gender' },
      },
      width: 100,
    },
    {
      field: 'deptId',
      title: $t('system.user.fields.deptId'),
      minWidth: 120,
    },
    {
      field: 'positionId',
      title: $t('system.user.fields.positionId'),
      minWidth: 120,
    },
    {
      field: 'lastLoginIp',
      title: $t('system.user.fields.lastLoginIp'),
      minWidth: 120,
    },
    {
      field: 'lastLoginTime',
      title: $t('system.user.fields.lastLoginTime'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
      width: 160,
    },
    {
      field: 'onlineCount',
      title: '在线设备',
      width: 90,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: hasAccessByCodes(['system:user:online']),
          onClick: (row: UserApi.UserItem) => onOnlineClick?.(row),
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
      cellRender: {
        name: 'CellOperation',
        attrs: {
          onRefresh,
          actions: [
            {
              code: 'edit',
              text: $t('common.edit'),
              icon: 'lucide:pencil',
              access: canUpdate,
              onClick: (row: UserApi.UserItem) => formDrawerApi.setData(row).open(),
            },
            {
              code: 'delete',
              text: $t('common.delete'),
              icon: 'lucide:trash-2',
              actionType: 'delete',
              labelField: 'username',
              apiFn: deleteUserApi,
              access: canDelete,
            },
          ],
        },
      },
    },
  ];
}
