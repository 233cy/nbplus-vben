import { requestClient } from '#/api/request';

export namespace StorageApi {
  export interface SchemaField {
    key: string;
    label: string;
    component: 'Input' | 'InputNumber' | 'InputPassword' | 'Select' | 'Switch';
    default: any;
    options?: { label: string; value: string }[];
  }

  export interface DriverSchema {
    engine: string;
    label: string;
    schema: SchemaField[];
  }

  export interface StorageItem {
    id: string;
    name: string;
    code: string;
    engine: string;
    status: number;
    isDefault: number;
    sort: number;
    config: Record<string, any>;
    createdAt: number;
    updatedAt: number;
  }

  export interface StorageOptions {
    id: string;
    name: string;
    code: string;
    engine: string;
  }

  export interface SaveParams {
    name: string;
    code: string;
    engine: string;
    config?: Record<string, any>;
    sort?: number;
    status?: number;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    engine?: string;
    status?: number;
  }
}

const BASE = '/admin/sys/storage';

export function getStorageListApi(params: StorageApi.PageParams) {
  return requestClient.get<{ items: StorageApi.StorageItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/list`, { params });
}

export function getStorageDetailApi(id: string) {
  return requestClient.get<StorageApi.StorageItem>(`${BASE}/detail`, { params: { id } });
}

export function getStorageOptionsApi() {
  return requestClient.get<StorageApi.StorageOptions[]>(`${BASE}/options`);
}

export function getStorageDriverSchemasApi() {
  return requestClient.get<StorageApi.DriverSchema[]>(`${BASE}/driver-schemas`);
}

export function createStorageApi(data: StorageApi.SaveParams) {
  return requestClient.post<StorageApi.StorageItem>(`${BASE}/create`, data);
}

export function updateStorageApi(data: StorageApi.SaveParams & { id: string }) {
  return requestClient.put<StorageApi.StorageItem>(`${BASE}/update`, data);
}

export function batchDeleteStorageApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

export function toggleStorageApi(id: string, status: number) {
  return requestClient.put(`${BASE}/toggle`, { id, status });
}

export function setDefaultStorageApi(id: string) {
  return requestClient.put(`${BASE}/set-default`, { id });
}
