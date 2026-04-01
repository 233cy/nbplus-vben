import { requestClient } from '#/api/request';

export namespace CurdAdminApi {
  /** 对应 adapter/component/index.ts 中的 ComponentType */
  export type ComponentType =
    | 'ApiSelect'
    | 'ApiTreeSelect'
    | 'AutoComplete'
    | 'AvatarUpload'
    | 'Checkbox'
    | 'CheckboxGroup'
    | 'CreatableSelect'
    | 'DatePicker'
    | 'Edit'
    | 'IconPicker'
    | 'ImageUpload'
    | 'Input'
    | 'InputNumber'
    | 'InputPassword'
    | 'Mentions'
    | 'Radio'
    | 'RadioGroup'
    | 'RangePicker'
    | 'Rate'
    | 'Select'
    | 'Switch'
    | 'Textarea'
    | 'TimePicker'
    | 'TreeSelect'
    | 'Upload';

  export interface EnumOption {
    label: string;
    value: number | string;
  }

  /** options JSON 结构 */
  export interface FieldOptions {
    items?: EnumOption[]; // Select/RadioGroup 枚举值
    api?: string; // ApiSelect 远程接口
    componentProps?: Record<string, any>; // 透传给组件的 props
    rules?: Record<string, any>[]; // 额外校验规则
  }

  export interface CurdTable {
    id: string;
    title: string;
    tableName: string;
    dbConnection: string;
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
    component: ComponentType;
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
    dbConnection?: string;
    module: string;
    className: string;
    routePrefix: string;
    author?: string;
    remark?: string;
    status?: 1 | 2;
  }
}

// =========================================================================
// 数据库连接
// =========================================================================

export function getCurdConnectionsApi() {
  return requestClient.get<string[]>('/admin/curd/connections');
}

export function getCurdTablesApi(connection: string) {
  return requestClient.get<string[]>('/admin/curd/tables', { params: { connection } });
}

// =========================================================================
// 表配置
// =========================================================================

export function getCurdTableListApi(params: CurdAdminApi.TablePageParams) {
  return requestClient.get<{ items: CurdAdminApi.CurdTable[]; meta: any }>('/admin/curd/table/list', { params });
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

export function createCurdMenuApi(data: { id: string; menuIcon?: string; menuParentId?: null | string; menuPath: string; menuSort?: number }) {
  return requestClient.post('/admin/curd/create-menu', data);
}
