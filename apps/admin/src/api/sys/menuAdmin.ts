import { requestClient } from '#/api/request';

export namespace MenuAdminApi {
  /** 1=目录 2=菜单 3=按钮 4=内嵌 5=外链 */
  export type MenuType = 1 | 2 | 3 | 4 | 5;

  export interface MenuItem {
    id: string;
    parentId: null | string;
    treePath: string;
    level: number;
    type: MenuType;
    title: string;
    name: string;
    path: string;
    activePath: string;
    linkSrc: string;
    component: string;
    icon: string;
    activeIcon: string;
    permission: string;
    sort: number;
    badge: string;
    badgeType: '' | 'dot' | 'normal' | 'off';
    badgeVariants: '' | 'default' | 'destructive' | 'primary' | 'success' | 'warning';
    isHidden: boolean;
    isHideChildren: boolean;
    isHideBreadcrumb: boolean;
    isHideTab: boolean;
    isKeepAlive: boolean;
    isAffixTab: boolean;
    status: 1 | 2;
    createdAt?: number;
    updatedAt?: number;
    hasChild?: boolean;
    children?: MenuItem[];
  }

  export interface SaveParams {
    id?: string;
    parentId?: null | string;
    type: MenuType;
    title: string;
    name?: string;
    path?: string;
    activePath?: string;
    linkSrc?: string;
    component?: string;
    icon?: string;
    activeIcon?: string;
    permission?: string;
    sort?: number;
    badge?: string;
    badgeType?: '' | 'dot' | 'normal' | 'off';
    badgeVariants?: '' | 'default' | 'destructive' | 'primary' | 'success' | 'warning';
    isHidden?: boolean;
    isHideChildren?: boolean;
    isHideBreadcrumb?: boolean;
    isHideTab?: boolean;
    isKeepAlive?: boolean;
    isAffixTab?: boolean;
    status?: 1 | 2;
  }
}

export function getMenuTreeApi(params?: { keyword?: string; status?: number }) {
  return requestClient.get<MenuAdminApi.MenuItem[]>('/admin/sys/menu/tree', { params });
}

export function getMenuListApi(params: { keyword?: string; page?: number; pageSize?: number; parentId?: string; status?: number }) {
  return requestClient.get('/admin/sys/menu/list', { params });
}

export function getMenuDetailApi(id: string) {
  return requestClient.get<MenuAdminApi.MenuItem>('/admin/sys/menu/detail', { params: { id } });
}

export function createMenuApi(data: MenuAdminApi.SaveParams) {
  return requestClient.post<MenuAdminApi.MenuItem>('/admin/sys/menu/create', data);
}

export function updateMenuApi(data: MenuAdminApi.SaveParams & { id: string }) {
  return requestClient.put<MenuAdminApi.MenuItem>('/admin/sys/menu/update', data);
}

export function deleteMenuApi(id: string) {
  return requestClient.delete('/admin/sys/menu/delete', { data: { id } });
}

export function batchDeleteMenuApi(ids: string[]) {
  return requestClient.delete<{ deleted: string[]; skipped: string[] }>('/admin/sys/menu/batch-delete', { data: { ids } });
}

export function sortMenuApi(items: { id: string; sort: number }[]) {
  return requestClient.put('/admin/sys/menu/sort', { items });
}

export function inlineUpdateMenuApi(id: string, field: string, value: any) {
  return requestClient.put('/admin/sys/menu/inline-update', { id, field, value });
}

export function batchCreateMenuApi(items: MenuAdminApi.SaveParams[]) {
  return requestClient.post<{ created: MenuAdminApi.MenuItem[]; skipped: string[] }>('/admin/sys/menu/batch-create', { items });
}

export interface ControllerMethodItem {
  title: string;
  path: string;
  method: string;
}

export function getControllerMethodsApi(prefix: string) {
  return requestClient.post<ControllerMethodItem[]>('/admin/sys/menu/controller-methods', { prefix });
}
