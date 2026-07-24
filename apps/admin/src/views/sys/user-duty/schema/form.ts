import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 职务新增/编辑表单 Schema
 */
export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('sys.user-duty.fields.name'),
      rules: 'required',
      componentProps: {
        placeholder: $t('sys.user-duty.placeholders.name'),
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'deptId',
      label: $t('sys.user-duty.fields.deptId'),
      rules: 'required',
      componentProps: {
        config: 'dept',
        multiple: false,
        placeholder: $t('sys.user-duty.placeholders.deptId'),
      },
    },
    {
      component: 'CodeInput',
      fieldName: 'code',
      label: $t('sys.user-duty.fields.code'),
      rules: 'required',
      disabled: isEdit,
      componentProps: (values: Record<string, any>) => ({
        placeholder: $t('sys.user-duty.placeholders.code'),
        name: values.name,
      }),
    },
    {
      component: 'InputNumber',
      fieldName: 'level',
      label: $t('sys.user-duty.fields.level'),
      componentProps: {
        placeholder: $t('sys.user-duty.placeholders.level'),
        min: 0,
      },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('sys.user-duty.fields.status'),
      rules: 'required',
      defaultValue: 1,
      componentProps: {
        code: 'is_enable',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('sys.user-duty.fields.sort'),
      componentProps: {
        placeholder: $t('sys.user-duty.placeholders.sort'),
        min: 0,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('sys.user-duty.fields.remark'),
      componentProps: {
        placeholder: $t('sys.user-duty.placeholders.remark'),
        rows: 3,
      },
    },
  ];
}
