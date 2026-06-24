import { requestClient } from '#/api/request';

export namespace RoleApi {
  export interface RoleItem {
    id: string;
    code: string;
    name: string;
    dataScope: number;
    status: number;
    sort: number;
    remark: string;
    createdAt: number;
    updatedAt: number;
  }

  export interface SaveParams {
    code: string;
    name: string;
    dataScope?: number;
    status?: number;
    sort?: number;
    remark?: string;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    code?: string;
    name?: string;
    status?: number;
  }

  export interface MenuTreeItem {
    id: string;
    type: number;
    title: string;
    name: string;
    path: string;
    permission: string;
    sort: number;
    checked: boolean;
    children: MenuTreeItem[];
  }

  export interface DataScopeResult {
    dataScope: number;
    deptIds: string[];
  }

  export interface DeptTreeItem {
    id: string;
    name: string;
    sort: number;
    children: DeptTreeItem[];
  }
}

const BASE = '/admin/auth/role';

export function getRoleListApi(params: RoleApi.PageParams) {
  return requestClient.get<{ items: RoleApi.RoleItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/list`, { params });
}

export function getRoleDetailApi(id: string) {
  return requestClient.get<RoleApi.RoleItem>(`${BASE}/detail`, { params: { id } });
}

export function createRoleApi(data: RoleApi.SaveParams) {
  return requestClient.post<RoleApi.RoleItem>(`${BASE}/create`, data);
}

export function updateRoleApi(data: RoleApi.SaveParams & { id: string }) {
  return requestClient.put<RoleApi.RoleItem>(`${BASE}/update`, data);
}

export function deleteRoleApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}

export function batchDeleteRoleApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

export function batchUpdateRoleApi(ids: string[], fieldName: string, value: any) {
  return requestClient.put(`${BASE}/batch-update`, { ids, [fieldName]: value });
}

export function inlineUpdateRoleApi(id: string, field: string, value: any) {
  return requestClient.put(`${BASE}/inline-update`, { id, field, value });
}

export function assignRoleMenusApi(id: string, menuIds: string[]) {
  return requestClient.put(`${BASE}/assign-menus`, { id, menuIds });
}

export function getRoleMenuTreeApi(id: string) {
  return requestClient.get<RoleApi.MenuTreeItem[]>(`${BASE}/menu-tree`, { params: { id } });
}

export function assignRoleDataScopeApi(id: string, dataScope: number, deptIds: string[]) {
  return requestClient.put(`${BASE}/assign-data-scope`, { id, dataScope, deptIds });
}

export function getRoleDataScopeApi(id: string) {
  return requestClient.get<RoleApi.DataScopeResult>(`${BASE}/data-scope`, { params: { id } });
}

export function getRoleDeptTreeApi() {
  return requestClient.get<RoleApi.DeptTreeItem[]>(`${BASE}/dept-tree`);
}
