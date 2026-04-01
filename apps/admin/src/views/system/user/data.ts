import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserApi } from '#/api/system/user';

import dayjs from 'dayjs';

/** 新增/编辑表单 Schema */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: '登录账号',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'password',
      label: '登录密码',
      rules: 'required',
    },
    {
      component: 'Switch',
      fieldName: 'status',
      label: '帐号状态',
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: '真实姓名|昵称',
      rules: 'required',
    },
    {
      component: 'AvatarUpload',
      fieldName: 'avatar',
      label: '用户头像路径',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: '邮箱',
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: '手机号码',
    },
    {
      component: 'Switch',
      fieldName: 'totpSecret',
      label: 'TOTP 密钥',
    },
    {
      component: 'InputNumber',
      fieldName: 'gender',
      label: '性别',
    },
    {
      component: 'Input',
      fieldName: 'lastLoginIp',
      label: '最后登录IP',
    },
  ];
}

/** 列表搜索表单 Schema */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: '登录账号',
    },
    {
      component: 'Switch',
      fieldName: 'status',
      label: '帐号状态',
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: '真实姓名|昵称',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: '邮箱',
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: '手机号码',
    },
  ];
}

/** 列表列定义 */
export function useColumns(onActionClick: OnActionClickFn<UserApi.UserItem>): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'username',
      title: '登录账号',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '帐号状态',
      cellRender: { name: 'CellSwitch' },
      width: 80,
    },
    {
      field: 'nickname',
      title: '真实姓名|昵称',
      minWidth: 120,
    },
    {
      field: 'avatar',
      title: '用户头像路径',
      cellRender: { name: 'CellImages' },
      width: 80,
    },
    {
      field: 'email',
      title: '邮箱',
      minWidth: 120,
    },
    {
      field: 'phone',
      title: '手机号码',
      minWidth: 120,
    },
    {
      field: 'totpSecret',
      title: 'TOTP 密钥',
      cellRender: { name: 'CellTag' },
      width: 80,
    },
    {
      field: 'gender',
      title: '性别',
      minWidth: 120,
    },
    {
      field: 'deptId',
      title: '主属部门ID',
      minWidth: 120,
    },
    {
      field: 'positionId',
      title: '主身份职位ID',
      minWidth: 120,
    },
    {
      field: 'lastLoginIp',
      title: '最后登录IP',
      minWidth: 120,
    },
    {
      field: 'lastLoginTime',
      title: '最后登录时间',
      formatter: ({ cellValue }: { cellValue: number }) => (cellValue ? dayjs.unix(cellValue).format('YYYY-MM-DD HH:mm:ss') : '-'),
      width: 160,
    },
    {
      field: 'createdAt',
      title: '创建时间',
      formatter: ({ cellValue }: { cellValue: number }) => (cellValue ? dayjs.unix(cellValue).format('YYYY-MM-DD HH:mm:ss') : '-'),
      width: 160,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'id',
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 130,
    },
  ];
}
