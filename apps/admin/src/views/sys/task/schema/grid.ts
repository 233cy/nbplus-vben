import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 任务中心搜索表单 Schema
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('sys.task.keyword'),
      componentProps: {
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('sys.task.status'),
      componentProps: {
        allowClear: true,
        options: [1, 2, 3, 4, 5].map(value => ({
          label: $t(`sys.task.statusText.${value}`),
          value,
        })),
      },
    },
  ];
}
