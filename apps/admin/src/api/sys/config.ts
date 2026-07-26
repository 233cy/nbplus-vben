import { requestClient } from '#/api/request';

export namespace ConfigApi {
  export interface ConfigItem {
    id: string;
    groups: string;
    key: string;
    value: string;
    component: string;
    label: string;
    isEncrypted: number;
    isPublic: number;
    isSys: number;
    sort: number;
    remark: null | string;
    createdAt: number;
    updatedAt: number;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    groups?: string;
    isPublic?: number;
  }

  export interface CreateParams {
    groups: string;
    key: string;
    label: string;
    value?: string;
    component?: string;
    isEncrypted?: number;
    isPublic?: number;
    sort?: number;
    remark?: string;
  }

  export interface UpdateParams {
    id: string;
    groups?: string;
    label?: string;
    value?: string;
    component?: string;
    isEncrypted?: number;
    isPublic?: number;
    isSys?: number;
    sort?: number;
    remark?: string;
  }

  export interface SaveItem {
    key: string;
    value: string;
  }

  export interface PublicConfigItem {
    key: string;
    value: string;
    label: string;
  }
}

export function getConfigListApi(params: ConfigApi.PageParams) {
  return requestClient.get<{ items: ConfigApi.ConfigItem[]; meta: any }>('/admin/sys/config/list', { params });
}

export function getConfigDetailApi(id: string) {
  return requestClient.get<ConfigApi.ConfigItem>('/admin/sys/config/detail', { params: { id } });
}

export function createConfigApi(data: ConfigApi.CreateParams) {
  return requestClient.post<ConfigApi.ConfigItem>('/admin/sys/config/create', data);
}

export function updateConfigApi(data: ConfigApi.UpdateParams) {
  return requestClient.put<ConfigApi.ConfigItem>('/admin/sys/config/update', data);
}

export function saveConfigApi(items: ConfigApi.SaveItem[]) {
  return requestClient.post('/admin/sys/config/save', { items });
}

export function deleteConfigApi(id: string) {
  return requestClient.delete('/admin/sys/config/delete', { data: { id } });
}

export function batchDeleteConfigApi(ids: string[]) {
  return requestClient.delete('/admin/sys/config/batch-delete', { data: { ids } });
}

export function batchUpdateConfigApi(ids: string[], fieldName: string, value: any) {
  return requestClient.put('/admin/sys/config/batch-update', { ids, [fieldName]: value });
}

/** 获取公开配置（无需登录） */
export function getPublicConfigApi() {
  return requestClient.get<ConfigApi.PublicConfigItem[]>('/config/public');
}
