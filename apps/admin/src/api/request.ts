/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import { authenticateResponseInterceptor, defaultResponseInterceptor, errorMessageResponseInterceptor, RequestClient } from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // 全局系统状态：用于在发生严重错误时中断后续请求
  let isSystemDown = false;

  // 节流的错误提示函数：1.5 秒内只显示一次，避免弹窗堆叠
  const showErrorMessage = (() => {
    let lastTime = 0;
    return (msg: string, delay = 1500, type: 'error' | 'warning' = 'error') => {
      const now = Date.now();
      if (now - lastTime > delay) {
        message[type](msg);
        lastTime = now;
      }
    };
  })();

  /**
   * 重新认证逻辑
   * 已登录状态下 token 失效 → 弹窗重登录，不跳转登录页
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired.');
    const accessStore = useAccessStore();
    // isAccessChecked=true 说明用户已完成登录并进入后台，此时弹窗而非跳转
    if (accessStore.isAccessChecked) {
      // 先设 loginExpired，守卫检测到此标志会阻止跳转
      accessStore.setLoginExpired(true);
      accessStore.setAccessToken(null);
    } else {
      // 未完成初始化（如刷新页面时 token 已失效），直接走登出跳转
      const authStore = useAuthStore();
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.accessToken;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      if (isSystemDown && !accessStore.loginExpired) {
        // 如果系统已被标记为异常（如 500），直接拒绝后续请求
        // 登录过期弹窗模式下不拦截，允许重新登录的请求通过
        throw new Error('系统异常，已拦截后续请求（请稍后重试）。');
      }

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // responseReturn: 'data' 模式下 error 是解包后的响应体，需从原始 axios error 取 status
      const status: number | undefined = error?.response?.status ?? error?.[Symbol.for('axios-error')]?.response?.status;

      const response = error?.response;
      const responseData = response?.data ?? error ?? {};

      const businessMessage = responseData?.message || responseData?.error;
      const finalMsg = businessMessage || msg;

      // 1. 业务逻辑错误 (HTTP 200, 但 code != 0)：显示警告并 throw，让调用方 catch 到
      if (status === 200 && responseData.code !== 0) {
        showErrorMessage(finalMsg || '操作失败', 1500, 'warning');
      }

      // 2. HTTP 错误分类处理
      // 401 由 authenticateResponseInterceptor 接管，此处跳过
      if (status === 401) {
        return;
      }

      // 4xx：业务/安全类错误，后端消息有意义，弹 warning，不影响后续请求
      if (status !== undefined && status >= 400 && status < 500) {
        showErrorMessage(finalMsg || '请求失败，请稍后再试', 1500, 'warning');
        return;
      }

      // 5xx：系统故障，标记 isSystemDown，5 秒内拦截后续请求防止雪崩
      if (status !== undefined && status >= 500) {
        isSystemDown = true;
        showErrorMessage(finalMsg || '服务器异常，请稍后再试');
        setTimeout(() => {
          isSystemDown = false;
        }, 5000);
        return;
      }

      // 3. 其他 HTTP 错误兜底提示
      showErrorMessage(finalMsg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
