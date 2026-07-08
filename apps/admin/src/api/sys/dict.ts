import { requestClient } from '#/api/request';

export namespace DictApi {
  export interface DictItem {
    id: string;
    name: string;
    code: string;
    groups: null | string;
    remark: null | string;
    sort: number;
    status: number;
    itemCount: number;
    createdAt: number;
    updatedAt: number;
  }

  export interface DictSaveParams {
    name: string;
    code: string;
    groups?: null | string;
    remark?: null | string;
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
    color?: null | string;
    remark?: null | string;
    sort?: number;
    status?: number;
  }

  export interface DictListParams {
    keyword?: string;
    status?: number;
    groups?: string;
  }
}

export function getDictListApi(params: DictApi.DictListParams & { page: number; pageSize: number }) {
  return requestClient.get('/admin/sys/dict/list', { params });
}

export function getDictOptionsApi() {
  return requestClient.get<DictApi.DictItem[]>('/admin/sys/dict/options');
}

export function getDictDetailApi(id: string) {
  return requestClient.get<DictApi.DictItem>('/admin/sys/dict/detail', { params: { id } });
}

export function createDictApi(data: DictApi.DictSaveParams) {
  return requestClient.post<DictApi.DictItem>('/admin/sys/dict/create', data);
}

export function updateDictApi(data: Partial<DictApi.DictSaveParams> & { id: string; sort?: number }) {
  return requestClient.put<DictApi.DictItem>('/admin/sys/dict/update', data);
}

export function deleteDictApi(id: string) {
  return requestClient.delete('/admin/sys/dict/delete', { data: { id } });
}

export function batchDeleteDictApi(ids: string[]) {
  return requestClient.delete('/admin/sys/dict/batch-delete', { data: { ids } });
}

export function batchUpdateDictApi(ids: string[], fieldName: string, value: any) {
  return requestClient.put('/admin/sys/dict/batch-update', { ids, [fieldName]: value });
}

export function getDictItemListApi(dictId: string) {
  return requestClient.get<DictApi.DictItemData[]>('/admin/sys/dict/items/list', { params: { id: dictId } });
}

export function getDictItemDetailApi(id: string) {
  return requestClient.get<DictApi.DictItemData>('/admin/sys/dict/items/detail', { params: { id } });
}

export function createDictItemApi(data: DictApi.DictItemSaveParams) {
  return requestClient.post<DictApi.DictItemData>('/admin/sys/dict/items/create', data);
}

export function updateDictItemApi(data: DictApi.DictItemSaveParams & { id: string }) {
  return requestClient.put<DictApi.DictItemData>('/admin/sys/dict/items/update', data);
}

export function deleteDictItemApi(id: string) {
  return requestClient.delete('/admin/sys/dict/items/delete', { data: { id } });
}

export function batchDeleteDictItemApi(ids: string[]) {
  return requestClient.delete('/admin/sys/dict/items/batch-delete', { data: { ids } });
}

export function batchUpdateDictItemApi(ids: string[], fieldName: string, value: any) {
  return requestClient.put('/admin/sys/dict/items/batch-update', { ids, [fieldName]: value });
}
