import { requestClient } from '#/api/request';

export namespace UserApi {
  export interface UserItem {
    id: string;
    username: string;
    status: string;
    nickname: string;
    avatar: string;
    email: string;
    phone: string;
    totpSecret: string;
    gender: string;
    deptId: number;
    positionId: number;
    lastLoginIp: string;
    lastLoginTime: string;
    createdAt: number;
    onlineCount: number;
  }

  export interface OnlineDevice {
    tmpId: string;
    userId: string;
    ip: string;
    device: string;
    loginAt: number;
  }

  export interface SaveParams {
    username: string;
    password: string;
    status: string;
    nickname: string;
    avatar?: string;
    email?: string;
    phone?: string;
    gender?: string;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    username?: string;
    nickname?: string;
    email?: string;
    phone?: string;
    status?: string;
    gender?: string;
    lastLoginTime?: [string, string];
  }
}

const BASE = '/admin/system/user';

export function getUserListApi(params: UserApi.PageParams) {
  return requestClient.get<{ items: UserApi.UserItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/list`, { params });
}

export function getUserDetailApi(id: string) {
  return requestClient.get<UserApi.UserItem>(`${BASE}/detail`, { params: { id } });
}

export function createUserApi(data: UserApi.SaveParams) {
  return requestClient.post<UserApi.UserItem>(`${BASE}/create`, data);
}

export function updateUserApi(data: UserApi.SaveParams & { id: string }) {
  return requestClient.put<UserApi.UserItem>(`${BASE}/update`, data);
}

export function deleteUserApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}

export function batchDeleteUserApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

export function batchUpdateUserApi(ids: string[], fieldName: string, value: any) {
  return requestClient.put(`${BASE}/batch-update`, { ids, [fieldName]: value });
}

export function getUserOnlineApi(id: string) {
  return requestClient.get<UserApi.OnlineDevice[]>(`${BASE}/online`, { params: { id } });
}

export function kickUserDeviceApi(id: string, tmpId: string) {
  return requestClient.delete(`${BASE}/online-kick`, { data: { id, tmpId } });
}

export function kickAllUserDevicesApi(id: string) {
  return requestClient.delete(`${BASE}/online-kick-all`, { data: { id } });
}
