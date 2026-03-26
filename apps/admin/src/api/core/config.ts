import { requestClient } from '#/api/request';

export namespace ConfigApi {
  export interface GroupItem {
    group: string;
    groupLabel: string;
  }

  export interface ConfigItem {
    id: string;
    group: string;
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
    group: string;
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
    group?: string;
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

/** 获取所有配置分组（含 groupLabel） */
export function getConfigGroupsApi() {
  return requestClient.get<ConfigApi.GroupItem[]>('/admin/config/groups');
}

/** 按分组获取配置列表 */
export function getConfigListApi(group: string) {
  return requestClient.get<ConfigApi.ConfigItem[]>('/admin/config/list', {
    params: { group },
  });
}

/** 批量保存配置值 */
export function saveConfigApi(items: ConfigApi.SaveItem[]) {
  return requestClient.post('/admin/config/save', { items });
}

/** 新增配置项 */
export function createConfigApi(data: ConfigApi.CreateParams) {
  return requestClient.post<ConfigApi.ConfigItem>('/admin/config/create', data);
}

/** 更新配置项 */
export function updateConfigApi(data: ConfigApi.UpdateParams) {
  return requestClient.put<ConfigApi.ConfigItem>('/admin/config/update', data);
}

/** 批量更新排序 */
export function reorderConfigApi(items: { id: string; sort: number }[]) {
  return requestClient.put('/admin/config/reorder', { items });
}

/** 切换单个布尔字段（isSys / isPublic） */
export function toggleConfigApi(id: string, field: 'isPublic' | 'isSys') {
  return requestClient.put<ConfigApi.ConfigItem>('/admin/config/toggle', { id, field });
}

/** 删除配置项 */
export function deleteConfigApi(id: string) {
  return requestClient.delete('/admin/config/delete', { data: { id } });
}

/** 获取公开配置（无需登录） */
export function getPublicConfigApi() {
  return requestClient.get<ConfigApi.PublicConfigItem[]>('/config/public');
}
