import { requestClient } from '#/api/request';

export namespace captchaApi {
  /** 一次验证 (检查验证码). */
  export interface reqCheck {
    captchaType: string;
    token: string;
    pointJson: string;
  }
}

// 获取验证码
export function reqGet() {
  return requestClient.post(`/captcha/get`);
}

// 一次验证 (检查验证码).
export function reqCheck(data: captchaApi.reqCheck) {
  return requestClient.post(`/captcha/check`, data);
}
