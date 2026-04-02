import { requestClient } from '#/api/request';

export namespace ConfigApi {
  export interface GroupItem {
    groups: string;
    groupLabel: string;
  }

  export interface ConfigItem {
    id: string;
    groups: string;
    groupLabel: string;
    key: string;
    value: string;
    component: string;
    label: string;
    isEncrypted: boolean;
    isPublic: boolean;
    isSys: boolean;
    sort: number;
    remark: null | string;
  }

  export interface SaveItem {
    key: string;
    value: string;
  }

  export interface CreateParams {
    groups: string;
    key: string;
    label: string;
    component?: string;
    isEncrypted?: boolean;
    isPublic?: boolean;
    sort?: number;
    remark?: string;
  }

  export interface UpdateParams {
    id: string;
    groups?: string;
    label?: string;
    value?: string;
    component?: string;
    isEncrypted?: boolean;
    isPublic?: boolean;
    isSys?: boolean;
    sort?: number;
    remark?: string;
  }

  export interface PublicConfigItem {
    key: string;
    value: string;
    label: string;
  }
}

export function getConfigGroupsApi() {
  return requestClient.get<ConfigApi.GroupItem[]>('/admin/system/config/groups');
}

export function getConfigListApi(groups: string) {
  return requestClient.get<ConfigApi.ConfigItem[]>('/admin/system/config/list', { params: { groups } });
}

export function saveConfigApi(items: ConfigApi.SaveItem[]) {
  return requestClient.post('/admin/system/config/save', { items });
}

export function createConfigApi(data: ConfigApi.CreateParams) {
  return requestClient.post<ConfigApi.ConfigItem>('/admin/system/config/create', data);
}

export function updateConfigApi(data: ConfigApi.UpdateParams) {
  return requestClient.put<ConfigApi.ConfigItem>('/admin/system/config/update', data);
}

export function reorderConfigApi(items: { id: string; sort: number }[]) {
  return requestClient.put('/admin/system/config/reorder', { items });
}

export function toggleConfigApi(id: string, field: 'isPublic' | 'isSys') {
  return requestClient.put<ConfigApi.ConfigItem>('/admin/system/config/toggle', { id, field });
}

export function deleteConfigApi(id: string) {
  return requestClient.delete('/admin/system/config/delete', { data: { id } });
}

/** 获取公开配置（无需登录） */
export function getPublicConfigApi() {
  return requestClient.get<ConfigApi.PublicConfigItem[]>('/config/public');
}
