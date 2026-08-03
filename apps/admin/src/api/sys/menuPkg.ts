import { requestClient } from '#/api/request';

export namespace MenuPkgApi {
  export interface MenuPkgItem {
    id: string;
    code: string;
    name: string;
    sort: number;
    status: number;
    remark: string;
    createdAt: number;
    updatedAt: number;
  }

  export interface SaveParams {
    code: string;
    name: string;
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
    status?: number;
    children: MenuTreeItem[];
  }
}

const BASE = '/admin/sys/menu-pkg';

export function getMenuPkgListApi(params: MenuPkgApi.PageParams) {
  return requestClient.get<{ items: MenuPkgApi.MenuPkgItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/list`, { params });
}

export function getMenuPkgAllApi() {
  return requestClient.get<MenuPkgApi.MenuPkgItem[]>(`${BASE}/all`);
}

export function getMenuPkgDetailApi(id: string) {
  return requestClient.get<MenuPkgApi.MenuPkgItem>(`${BASE}/detail`, { params: { id } });
}

export function createMenuPkgApi(data: MenuPkgApi.SaveParams) {
  return requestClient.post<MenuPkgApi.MenuPkgItem>(`${BASE}/create`, data);
}

export function updateMenuPkgApi(data: MenuPkgApi.SaveParams & { id: string }) {
  return requestClient.put<MenuPkgApi.MenuPkgItem>(`${BASE}/update`, data);
}

export function deleteMenuPkgApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}

export function batchDeleteMenuPkgApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

export function batchUpdateMenuPkgApi(ids: string[], fieldName: string, value: any) {
  return requestClient.put(`${BASE}/batch-update`, { ids, [fieldName]: value });
}

export function inlineUpdateMenuPkgApi(id: string, field: string, value: any) {
  return requestClient.put(`${BASE}/inline-update`, { id, field, value });
}

export function assignMenuPkgMenusApi(id: string, menuIds: string[]) {
  return requestClient.put(`${BASE}/assign-menus`, { id, menuIds });
}

export function getMenuPkgMenuIdsApi(id: string) {
  return requestClient.get<string[]>(`${BASE}/menu-ids`, { params: { id } });
}

export function getMenuPkgMenuTreeApi() {
  return requestClient.get<MenuPkgApi.MenuTreeItem[]>(`${BASE}/menu-tree`);
}
