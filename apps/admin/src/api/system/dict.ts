import { requestClient } from '#/api/request';

export namespace DictApi {
  export interface DictItem {
    id: string;
    name: string;
    code: string;
    groups: string;
    remark: null | string;
    sort: number;
    status: number;
  }

  export interface DictSaveParams {
    name: string;
    code: string;
    groups?: string;
    remark?: string;
    status?: number;
  }

  export interface DictItemData {
    id: string;
    dictId: string;
    label: string;
    value: string;
    color: null | string;
    remark: null | string;
    sort: number;
    status: number;
    createdAt: number;
  }

  export interface DictItemSaveParams {
    dictId: string;
    label: string;
    value: string;
    color?: string;
    remark?: string;
    sort?: number;
    status?: number;
  }

  export interface SortItem {
    id: string;
    sort: number;
  }
}

/** 获取所有字典类型（Tree 用） */
export function getAllDictsApi() {
  return requestClient.get<DictApi.DictItem[]>('/admin/dict/all');
}

/** 新增字典类型 */
export function createDictApi(data: DictApi.DictSaveParams) {
  return requestClient.post<DictApi.DictItem>('/admin/dict/create', data);
}

/** 更新字典类型 */
export function updateDictApi(data: DictApi.DictSaveParams & { id: string }) {
  return requestClient.put<DictApi.DictItem>('/admin/dict/update', data);
}

/** 删除字典类型 */
export function deleteDictApi(id: string) {
  return requestClient.delete('/admin/dict/delete', { data: { id } });
}

/** 批量更新字典类型排序 */
export function sortDictApi(items: DictApi.SortItem[]) {
  return requestClient.put('/admin/dict/sort', { items });
}

/** 获取字典项列表 */
export function getDictItemsApi(id: string) {
  return requestClient.get<DictApi.DictItemData[]>('/admin/dict/items', { params: { id } });
}

/** 新增字典项 */
export function createDictItemApi(data: DictApi.DictItemSaveParams) {
  return requestClient.post<DictApi.DictItemData>('/admin/dict/item/create', data);
}

/** 更新字典项 */
export function updateDictItemApi(data: DictApi.DictItemSaveParams & { id: string }) {
  return requestClient.put<DictApi.DictItemData>('/admin/dict/item/update', data);
}

/** 删除字典项 */
export function deleteDictItemApi(id: string) {
  return requestClient.delete('/admin/dict/item/delete', { data: { id } });
}

/** 批量更新字典项排序 */
export function sortDictItemApi(items: DictApi.SortItem[]) {
  return requestClient.put('/admin/dict/item/sort', { items });
}
