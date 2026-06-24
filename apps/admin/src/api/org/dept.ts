import { requestClient } from '#/api/request';

export namespace DeptApi {
  export interface DeptItem {
    id: string;
    parentId: string | null;
    name: string;
    code: string | null;
    sort: number;
    leaderId: string | null;
    phone: string | null;
    email: string | null;
    status: number;
    createdAt: number;
    updatedAt: number;
    children?: DeptItem[];
  }

  export interface DeptOption {
    id: string;
    parentId: string | null;
    name: string;
    code: string | null;
  }

  export interface SaveParams {
    id?: string;
    parentId?: string | null;
    name: string;
    code?: string;
    leaderId?: string;
    phone?: string;
    email?: string;
    status?: number;
  }

  export interface SortItem {
    id: string;
    sort: number;
  }
}

const BASE = '/admin/org/dept';

export function getDeptTreeApi() {
  return requestClient.get<DeptApi.DeptItem[]>(`${BASE}/tree`);
}

export function getDeptOptionsApi() {
  return requestClient.get<DeptApi.DeptOption[]>(`${BASE}/options`);
}

export function createDeptApi(data: DeptApi.SaveParams) {
  return requestClient.post<DeptApi.DeptItem>(`${BASE}/create`, data);
}

export function updateDeptApi(data: DeptApi.SaveParams & { id: string }) {
  return requestClient.put<DeptApi.DeptItem>(`${BASE}/update`, data);
}

export function deleteDeptApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}

export function batchDeleteDeptApi(ids: string[]) {
  return requestClient.delete<{ deleted: string[]; skipped: string[] }>(`${BASE}/batch-delete`, {
    data: { ids },
  });
}

export function toggleDeptApi(id: string, status: number) {
  return requestClient.put<DeptApi.DeptItem>(`${BASE}/toggle`, { id, status });
}

export function sortDeptApi(items: DeptApi.SortItem[]) {
  return requestClient.put(`${BASE}/sort`, { items });
}
