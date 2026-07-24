import type { Ref } from 'vue';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 字典类型列表搜索表单 Schema
 */
export function useGridFormSchema(groupsOptions: Ref<{ label: string; value: string }[]>): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('common.keyword'),
      componentProps: { allowClear: true, placeholder: $t('sys.dict.placeholder.keyword') },
    },
    {
      component: 'Select',
      fieldName: 'groups',
      label: $t('sys.dict.fields.groups'),
      componentProps: () => ({
        allowClear: true,
        placeholder: $t('sys.dict.placeholder.groups'),
        options: groupsOptions.value,
      }),
    },
    {
      component: 'DictSelect',
      fieldName: 'status',
      label: $t('common.status'),
      componentProps: {
        allowClear: true,
        code: 'is_enable',
      },
    },
  ];
}
