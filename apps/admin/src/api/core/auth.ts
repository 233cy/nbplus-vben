import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录参数 */
  export interface LoginParams {
    captcha?: string;
    captchaType?: string;
    password?: string;
    username?: string;
  }

  /** 登录成功返回 */
  export interface LoginResult {
    accessToken: string;
  }

  /** 验证码登录参数 */
  export interface CodeSendParams {
    captcha: string;
    codeChannel: 'email' | 'sms';
    codeTarget: string;
  }

  export interface CodeLoginParams {
    code: string;
    codeChannel: 'email' | 'sms';
    codeTarget: string;
  }

  /** MFA 渠道列表 */
  export interface MfaChannelsResult {
    channels: string[];
  }

  /** MFA 发送验证码参数 */
  export interface MfaSendParams {
    mfaChannel: string;
    mfaTarget: string;
    username: string;
  }

  /** MFA 登录参数 */
  export interface MfaLoginParams {
    mfaChannel: string;
    mfaCode: string;
    username: string;
  }

  /** Token 刷新结果 */
  export interface RefreshTokenResult {
    accessToken: string;
  }

  /** 是否需要验证码 */
  export interface CaptchaCheckResult {
    captchaRequired: boolean;
  }

  /** 找回密码 - 发送验证码 */
  export interface PasswordResetSendParams {
    captcha: string;
    channel: 'email' | 'sms';
    target: string;
  }

  /** 找回密码 - 校验验证码 */
  export interface PasswordResetVerifyParams {
    channel: 'email' | 'sms';
    code: string;
    target: string;
  }

  export interface PasswordResetVerifyResult {
    resetToken: string;
  }

  /** 找回密码 - 提交新密码 */
  export interface PasswordResetSubmitParams {
    confirmPassword: string;
    newPassword: string;
    resetToken: string;
  }
}

/** 发送登录验证码 */
export async function sendLoginCodeApi(data: AuthApi.CodeSendParams) {
  return requestClient.post('/admin/auth/code/send', data);
}

/** 验证码直接登录 */
export async function codeLoginApi(data: AuthApi.CodeLoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/admin/auth/code/login', data);
}

/** 普通登录 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/admin/auth/login', data);
}

/** 查询当前登录是否需要验证码 */
export async function checkCaptchaRequiredApi(username: string) {
  return requestClient.post<AuthApi.CaptchaCheckResult>('/admin/auth/captcha/check', { username });
}

/** 获取可用 MFA 渠道 */
export async function getMfaChannelsApi() {
  return requestClient.get<AuthApi.MfaChannelsResult>('/admin/auth/mfa/channels');
}

/** 发送 MFA 验证码 */
export async function sendMfaCodeApi(data: AuthApi.MfaSendParams) {
  return requestClient.post('/admin/auth/mfa/send', data);
}

/** MFA 二次验证登录 */
export async function mfaLoginApi(data: AuthApi.MfaLoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/admin/auth/mfa/login', data);
}

/** 退出登录 */
export async function logoutApi() {
  return requestClient.post('/admin/auth/logout');
}

/** 刷新 Token */
export async function refreshTokenApi() {
  return requestClient.post<AuthApi.RefreshTokenResult>('/admin/auth/refresh');
}

/** 获取用户权限码（从 user-info 的 permissions 字段来，此接口作为兼容保留） */
export async function getAccessCodesApi(): Promise<string[]> {
  return [];
}

/** 找回密码 - 发送重置验证码 */
export async function sendPasswordResetCodeApi(data: AuthApi.PasswordResetSendParams) {
  return requestClient.post('/admin/password/reset/send', data);
}

/** 找回密码 - 校验重置验证码 */
export async function verifyPasswordResetCodeApi(data: AuthApi.PasswordResetVerifyParams) {
  return requestClient.post<AuthApi.PasswordResetVerifyResult>('/admin/password/reset/verify', data);
}

/** 找回密码 - 提交新密码 */
export async function submitPasswordResetApi(data: AuthApi.PasswordResetSubmitParams) {
  return requestClient.post('/admin/password/reset/submit', data);
}
