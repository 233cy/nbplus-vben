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
      label: $t('sys.user.fields.username'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('sys.user.fields.nickname'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('sys.user.fields.email'),
      componentProps: { allowClear: true },
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: $t('sys.user.fields.phone'),
      componentProps: { allowClear: true },
    },
    {
      component: 'DictRadio',
      fieldName: 'status',
      label: $t('sys.user.fields.status'),
      componentProps: {
        allowClear: true,
        code: 'sys_user_status',
      },
    },
    {
      component: 'DictSelect',
      fieldName: 'gender',
      label: $t('sys.user.fields.gender'),
      componentProps: {
        allowClear: true,
        code: 'sys_user_gender',
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'lastLoginTime',
      label: $t('sys.user.fields.lastLoginTime'),
      componentProps: { allowClear: true, showTime: true, valueFormat: 'X' },
    },
    {
      component: 'ApiSelect',
      fieldName: 'deptId',
      label: $t('sys.user.fields.deptId'),
      componentProps: {
        config: 'dept',
        showSearchButton: true,
        componentProps: { allowClear: true },
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'dutyId',
      label: $t('sys.user.fields.dutyId'),
      componentProps: {
        config: 'post',
        immediate: false,
        showSearchButton: true,
        componentProps: { allowClear: true },
      },
      dependencies: {
        triggerFields: ['deptId'],
        componentProps(values) {
          return {
            params: { deptId: values.deptId },
          };
        },
        trigger(values, actions) {
          if (values.dutyId !== undefined && values.dutyId !== null && values.dutyId !== '') {
            actions.setFieldValue('dutyId', undefined, false);
          }
        },
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'roleIds',
      label: $t('sys.user.fields.roleIds'),
      componentProps: {
        config: 'role',
        showSearchButton: true,
        componentProps: { allowClear: true, mode: 'multiple' },
      },
    },
  ];
}
