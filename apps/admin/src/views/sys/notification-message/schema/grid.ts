import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

import { useTrashedFormSchema } from '#/components/vxe-table/trashed';

/**
 * 通知记录列表搜索表单 Schema
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
      fieldName: 'channel',
      label: $t('sys.notification-message.fields.channel'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Select',
      fieldName: 'sendType',
      label: '发送类型',
      componentProps: {
        allowClear: true,
        options: [
          { label: '用户发送', value: 'user' },
          { label: '自由发送', value: 'free' },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'batchNo',
      label: $t('sys.notification-message.fields.batchNo'),
      componentProps: { allowClear: true, placeholder: '请输入原始编号，不含分隔符' },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('sys.notification-message.fields.status'),
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.success'), value: 1 },
          { label: $t('common.fail'), value: 2 },
          { label: $t('common.pending'), value: 3 },
          { label: $t('sys.notification-message.skipped'), value: 4 },
        ],
      },
    },
    useTrashedFormSchema(),
  ];
}
