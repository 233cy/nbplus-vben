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
  return requestClient.get<MenuAdminApi.MenuItem[]>('/admin/menu/list');
}

export function createMenuApi(data: MenuAdminApi.SaveParams) {
  return requestClient.post<MenuAdminApi.MenuItem>('/admin/menu/create', data);
}

export function updateMenuApi(data: MenuAdminApi.SaveParams & { id: string }) {
  return requestClient.put<MenuAdminApi.MenuItem>('/admin/menu/update', data);
}

export function deleteMenuApi(id: string) {
  return requestClient.delete('/admin/menu/delete', { data: { id } });
}

export function sortMenuApi(items: { id: string; sort: number }[]) {
  return requestClient.put('/admin/menu/sort', { items });
}

export function toggleMenuApi(id: string, field: 'isAffixTab' | 'isHidden' | 'isKeepAlive' | 'status', value: boolean | number) {
  return requestClient.put('/admin/menu/toggle', { id, [field]: value });
}
