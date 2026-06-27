import type { VbenFormSchema } from '@vben/common-ui';

import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('common.keyword'),
    },
    {
      component: 'Select',
      fieldName: 'accessType',
      label: $t('system.file.fields.accessType'),
      componentProps: {
        options: [
          { label: $t('system.file.options.accessType.authorized'), value: 'authorized' },
          { label: $t('system.file.options.accessType.public'), value: 'public' },
          { label: $t('system.file.options.accessType.login'), value: 'login' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('system.file.fields.status'),
      componentProps: {
        options: [
          { label: $t('system.file.options.status.1'), value: 1 },
          { label: $t('system.file.options.status.2'), value: 2 },
          { label: $t('system.file.options.status.3'), value: 3 },
        ],
      },
    },
  ];
}
