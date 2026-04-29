import { requestClient } from '#/api/request';

export namespace ProfileApi {
  export interface ProfileInfo {
    nickname: string;
    avatar: string; // logicalPath，存库用
    email: string;
    phone: string;
    gender: number; // 0=未知 1=男 2=女
    totpEnabled: boolean;
    lastLoginIp: string;
    lastLoginTime: string;
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
      deviceType?: string;
      deviceBrand?: string;
      deviceModel?: string;
      os?: string;
      browser?: string;
    };
  }
}

export async function getProfileInfoApi() {
  return requestClient.get<ProfileApi.ProfileInfo>('/admin/profile/info');
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
