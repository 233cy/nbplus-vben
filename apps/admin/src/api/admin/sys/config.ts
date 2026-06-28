import { requestClient } from '#/api/request';

export namespace ConfigApi {
  export interface GroupItem {
    groups: string;
    groupsLabel: string;
  }

  export interface ConfigItem {
    id: string;
    groups: string;
    groupsLabel: string;
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
  return requestClient.get<ConfigApi.GroupItem[]>('/admin/sys/config/groups');
}

export function getConfigListApi(groups: string) {
  return requestClient.get<ConfigApi.ConfigItem[]>('/admin/sys/config/list', { params: { groups } });
}

export function saveConfigApi(items: ConfigApi.SaveItem[]) {
  return requestClient.post('/admin/sys/config/save', { items });
}

export function createConfigApi(data: ConfigApi.CreateParams) {
  return requestClient.post<ConfigApi.ConfigItem>('/admin/sys/config/create', data);
}

export function updateConfigApi(data: ConfigApi.UpdateParams) {
  return requestClient.put<ConfigApi.ConfigItem>('/admin/sys/config/update', data);
}

export function sortConfigApi(items: { id: string; sort: number }[]) {
  return requestClient.put('/admin/sys/config/sort', { items });
}

export function toggleConfigApi(id: string, field: 'isPublic' | 'isSys') {
  return requestClient.put<ConfigApi.ConfigItem>('/admin/sys/config/toggle', { id, field });
}

export function deleteConfigApi(id: string) {
  return requestClient.delete('/admin/sys/config/delete', { data: { id } });
}

/** 获取公开配置（无需登录） */
export function getPublicConfigApi() {
  return requestClient.get<ConfigApi.PublicConfigItem[]>('/config/public');
}
