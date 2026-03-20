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
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (preferences.app.loginExpiredMode === 'modal' && accessStore.isAccessChecked) {
      accessStore.setLoginExpired(true);
    } else {
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
      if (isSystemDown) {
        // 如果系统已被标记为异常（如 500、401），直接拒绝后续请求，不再发送给后端
        throw new Error('系统异常或未认证，已拦截后续请求。');
      }

      const accessStore = useAccessStore();

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
      const response = error?.response;
      const status = response?.status;
      const responseData = response?.data ?? {};

      const businessMessage = responseData?.message || responseData?.error;
      const finalMsg = businessMessage || msg;

      // 1. 业务逻辑错误 (HTTP 200, 但 code != 0)：显示警告并 throw，让调用方 catch 到
      if (status === 200 && responseData.code !== 0) {
        showErrorMessage(finalMsg || '操作失败', 1500, 'warning');
        throw error;
      }

      // 2. 致命错误处理：401, 403, 500 等
      if (status >= 400) {
        isSystemDown = true;
        showErrorMessage(finalMsg || '服务器异常，请稍后再试');

        // 可以设置一个冷却时间，例如 5 秒后恢复请求机制，或者只允许在登录后重置状态
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
