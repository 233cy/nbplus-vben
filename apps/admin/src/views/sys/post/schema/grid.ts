import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 职务列表搜索表单 Schema
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
      component: 'Input',
      fieldName: 'code',
      label: $t('sys.post.fields.code'),
      componentProps: {
        allowClear: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('sys.post.fields.name'),
      componentProps: {
        allowClear: true,
      },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('sys.post.fields.status'),
      componentProps: {
        allowClear: true,
        code: 'sys_post_status',
      },
    },
  ];
}
