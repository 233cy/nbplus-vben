import type { VbenFormSchema } from '#/adapter/form';
import type { CurdAdminApi } from '#/api/dev/curdAdmin';

import { $t } from '#/locales';

import { createStatusOptions } from '../data';

export interface TableFormSchemaOptions {
  connectionOptions: { label: string; value: string }[];
  tableNameOptions: { label: string; value: string }[];
  tableNamesLoading: boolean;
  onConnectionChange: (connection: string) => void;
}

/**
 * 表配置新增/编辑表单 Schema
 */
export function useTableFormSchema(options: TableFormSchemaOptions): VbenFormSchema[] {
  const { connectionOptions, tableNameOptions, tableNamesLoading, onConnectionChange } = options;

  return [
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('dev.curd.table.fields.title'),
      rules: 'required',
      componentProps: {
        placeholder: $t('dev.curd.table.placeholder.title'),
      },
    },
    {
      component: 'Select',
      fieldName: 'dbConnection',
      label: $t('dev.curd.table.fields.dbConnection'),
      componentProps: {
        options: connectionOptions,
        onChange: (value: string) => onConnectionChange(value),
      },
    },
    {
      component: 'Select',
      fieldName: 'tableName',
      label: $t('dev.curd.table.fields.tableName'),
      rules: 'required',
      componentProps: {
        options: tableNameOptions,
        loading: tableNamesLoading,
        showSearch: true,
        dropdownMatchSelectWidth: false,
        placeholder: $t('dev.curd.table.placeholder.tableName'),
      },
    },
    {
      component: 'Input',
      fieldName: 'module',
      label: $t('dev.curd.table.fields.module'),
      rules: 'required',
      componentProps: {
        placeholder: $t('dev.curd.table.placeholder.module'),
      },
    },
    {
      component: 'Input',
      fieldName: 'className',
      label: $t('dev.curd.table.fields.className'),
      rules: 'required',
      componentProps: {
        placeholder: $t('dev.curd.table.placeholder.className'),
      },
    },
    {
      component: 'Input',
      fieldName: 'routePrefix',
      label: $t('dev.curd.table.fields.routePrefix'),
      rules: 'required',
      componentProps: {
        placeholder: $t('dev.curd.table.placeholder.routePrefix'),
      },
    },
    {
      component: 'Input',
      fieldName: 'author',
      label: $t('dev.curd.table.fields.author'),
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('common.status'),
      componentProps: {
        options: createStatusOptions($t),
      },
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: $t('dev.curd.table.fields.remark'),
    },
  ];
}

/** 将表配置数据转换为表单初始值 */
export function rowToForm(row: CurdAdminApi.CurdTable): CurdAdminApi.TableSaveParams & { id: string } {
  return {
    id: row.id,
    title: row.title,
    tableName: row.tableName,
    dbConnection: row.dbConnection,
    module: row.module,
    className: row.className,
    routePrefix: row.routePrefix,
    author: row.author ?? '',
    remark: row.remark ?? '',
    status: row.status,
  };
}
