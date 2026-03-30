import { requestClient } from '#/api/request';

export namespace CurdAdminApi {
  export type ColumnType = 'bool' | 'datetime' | 'enum' | 'int' | 'relation' | 'string';

  export interface EnumOption {
    label: string;
    value: number | string;
  }

  export interface FieldOptions {
    items?: EnumOption[]; // enum 类型的枚举值
    table?: string; // relation 类型的关联表名
    labelColumn?: string; // relation 类型的显示字段
    valueColumn?: string; // relation 类型的值字段
    rules?: Record<string, any>[]; // 额外校验规则
  }

  export interface CurdTable {
    id: string;
    title: string;
    tableName: string;
    module: string;
    className: string;
    routePrefix: string;
    author: string;
    remark: string;
    status: 1 | 2;
  }

  export interface CurdField {
    id?: string;
    tableId: string;
    columnName: string;
    columnType: ColumnType;
    label: string;
    isList: boolean;
    isSearch: boolean;
    isForm: boolean;
    isRequired: boolean;
    options: FieldOptions | null;
    sort: number;
  }

  export interface TablePageParams {
    page?: number;
    pageSize?: number;
    title?: string;
    tableName?: string;
  }

  export interface TableSaveParams {
    id?: string;
    title: string;
    tableName: string;
    module: string;
    className: string;
    routePrefix: string;
    author?: string;
    remark?: string;
    status?: 1 | 2;
  }
}

// =========================================================================
// 表配置
// =========================================================================

export function getCurdTableListApi(params: CurdAdminApi.TablePageParams) {
  return requestClient.get<{ items: CurdAdminApi.CurdTable[]; total: number }>('/admin/curd/table/list', { params });
}

export function createCurdTableApi(data: CurdAdminApi.TableSaveParams) {
  return requestClient.post<CurdAdminApi.CurdTable>('/admin/curd/table/create', data);
}

export function updateCurdTableApi(data: CurdAdminApi.TableSaveParams & { id: string }) {
  return requestClient.put<CurdAdminApi.CurdTable>('/admin/curd/table/update', data);
}

export function deleteCurdTableApi(id: string) {
  return requestClient.delete('/admin/curd/table/delete', { data: { id } });
}

// =========================================================================
// 字段配置
// =========================================================================

export function getCurdFieldListApi(tableId: string) {
  return requestClient.get<CurdAdminApi.CurdField[]>('/admin/curd/field/list', { params: { tableId } });
}

export function saveCurdFieldsApi(tableId: string, fields: CurdAdminApi.CurdField[]) {
  return requestClient.post('/admin/curd/field/save', { tableId, fields });
}

export function syncCurdFieldsApi(id: string) {
  return requestClient.post<CurdAdminApi.CurdField[]>('/admin/curd/field/sync', { id });
}

export function generateCurdApi(id: string) {
  return requestClient.post<string[]>('/admin/curd/generate', { id });
}
