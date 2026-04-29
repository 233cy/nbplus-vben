import { requestClient } from '#/api/request';
import { useAuthStore } from '#/store/auth';

export namespace ProfileApi {
  export interface ProfileInfo {
    username: string;
    id: string;
    nickname: string;
    avatar: string; // logicalPath，存库用
    email: string;
    phone: string;
    gender: number; // 0=未知 1=男 2=女
    totpEnabled: boolean;
    permissions?: string[];
    lastLoginIp: string;
    lastLoginTime: string;
    roles?: string[];
  }

  export interface UpdateProfileResult {
    nickname: string;
    avatar: string; // logicalPath
    gender: number;
    totpEnabled: boolean;
  }

  export interface UpdateProfileParams {
    nickname: string;
    avatar?: string;
    gender?: number;
  }

  export interface ChangePasswordParams {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }

  export interface BindContactParams {
    channel: 'email' | 'sms';
    target: string;
    code: string;
  }

  export interface UnbindContactParams {
    channel: 'email' | 'sms';
    code: string;
  }

  export interface TotpGenerateResult {
    secret: string;
    qrCodeSvg: string;
    otpauthUrl: string;
  }

  export interface TotpBindParams {
    totpSecret: string;
    totpCode: string;
  }

  export interface TotpUnbindParams {
    totpCode: string;
  }

  export interface OnlineDevice {
    tmpId: string;
    userId: string;
    ip: string;
    loginAt: number;
    isCurrent?: boolean;
    deviceInfo?: {
      browser?: string;
      deviceBrand?: string;
      deviceModel?: string;
      deviceType?: string;
      os?: string;
    };
  }
}

export async function getProfileInfoApi() {
  // 1. 发起请求获取用户信息
  const profileInfo = await requestClient.get<ProfileApi.ProfileInfo>('/admin/profile/info');

  // 2. 拿到数据后，扔给 store 去处理更新
  // 如果 fetchUserInfo 本身是异步的且你需要等它更新完，可以加 await；如果不需要等，去掉 await 即可
  await useAuthStore().fetchUserInfo(profileInfo);

  // 3. 将数据原封不动返回出去
  // 这样外部调用 getProfileInfoApi().then(res => ...) 就能完美接住 profileInfo
  return profileInfo;
}

export async function updateProfileApi(data: ProfileApi.UpdateProfileParams) {
  return requestClient.post<ProfileApi.UpdateProfileResult>('/admin/profile/update', data);
}

export async function changePasswordApi(data: ProfileApi.ChangePasswordParams) {
  return requestClient.post('/admin/profile/change-password', data);
}

export async function bindContactApi(data: ProfileApi.BindContactParams) {
  return requestClient.post<ProfileApi.ProfileInfo>('/admin/profile/bind-contact', data);
}

export async function unbindContactApi(data: ProfileApi.UnbindContactParams) {
  return requestClient.post<ProfileApi.ProfileInfo>('/admin/profile/unbind-contact', data);
}

export async function sendContactCodeApi(data: { captcha: { token: string; type: string }; channel: 'email' | 'sms'; target: string }) {
  return requestClient.post('/admin/profile/send-code', data);
}

export async function totpGenerateApi() {
  return requestClient.post<ProfileApi.TotpGenerateResult>('/admin/profile/totp/generate');
}

export async function totpBindApi(data: ProfileApi.TotpBindParams) {
  return requestClient.post<ProfileApi.ProfileInfo>('/admin/profile/totp/bind', data);
}

export async function totpUnbindApi(data: ProfileApi.TotpUnbindParams) {
  return requestClient.post<ProfileApi.ProfileInfo>('/admin/profile/totp/unbind', data);
}

export async function getMyDevicesApi() {
  return requestClient.get<ProfileApi.OnlineDevice[]>('/admin/profile/online');
}

export async function removeMyDeviceApi(tmpId: string) {
  return requestClient.delete('/admin/profile/online', { data: { tmpId } });
}
