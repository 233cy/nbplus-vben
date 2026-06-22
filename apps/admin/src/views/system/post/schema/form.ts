import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 职务新增/编辑表单 Schema
 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.post.fields.code'),
      rules: 'required',
      componentProps: {
        placeholder: $t('system.post.placeholders.code'),
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.post.fields.name'),
      rules: 'required',
      componentProps: {
        placeholder: $t('system.post.placeholders.name'),
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'level',
      label: $t('system.post.fields.level'),
      componentProps: {
        placeholder: $t('system.post.placeholders.level'),
        min: 0,
      },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('system.post.fields.status'),
      rules: 'required',
      componentProps: {
        code: 'sys_post_status',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('system.post.fields.sort'),
      componentProps: {
        placeholder: $t('system.post.placeholders.sort'),
        min: 0,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('system.post.fields.remark'),
      componentProps: {
        placeholder: $t('system.post.placeholders.remark'),
        rows: 3,
      },
    },
  ];
}
