import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 菜单列表搜索表单 Schema
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('common.keyword'),
      componentProps: {
        allowClear: true,
        placeholder: $t('sys.menu.searchPlaceholder'),
      },
    },
  ];
}
