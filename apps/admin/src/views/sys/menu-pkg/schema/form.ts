import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { Button } from 'ant-design-vue';

import { $t } from '#/locales';
import { stringToCode } from '#/utils/string-to-code';

/**
 * 权限包新增/编辑表单 Schema
 */
export function useFormSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.menuPkg.fields.name'),
      rules: 'required',
      componentProps: {
        placeholder: $t('system.menuPkg.placeholders.name'),
      },
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.menuPkg.fields.code'),
      rules: 'required',
      disabled: isEdit,
      componentProps: {
        placeholder: $t('system.menuPkg.placeholders.code'),
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
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('system.menuPkg.fields.status'),
      rules: 'required',
      defaultValue: 1,
      componentProps: {
        code: 'is_enable',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('system.menuPkg.fields.sort'),
      componentProps: {
        placeholder: $t('system.menuPkg.placeholders.sort'),
        min: 0,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('system.menuPkg.fields.remark'),
      componentProps: {
        placeholder: $t('system.menuPkg.placeholders.remark'),
        rows: 3,
      },
    },
  ];
}
