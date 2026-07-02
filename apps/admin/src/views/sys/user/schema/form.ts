import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 用户新增/编辑表单 Schema
 */
export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('sys.user.fields.username'),
      rules: 'required',
    },
    {
      component: 'PasswordInput',
      fieldName: 'password',
      label: $t('sys.user.fields.password'),
      rules: isEdit ? undefined : 'required',
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('sys.user.fields.status'),
      rules: 'required',
      componentProps: {
        code: 'sys_user_status',
      },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('sys.user.fields.nickname'),
      rules: 'required',
    },
    {
      component: 'AvatarUpload',
      fieldName: 'avatar',
      label: $t('sys.user.fields.avatar'),
      componentProps: { accessType: 'login' },
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('sys.user.fields.email'),
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: $t('sys.user.fields.phone'),
    },
    {
      component: 'DictSelect',
      fieldName: 'gender',
      label: $t('sys.user.fields.gender'),
      componentProps: {
        code: 'sys_user_gender',
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'positionId',
      label: $t('sys.user.fields.positionId'),
      componentProps: {
        config: 'post',
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'deptId',
      label: $t('sys.user.fields.deptId'),
      componentProps: {
        config: 'dept',
      },
    },
  ];
}
