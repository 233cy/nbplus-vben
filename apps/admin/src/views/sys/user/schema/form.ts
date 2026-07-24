import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';
import { isPasswordValid, passwordPolicyDescription } from '#/utils/password-policy';

/**
 * 用户新增/编辑表单 Schema
 */
export function useFormSchema(isEdit = false, isReadonly = false): VbenFormSchema[] {
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
      rules: isEdit
        ? z
            .string()
            .optional()
            .refine(value => !value || isPasswordValid(value), { message: passwordPolicyDescription() })
        : z
            .string()
            .min(1, { message: $t('sys.user.rules.passwordRequired') })
            .refine(isPasswordValid, { message: passwordPolicyDescription() }),
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
      fieldName: 'roleIds',
      label: $t('sys.user.fields.roleIds'),
      componentProps: {
        config: 'role',
        mode: 'multiple',
        valueField: 'id',
        labelField: 'name',
        placeholder: $t('sys.user.fields.roleIds'),
      },
    },
    {
      component: 'UserOrgEditor',
      fieldName: 'userOrg',
      hideLabel: true,
      formItemClass: 'col-span-full',
      componentProps: {
        isReadonly,
      },
    },
  ];
}
