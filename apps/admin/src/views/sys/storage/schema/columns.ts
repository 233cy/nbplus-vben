import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { StorageApi } from '#/api/sys/storage';

import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

import { useStoragePermission } from '../permissions';

export function useColumns(
  onEdit: (record: StorageApi.StorageItem) => void,
  onSetDefault: (record: StorageApi.StorageItem) => void,
  onToggle: (record: StorageApi.StorageItem, checked: boolean) => void,
  onSingleDelete: (record: StorageApi.StorageItem) => void,
): VxeTableGridOptions['columns'] {
  const { canUpdate, canDelete } = useStoragePermission();

  const actions = [];
  if (canUpdate) {
    actions.push({
      key: 'edit',
      label: $t('common.edit'),
      icon: 'lucide:pencil',
      onClick: onEdit,
    });
  }
  if (canDelete) {
    actions.push({
      key: 'delete',
      label: $t('common.delete'),
      icon: 'lucide:trash-2',
      danger: true,
      confirmTitle: $t('common.confirmDelete'),
      onClick: onSingleDelete,
    });
  }
  if (canUpdate) {
    actions.push({
      key: 'setDefault',
      label: $t('sys.storage.setDefault'),
      icon: 'lucide:star',
      hidden: (row: StorageApi.StorageItem) => row.isDefault === 1,
      onClick: onSetDefault,
    });
  }

  return [
    { type: 'checkbox', width: 50 },
    {
      field: 'name',
      title: $t('sys.storage.fields.name'),
      minWidth: 160,
    },
    {
      field: 'code',
      title: $t('sys.storage.fields.code'),
      minWidth: 120,
    },
    {
      field: 'engine',
      title: $t('sys.storage.fields.engine'),
      width: 140,
      formatter: ({ cellValue }: any) => $t(`sys.storage.options.engine.${cellValue}`) || cellValue,
    },
    {
      field: 'isDefault',
      title: $t('sys.storage.fields.isDefault'),
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: $t('sys.storage.options.isDefault.1'), value: 1 },
          { color: '', label: $t('sys.storage.options.isDefault.2'), value: 2 },
        ],
      },
    },
    {
      field: 'status',
      title: $t('sys.storage.fields.status'),
      width: 100,
      cellRender: {
        name: 'CellSwitch',
        props: {
          checkedValue: 1,
          unCheckedValue: 2,
          disabled: !canUpdate,
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
      title: $t('sys.storage.fields.sort'),
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
          actions,
        },
      },
    },
  ];
}
