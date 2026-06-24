import type { VbenFormSchema } from '#/adapter/form';

import { getPostAllApi } from '#/api/org/post';
import { $t } from '#/locales';

/**
 * 用户新增/编辑表单 Schema
 */
export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.fields.username'),
      rules: 'required',
    },
    {
      component: 'PasswordInput',
      fieldName: 'password',
      label: $t('system.user.fields.password'),
      rules: isEdit ? undefined : 'required',
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
      componentProps: { isPrivate: 3 },
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
    {
      component: 'ApiSelect',
      fieldName: 'positionId',
      label: $t('system.user.fields.positionId'),
      componentProps: {
        api: getPostAllApi,
        labelField: 'name',
        valueField: 'id',
        allowClear: true,
        dropdownMatchSelectWidth: false,
      },
    },
  ];
}
