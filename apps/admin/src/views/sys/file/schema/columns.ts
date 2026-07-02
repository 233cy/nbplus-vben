import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FileApi } from '#/api/sys/file';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

export function useColumns(
  onPreview: (record: FileApi.FileItem) => void,
  onMove: (record: FileApi.FileItem) => void,
  onDelete: (record: FileApi.FileItem) => void,
): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 50 },
    {
      field: 'originalName',
      title: $t('sys.file.fields.originalName'),
      minWidth: 200,
    },
    {
      field: 'extension',
      title: $t('sys.file.fields.extension'),
      width: 100,
    },
    {
      field: 'sizeByte',
      title: $t('sys.file.fields.sizeByte'),
      width: 120,
      formatter: ({ cellValue }: any) => {
        const size = Number(cellValue);
        if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
        if (size > 1024) return `${(size / 1024).toFixed(2)} KB`;
        return `${size} B`;
      },
    },
    {
      field: 'accessType',
      title: $t('sys.file.fields.accessType'),
      width: 120,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.accessType === 'public' ? 'green' : row.accessType === 'login' ? 'blue' : 'orange' }, () => $t(`sys.file.options.accessType.${row.accessType}`)),
      },
    },
    {
      field: 'storageCode',
      title: $t('sys.file.fields.storageCode'),
      width: 140,
    },
    {
      field: 'refCount',
      title: $t('sys.file.fields.refCount'),
      width: 100,
    },
    {
      field: 'status',
      title: $t('sys.file.fields.status'),
      width: 100,
      slots: {
        default: ({ row }: any) => $t(`sys.file.options.status.${row.status}`),
      },
    },
    {
      field: 'createdAt',
      title: $t('sys.file.fields.createdAt'),
      width: 180,
      formatter: ({ cellValue }: any) => (cellValue ? formatUnixTime(cellValue) : '-'),
    },
    {
      title: $t('common.operation'),
      width: 200,
      fixed: 'right',
      showOverflow: false,
      cellRender: {
        name: 'TableActions',
        attrs: {
          actions: [
            {
              key: 'preview',
              label: $t('sys.file.preview'),
              icon: 'lucide:eye',
              onClick: onPreview,
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              onClick: onDelete,
            },
            {
              key: 'move',
              label: $t('sys.file.move'),
              icon: 'lucide:move-horizontal',
              hidden: true,
              onClick: onMove,
            },
          ],
        },
      },
    },
  ];
}
