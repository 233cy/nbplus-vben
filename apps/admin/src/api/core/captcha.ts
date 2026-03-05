import { requestClient } from '#/api/request';
export namespace captchaApi {
  /** 获取验证码 */
  export interface reqGet {
    captchaType?: string;
  }

  /** 一次验证 (检查验证码). */
  export interface reqCheck {
    captchaType: string;
    token: string;
    pointJson: string;
  }
}

// 获取验证码
export function reqGet(data: captchaApi.reqGet) {
  return requestClient.post(`${import.meta.env.NBPLUS_API_URL}/captcha/get`, data);
}

// 一次验证 (检查验证码).
export function reqCheck(data: captchaApi.reqCheck) {
  return requestClient.post(`${import.meta.env.NBPLUS_API_URL}/captcha/check`, data);
}
