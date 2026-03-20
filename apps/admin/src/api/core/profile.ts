import { requestClient } from '#/api/request';

export namespace ProfileApi {
  export interface ProfileInfo {
    nickname: string;
    avatar: string;
    email: string;
    phone: string;
    gender: number; // 0=未知 1=男 2=女
    lastLoginIp: string;
    lastLoginTime: string;
  }

  export interface UpdateProfileParams {
    nickname: string;
    avatar?: string;
    email?: string;
    phone?: string;
    gender?: number;
  }

  export interface ChangePasswordParams {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }
}

export async function getProfileInfoApi() {
  return requestClient.get<ProfileApi.ProfileInfo>('/admin/profile/info');
}

export async function updateProfileApi(data: ProfileApi.UpdateProfileParams) {
  return requestClient.post<ProfileApi.ProfileInfo>('/admin/profile/update', data);
}

export async function changePasswordApi(data: ProfileApi.ChangePasswordParams) {
  return requestClient.post('/admin/profile/change-password', data);
}
