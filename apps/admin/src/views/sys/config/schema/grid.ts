import type { Ref } from 'vue';

import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 系统参数列表搜索表单 Schema
 */
export function useGridFormSchema(groupsOptions: Ref<{ label: string; value: string }[]>): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('common.keyword'),
      componentProps: {
        allowClear: true,
        placeholder: $t('sys.config.placeholder.keyword'),
      },
    },
    {
      component: 'Select',
      fieldName: 'groups',
      label: $t('sys.config.fields.groups'),
      componentProps: () => ({
        allowClear: true,
        placeholder: $t('sys.config.placeholder.groups'),
        options: groupsOptions.value,
      }),
    },
    {
      component: 'DictSelect',
      fieldName: 'isPublic',
      label: $t('sys.config.fields.isPublic'),
      componentProps: {
        allowClear: true,
        code: 'is_enable',
      },
    },
  ];
}
