import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 角色新增/编辑表单 Schema
 */
export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('auth.role.fields.code'),
      rules: 'required',
      disabled: isEdit,
      componentProps: {
        placeholder: $t('auth.role.placeholders.code'),
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('auth.role.fields.name'),
      rules: 'required',
      componentProps: {
        placeholder: $t('auth.role.placeholders.name'),
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('auth.role.fields.sort'),
      defaultValue: 0,
      componentProps: {
        min: 0,
        placeholder: $t('auth.role.placeholders.sort'),
      },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('auth.role.fields.status'),
      rules: 'required',
      defaultValue: 1,
      componentProps: {
        code: 'is_enable',
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('auth.role.fields.remark'),
      componentProps: {
        rows: 3,
        placeholder: $t('auth.role.placeholders.remark'),
      },
    },
  ];
}
