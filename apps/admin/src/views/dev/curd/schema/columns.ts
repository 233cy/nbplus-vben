import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import type { CurdAdminApi } from '#/api/admin/dev/curdAdmin';

import { $t } from '#/locales';

export interface CurdColumnOptions {
  onEditClick: (row: CurdAdminApi.CurdTable) => void;
  onDeleteClick: (row: CurdAdminApi.CurdTable) => void;
  onFieldConfigClick: (row: CurdAdminApi.CurdTable) => void;
  onCreateMenuClick: (row: CurdAdminApi.CurdTable) => void;
  onGenerateClick: (row: CurdAdminApi.CurdTable) => void;
  getGenerateLoading: (row: CurdAdminApi.CurdTable) => boolean;
}

/**
 * CURD 表配置列表列定义
 */
export function useColumns(options: CurdColumnOptions): VxeTableGridOptions['columns'] {
  const {
    onEditClick,
    onDeleteClick,
    onFieldConfigClick,
    onCreateMenuClick,
    onGenerateClick,
    getGenerateLoading,
  } = options;

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
      width: 180,
      showOverflow: false,
      cellRender: {
        name: 'TableActions',
        attrs: {
          actions: [
            {
              key: 'field',
              label: $t('dev.curd.field.title'),
              icon: 'ant-design:table-outlined',
              onClick: onFieldConfigClick,
            },
            {
              key: 'generate',
              label: $t('dev.curd.generate'),
              icon: 'ant-design:code-outlined',
              loading: getGenerateLoading,
              onClick: onGenerateClick,
            },
            {
              key: 'menu',
              label: $t('dev.curd.createMenu'),
              icon: 'ant-design:menu-outlined',
              onClick: onCreateMenuClick,
            },
            {
              key: 'edit',
              label: $t('common.edit'),
              icon: 'ant-design:edit-outlined',
              onClick: onEditClick,
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'ant-design:delete-outlined',
              danger: true,
              confirmTitle: $t('dev.curd.table.confirmDelete'),
              onClick: onDeleteClick,
            },
          ],
        },
      },
    },
  ];
}
