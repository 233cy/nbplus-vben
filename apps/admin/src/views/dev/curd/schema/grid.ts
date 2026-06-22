import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * CURD 管理列表搜索表单 Schema
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('dev.curd.table.fields.title'),
      componentProps: {
        allowClear: true,
        placeholder: $t('dev.curd.table.placeholder.title'),
      },
    },
    {
      component: 'Input',
      fieldName: 'tableName',
      label: $t('dev.curd.table.fields.tableName'),
      componentProps: {
        allowClear: true,
        placeholder: $t('dev.curd.table.placeholder.tableName'),
      },
    },
  ];
}
