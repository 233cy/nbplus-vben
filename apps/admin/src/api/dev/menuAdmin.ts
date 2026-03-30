import { requestClient } from '#/api/request';

export namespace MenuAdminApi {
  export interface MenuItem {
    id: string;
    parentId: null | string;
    type: 1 | 2 | 3;
    title: string;
    name: string;
    path: string;
    component: string;
    icon: string;
    permission: string;
    sort: number;
    isHidden: boolean;
    isKeepAlive: boolean;
    status: 1 | 2;
    children?: MenuItem[];
  }

  export interface SaveParams {
    id?: string;
    parentId?: null | string;
    type: 1 | 2 | 3;
    title: string;
    name?: string;
    path?: string;
    component?: string;
    icon?: string;
    permission?: string;
    sort?: number;
    isHidden?: boolean;
    isKeepAlive?: boolean;
    status?: 1 | 2;
  }
}

/** 获取完整菜单树（管理端） */
export function getMenuListApi() {
  return requestClient.get<MenuAdminApi.MenuItem[]>('/admin/menu/list');
}

/** 新增菜单 */
export function createMenuApi(data: MenuAdminApi.SaveParams) {
  return requestClient.post<MenuAdminApi.MenuItem>('/admin/menu/create', data);
}

/** 更新菜单 */
export function updateMenuApi(data: MenuAdminApi.SaveParams & { id: string }) {
  return requestClient.put<MenuAdminApi.MenuItem>('/admin/menu/update', data);
}

/** 删除菜单 */
export function deleteMenuApi(id: string) {
  return requestClient.delete('/admin/menu/delete', { data: { id } });
}

/** 批量更新排序 */
export function sortMenuApi(items: { id: string; sort: number }[]) {
  return requestClient.put('/admin/menu/sort', { items });
}

/** 快捷切换单个字段（status / isHidden / isKeepAlive） */
export function toggleMenuApi(id: string, field: 'isHidden' | 'isKeepAlive' | 'status', value: boolean | number) {
  return requestClient.put('/admin/menu/toggle', { id, [field]: value });
}
