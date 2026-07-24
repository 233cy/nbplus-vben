import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 角色新增/编辑表单 Schema
 */
export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('sys.role.fields.name'),
      rules: 'required',
      componentProps: {
        placeholder: $t('sys.role.placeholders.name'),
      },
    },
    {
      component: 'CodeInput',
      fieldName: 'code',
      label: $t('sys.role.fields.code'),
      rules: 'required',
      disabled: isEdit,
      componentProps: (values: Record<string, any>) => ({
        placeholder: $t('sys.role.placeholders.code'),
        name: values.name,
      }),
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('sys.role.fields.sort'),
      defaultValue: 0,
      componentProps: {
        min: 0,
        placeholder: $t('sys.role.placeholders.sort'),
      },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('sys.role.fields.status'),
      rules: 'required',
      defaultValue: 1,
      componentProps: {
        code: 'is_enable',
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('sys.role.fields.remark'),
      componentProps: {
        rows: 3,
        placeholder: $t('sys.role.placeholders.remark'),
      },
    },
  ];
}
