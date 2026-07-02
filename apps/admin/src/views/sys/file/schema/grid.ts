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
      label: $t('sys.file.fields.accessType'),
      componentProps: {
        options: [
          { label: $t('sys.file.options.accessType.authorized'), value: 'authorized' },
          { label: $t('sys.file.options.accessType.public'), value: 'public' },
          { label: $t('sys.file.options.accessType.login'), value: 'login' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('sys.file.fields.status'),
      componentProps: {
        options: [
          { label: $t('sys.file.options.status.1'), value: 1 },
          { label: $t('sys.file.options.status.2'), value: 2 },
          { label: $t('sys.file.options.status.3'), value: 3 },
        ],
      },
    },
  ];
}
