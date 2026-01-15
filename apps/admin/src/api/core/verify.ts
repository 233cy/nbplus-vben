import { requestClient } from '#/api/request';

const API_BASE = 'http://10.8.0.4:2330';
// 获取验证图片  以及token
export function reqGet(data: any) {
  return requestClient.post(`${API_BASE}/captcha/get`, data);
}

// 滑动或者点选验证
export function reqCheck(data: any) {
  return requestClient.post(`${API_BASE}/captcha/check`, data);
}
