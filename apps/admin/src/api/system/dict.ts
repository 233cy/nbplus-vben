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
    remark?: string | null;
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

export function getAllDictsApi() {
  return requestClient.get<DictApi.DictItem[]>('/admin/system/dict/all');
}

export function createDictApi(data: DictApi.DictSaveParams) {
  return requestClient.post<DictApi.DictItem>('/admin/system/dict/create', data);
}

export function updateDictApi(data: DictApi.DictSaveParams & { id: string }) {
  return requestClient.put<DictApi.DictItem>('/admin/system/dict/update', data);
}

export function deleteDictApi(id: string) {
  return requestClient.delete('/admin/system/dict/delete', { data: { id } });
}

export function sortDictApi(items: DictApi.SortItem[]) {
  return requestClient.put('/admin/system/dict/sort', { items });
}

export function getDictItemsApi(id: string) {
  return requestClient.get<DictApi.DictItemData[]>('/admin/system/dict/items', { params: { id } });
}

export function createDictItemApi(data: DictApi.DictItemSaveParams) {
  return requestClient.post<DictApi.DictItemData>('/admin/system/dict/item/create', data);
}

export function updateDictItemApi(data: DictApi.DictItemSaveParams & { id: string }) {
  return requestClient.put<DictApi.DictItemData>('/admin/system/dict/item/update', data);
}

export function deleteDictItemApi(id: string) {
  return requestClient.delete('/admin/system/dict/item/delete', { data: { id } });
}

export function sortDictItemApi(items: DictApi.SortItem[]) {
  return requestClient.put('/admin/system/dict/item/sort', { items });
}
