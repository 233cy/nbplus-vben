import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 用户列表搜索表单 Schema
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
      fieldName: 'username',
      label: $t('system.user.fields.username'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('system.user.fields.nickname'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('system.user.fields.email'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: $t('system.user.fields.phone'),
      componentProps: { allowClear: true },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('system.user.fields.status'),
      componentProps: {
        allowClear: true,
        code: 'sys_user_status',
      },
    },
    {
      component: 'DictSelect',
      fieldName: 'gender',
      label: $t('system.user.fields.gender'),
      componentProps: {
        allowClear: true,
        code: 'sys_user_gender',
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'lastLoginTime',
      label: $t('system.user.fields.lastLoginTime'),
      componentProps: { allowClear: true, showTime: true, valueFormat: 'X' },
    },
  ];
}
