import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { StorageApi } from '#/api/system/storage';

import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

export function useColumns(
  onEdit: (record: StorageApi.StorageItem) => void,
  onSetDefault: (record: StorageApi.StorageItem) => void,
  onToggle: (record: StorageApi.StorageItem, checked: boolean) => void,
  onSingleDelete: (record: StorageApi.StorageItem) => void,
): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 50 },
    {
      field: 'name',
      title: $t('system.storage.fields.name'),
      minWidth: 160,
    },
    {
      field: 'code',
      title: $t('system.storage.fields.code'),
      minWidth: 120,
    },
    {
      field: 'engine',
      title: $t('system.storage.fields.engine'),
      width: 140,
      formatter: ({ cellValue }: any) => $t(`system.storage.options.engine.${cellValue}`) || cellValue,
    },
    {
      field: 'isDefault',
      title: $t('system.storage.fields.isDefault'),
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: $t('system.storage.options.isDefault.1'), value: 1 },
          { color: '', label: $t('system.storage.options.isDefault.2'), value: 2 },
        ],
      },
    },
    {
      field: 'status',
      title: $t('system.storage.fields.status'),
      width: 100,
      cellRender: {
        name: 'CellSwitch',
        props: {
          checkedValue: 1,
          unCheckedValue: 2,
        },
        attrs: {
          beforeChange: (newVal: number, row: StorageApi.StorageItem) => {
            onToggle(row, newVal === 1);
            return true;
          },
        },
      },
    },
    {
      field: 'sort',
      title: $t('system.storage.fields.sort'),
      width: 100,
    },
    {
      field: 'createdAt',
      title: $t('common.createdAt'),
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
              key: 'edit',
              label: $t('common.edit'),
              icon: 'lucide:pencil',
              onClick: onEdit,
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              onClick: onSingleDelete,
            },
            {
              key: 'setDefault',
              label: $t('system.storage.setDefault'),
              icon: 'lucide:star',
              hidden: (row: StorageApi.StorageItem) => row.isDefault === 1,
              onClick: onSetDefault,
            },
          ],
        },
      },
    },
  ];
}
