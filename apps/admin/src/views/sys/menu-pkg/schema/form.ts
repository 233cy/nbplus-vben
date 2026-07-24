import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 权限包新增/编辑表单 Schema
 */
export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('sys.menu-pkg.fields.name'),
      rules: 'required',
      componentProps: {
        placeholder: $t('sys.menu-pkg.placeholders.name'),
      },
    },
    {
      component: 'CodeInput',
      fieldName: 'code',
      label: $t('sys.menu-pkg.fields.code'),
      rules: 'required',
      disabled: isEdit,
      componentProps: (values: Record<string, any>) => ({
        placeholder: $t('sys.menu-pkg.placeholders.code'),
        name: values.name,
      }),
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('common.status'),
      rules: 'required',
      defaultValue: 1,
      componentProps: {
        code: 'is_enable',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('sys.menu-pkg.fields.sort'),
      componentProps: {
        placeholder: $t('sys.menu-pkg.placeholders.sort'),
        min: 0,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('sys.menu-pkg.fields.remark'),
      componentProps: {
        placeholder: $t('sys.menu-pkg.placeholders.remark'),
        rows: 3,
      },
    },
  ];
}
