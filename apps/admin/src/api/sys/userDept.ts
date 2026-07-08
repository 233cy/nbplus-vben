import { requestClient } from '#/api/request';

export namespace DeptApi {
  export interface DeptItem {
    id: string;
    parentId: null | string;
    path?: string;
    level?: number;
    name: string;
    code: null | string;
    sort: number;
    leaderId: null | string;
    phone: null | string;
    email: null | string;
    status: number;
    createdAt: number;
    updatedAt: number;
    children?: DeptItem[];
  }

  export interface DeptListParams {
    parentId?: string;
    keyword?: string;
    status?: number;
    page?: number;
    pageSize?: number;
  }

  export interface DeptListResult {
    items: DeptItem[];
    meta: {
      currentPage: number;
      perPage: number;
      total: number;
    };
  }

  export interface DeptTreeResult {
    items: DeptItem[];
    meta: {
      type: 'tree';
      total: number;
    };
  }

  export interface SaveParams {
    id?: string;
    parentId?: null | string;
    name: string;
    code?: string;
    leaderId?: string;
    phone?: string;
    email?: string;
    status?: number;
  }
}

const BASE = '/admin/sys/user-dept';

export function getDeptTreeApi() {
  return requestClient.get<DeptApi.DeptTreeResult>(`${BASE}/tree`);
}

export function getDeptListApi(params: DeptApi.DeptListParams = {}) {
  return requestClient.get<DeptApi.DeptListResult>(`${BASE}/list`, {
    params: {
      parentId: params.parentId ?? '0',
      ...params,
    },
  });
}

export function getDeptDetailApi(id: string) {
  return requestClient.get<DeptApi.DeptItem>(`${BASE}/detail`, { params: { id } });
}

export function createDeptApi(data: DeptApi.SaveParams) {
  return requestClient.post<DeptApi.DeptItem>(`${BASE}/create`, data);
}

export function updateDeptApi(data: DeptApi.SaveParams & { id: string }) {
  return requestClient.put<DeptApi.DeptItem>(`${BASE}/update`, data);
}

export function inlineUpdateDeptApi(id: string, field: string, value: any) {
  return requestClient.put<DeptApi.DeptItem>(`${BASE}/inline-update`, { id, field, value });
}

export function deleteDeptApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}
