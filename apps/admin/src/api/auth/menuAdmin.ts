import { requestClient } from '#/api/request';

export namespace MenuAdminApi {
  /** 1=目录 2=菜单 3=按钮 4=内嵌 5=外链 */
  export type MenuType = 1 | 2 | 3 | 4 | 5;

  export interface MenuItem {
    id: string;
    parentId: null | string;
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
    badgeType: '' | 'dot' | 'normal';
    badgeVariants: 'default' | 'destructive' | 'primary' | 'success' | 'warning' | '';
    isHidden: boolean;
    isHideChildren: boolean;
    isHideBreadcrumb: boolean;
    isHideTab: boolean;
    isKeepAlive: boolean;
    isAffixTab: boolean;
    status: 1 | 2;
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
    badgeType?: '' | 'dot' | 'normal';
    badgeVariants?: 'default' | 'destructive' | 'primary' | 'success' | 'warning' | '';
    isHidden?: boolean;
    isHideChildren?: boolean;
    isHideBreadcrumb?: boolean;
    isHideTab?: boolean;
    isKeepAlive?: boolean;
    isAffixTab?: boolean;
    status?: 1 | 2;
  }
}

export function getMenuListApi() {
  return requestClient.get<MenuAdminApi.MenuItem[]>('/admin/auth/menu/list');
}

export function createMenuApi(data: MenuAdminApi.SaveParams) {
  return requestClient.post<MenuAdminApi.MenuItem>('/admin/auth/menu/create', data);
}

export function updateMenuApi(data: MenuAdminApi.SaveParams & { id: string }) {
  return requestClient.put<MenuAdminApi.MenuItem>('/admin/auth/menu/update', data);
}

export function deleteMenuApi(id: string) {
  return requestClient.delete('/admin/auth/menu/delete', { data: { id } });
}

export function batchDeleteMenuApi(ids: string[]) {
  return requestClient.delete<{ deleted: string[]; skipped: string[] }>('/admin/auth/menu/batch-delete', { data: { ids } });
}

export function sortMenuApi(items: { id: string; sort: number }[]) {
  return requestClient.put('/admin/auth/menu/sort', { items });
}

export function batchCreateMenuApi(items: MenuAdminApi.SaveParams[]) {
  return requestClient.post<{ created: MenuAdminApi.MenuItem[]; skipped: string[] }>('/admin/auth/menu/batch-create', { items });
}

export interface ControllerMethodItem {
  title: string;
  path: string;
  method: string;
}

export function getControllerMethodsApi(prefix: string) {
  return requestClient.post<ControllerMethodItem[]>('/admin/auth/menu/controller-methods', { prefix });
}

export function toggleMenuApi(id: string, field: 'isAffixTab' | 'isHidden' | 'isKeepAlive' | 'status', value: boolean | number) {
  return requestClient.put('/admin/auth/menu/toggle', { id, [field]: value });
}
