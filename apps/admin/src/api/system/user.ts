import { requestClient } from '#/api/request';

export namespace UserApi {
  export interface UserItem {
    id: string;
    username: string;
    status: boolean;
    nickname: string;
    avatar: string;
    email: string;
    phone: string;
    totpSecret: boolean;
    gender: number;
    deptId: number;
    positionId: number;
    lastLoginIp: string;
    lastLoginTime: string;
    createdAt: string;
  }

  export interface SaveParams {
    username: string;
    password: string;
    status?: boolean;
    nickname: string;
    avatar?: string;
    email?: string;
    phone?: string;
    totpSecret?: boolean;
    gender?: number;
    lastLoginIp?: string;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    username?: string;
    status?: boolean;
    nickname?: string;
    email?: string;
    phone?: string;
  }
}

export function getUserListApi(params: UserApi.PageParams) {
  return requestClient.get<{ items: UserApi.UserItem[]; meta: { total: number; currentPage: number; perPage: number } }>(
    '/admin/system/user/list',
    { params },
  );
}

export function createUserApi(data: UserApi.SaveParams) {
  return requestClient.post<UserApi.UserItem>('/admin/system/user/create', data);
}

export function updateUserApi(data: UserApi.SaveParams & { id: string }) {
  return requestClient.put<UserApi.UserItem>('/admin/system/user/update', data);
}

export function deleteUserApi(id: string) {
  return requestClient.delete('/admin/system/user/delete', { data: { id } });
}
