import type { ConfigApi } from '#/api/admin/sys/config';

import { requestClient } from '#/api/request';

export namespace FileApi {
  export interface FileItem {
    id: string;
    originalName: string;
    extension: string;
    mimeType: string;
    sizeByte: string;
    hash?: string;
    engine: string;
    storageCode: string;
    logicalPath: string;
    accessType: string;
    accessPolicy: string;
    status: number;
    refCount: number;
    fullUrl: string;
    creator: string;
    createdAt: number;
    updatedAt: number;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    accessType?: string;
    accessPolicy?: string;
    storageCode?: string;
    status?: number;
  }
}

const BASE = '/admin/sys/file';

export function getFileListApi(params: FileApi.PageParams) {
  return requestClient.get<{ items: FileApi.FileItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/list`, { params });
}

export function getFileDetailApi(id: string) {
  return requestClient.get<FileApi.FileItem>(`${BASE}/detail`, { params: { id } });
}

export function batchDeleteFileApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

export function moveFileApi(id: string, storageCode: string) {
  return requestClient.put(`${BASE}/move`, { id, storageCode });
}

export function batchMoveFileApi(ids: string[], storageCode: string) {
  return requestClient.put(`${BASE}/batch-move`, { ids, storageCode });
}

export function previewFileApi(logicalPath: string) {
  return requestClient.get<{ url: string }>(`${BASE}/preview`, { params: { logicalPath } });
}

export function saveFileConfigApi(items: ConfigApi.SaveItem[]) {
  return requestClient.post(`${BASE}/save-config`, { items });
}
