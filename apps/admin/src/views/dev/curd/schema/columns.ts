import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { $t } from '#/locales';

/**
 * CURD 表配置列表列定义
 */
export function useColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'title',
      title: $t('dev.curd.table.fields.title'),
      minWidth: 140,
      sortable: true,
    },
    {
      field: 'tableName',
      title: $t('dev.curd.table.fields.tableName'),
      minWidth: 140,
      sortable: true,
    },
    {
      field: 'dbConnection',
      title: $t('dev.curd.table.fields.dbConnection'),
      width: 120,
    },
    {
      field: 'module',
      title: $t('dev.curd.table.fields.module'),
      width: 100,
      sortable: true,
    },
    {
      field: 'className',
      title: $t('dev.curd.table.fields.className'),
      width: 120,
      sortable: true,
    },
    {
      field: 'routePrefix',
      title: $t('dev.curd.table.fields.routePrefix'),
      minWidth: 140,
      sortable: true,
    },
    {
      field: 'author',
      title: $t('dev.curd.table.fields.author'),
      width: 120,
    },
    {
      field: 'status',
      title: $t('dev.curd.table.fields.status'),
      width: 90,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('dev.curd.status.enabled'), value: 1 },
          { color: 'error', label: $t('dev.curd.status.disabled'), value: 2 },
        ],
      },
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      title: $t('common.operation'),
      width: 240,
      slots: { default: 'operation' },
    },
  ];
}
