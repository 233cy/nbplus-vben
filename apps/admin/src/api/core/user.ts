import { requestClient } from '#/api/request';

export namespace UserApi {
  /** 后端返回的用户信息原始结构 */
  export interface UserInfoResult {
    avatar?: string;
    email?: string;
    id: string;
    nickname: string;
    permissions?: string[];
    phone?: string;
    roles?: string[];
    username: string;
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserApi.UserInfoResult>('/admin/auth/user-info');
}
