import { requestClient } from '#/api/request';

export namespace PostApi {
  export interface PostItem {
    id: string;
    code: string;
    name: string;
    level: number;
    status: number;
    sort: number;
    remark: string;
    createdAt: number;
    updatedAt: number;
  }

  export interface SaveParams {
    code: string;
    name: string;
    level?: number;
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
}

const BASE = '/admin/sys/post';

export function getPostListApi(params: PostApi.PageParams) {
  return requestClient.get<{ items: PostApi.PostItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/list`, { params });
}

export function getPostDetailApi(id: string) {
  return requestClient.get<PostApi.PostItem>(`${BASE}/detail`, { params: { id } });
}

export function getPostAllApi() {
  return requestClient.get<PostApi.PostItem[]>(`${BASE}/all`);
}

export function createPostApi(data: PostApi.SaveParams) {
  return requestClient.post<PostApi.PostItem>(`${BASE}/create`, data);
}

export function updatePostApi(data: PostApi.SaveParams & { id: string }) {
  return requestClient.put<PostApi.PostItem>(`${BASE}/update`, data);
}

export function deletePostApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}

export function batchDeletePostApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

export function batchUpdatePostApi(ids: string[], fieldName: string, value: any) {
  return requestClient.put(`${BASE}/batch-update`, { ids, [fieldName]: value });
}

export function inlineUpdatePostApi(id: string, fieldName: string, value: any) {
  return requestClient.put(`${BASE}/inline-update`, { id, field: fieldName, value });
}
