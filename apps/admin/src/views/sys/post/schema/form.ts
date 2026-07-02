import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { Button } from 'ant-design-vue';

import { $t } from '#/locales';
import { stringToCode } from '#/utils/string-to-code';

/**
 * 职务新增/编辑表单 Schema
 */
export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('sys.post.fields.name'),
      rules: 'required',
      componentProps: {
        placeholder: $t('sys.post.placeholders.name'),
      },
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('sys.post.fields.code'),
      rules: 'required',
      disabled: isEdit,
      componentProps: {
        placeholder: $t('sys.post.placeholders.code'),
      },
      renderComponentContent: isEdit
        ? undefined
        : (values, actions) => ({
            addonAfter: () =>
              h(
                Button,
                {
                  type: 'link',
                  size: 'small',
                  onClick: () => {
                    const name = values.name as string;
                    if (name?.trim()) {
                      actions.setFieldValue('code', stringToCode(name.trim()));
                    }
                  },
                },
                { default: () => '生成编码' },
              ),
          }),
    },
    {
      component: 'InputNumber',
      fieldName: 'level',
      label: $t('sys.post.fields.level'),
      componentProps: {
        placeholder: $t('sys.post.placeholders.level'),
        min: 0,
      },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('sys.post.fields.status'),
      rules: 'required',
      defaultValue: 1,
      componentProps: {
        code: 'is_enable',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('sys.post.fields.sort'),
      componentProps: {
        placeholder: $t('sys.post.placeholders.sort'),
        min: 0,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('sys.post.fields.remark'),
      componentProps: {
        placeholder: $t('sys.post.placeholders.remark'),
        rows: 3,
      },
    },
  ];
}
