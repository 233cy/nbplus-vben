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
      fieldName: 'engine',
      label: $t('sys.storage.fields.engine'),
      componentProps: {
        options: [
          { label: $t('sys.storage.options.engine.local'), value: 'local' },
          { label: $t('sys.storage.options.engine.minio'), value: 'minio' },
          { label: $t('sys.storage.options.engine.aliyun'), value: 'aliyun' },
          { label: $t('sys.storage.options.engine.qiniu'), value: 'qiniu' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('common.status'),
      componentProps: {
        options: [
          { label: $t('sys.storage.options.status.1'), value: 1 },
          { label: $t('sys.storage.options.status.2'), value: 2 },
        ],
      },
    },
  ];
}
