import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 角色列表搜索表单 Schema
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('common.keyword'),
      componentProps: {
        allowClear: true,
        placeholder: $t('common.keywordPlaceholder'),
      },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('sys.role.fields.status'),
      componentProps: {
        code: 'is_enable',
        allowClear: true,
      },
    },
  ];
}
