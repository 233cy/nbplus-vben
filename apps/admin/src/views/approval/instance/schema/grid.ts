import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 审批实例列表搜索表单 Schema
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('common.keyword'),
      componentProps: { allowClear: true, placeholder: $t('common.keywordPlaceholder') },
    },
    {
      component: 'Input',
      fieldName: 'bizType',
      label: $t('approval.instance.fields.bizType'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('common.status'),
      componentProps: {
        allowClear: true,
        options: [1, 2, 3, 4].map(value => ({
          label: $t(`approval.common.instanceStatus.${value}`),
          value,
        })),
      },
    },
  ];
}
