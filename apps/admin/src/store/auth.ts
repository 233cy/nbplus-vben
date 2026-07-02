import type { Recordable, UserInfo } from '@vben/types';

import type { AuthApi, ProfileApi } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { codeLoginApi, getAccessCodesApi, getProfileInfoApi, loginApi, logoutApi, mfaLoginApi, totpLoginApi } from '#/api';
import { resolveLogicalPath } from '#/api/core/upload';
import { $t } from '#/locales';
import { useAdminUserStore } from '#/store';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 普通登录
   * 若后端返回 SAFE_MFA_REQUIRED，抛出错误由调用方（login.vue）处理跳转
   */
  async function authLogin(params: AuthApi.LoginParams, onSuccess?: () => Promise<void> | void) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await loginApi(params);

      if (accessToken) {
        userInfo = await afterLoginSuccess(accessToken, onSuccess);
      }
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  /**
   * 验证码直接登录（短信 / 邮箱）
   */
  async function authCodeLogin(params: { code: string; codeChannel: 'email' | 'sms'; codeTarget: string }, onSuccess?: () => Promise<void> | void) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await codeLoginApi(params);
      if (accessToken) {
        userInfo = await afterLoginSuccess(accessToken, onSuccess);
      }
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  /**
   * TOTP 主动二步验证登录
   */
  async function authTotpLogin(params: { totpCode: string; username: string }, onSuccess?: () => Promise<void> | void) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await totpLoginApi(params);
      if (accessToken) {
        userInfo = await afterLoginSuccess(accessToken, onSuccess);
      }
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  /**
   * MFA 防爆二次验证登录
   */
  async function authMfaLogin(params: Recordable<any>, onSuccess?: () => Promise<void> | void) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await mfaLoginApi({
        mfaChannel: params.mfaChannel,
        mfaCode: params.mfaCode,
        username: params.username,
      });

      if (accessToken) {
        userInfo = await afterLoginSuccess(accessToken, onSuccess);
      }
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  /**
   * 登录成功后的公共处理：存 token、拉用户信息、跳转
   */
  async function afterLoginSuccess(accessToken: string, onSuccess?: () => Promise<void> | void) {
    accessStore.setAccessToken(accessToken);

    const userInfo = await fetchUserInfo();
    userStore.setUserInfo(userInfo);

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else {
      onSuccess ? await onSuccess() : await router.push(userInfo.homePath || preferences.app.defaultHomePath);
    }

    if (userInfo?.realName) {
      notification.success({
        description: `${$t('core.authentication.loginSuccessDesc')}:${userInfo.realName}`,
        duration: 3,
        message: $t('core.authentication.loginSuccess'),
      });
    }

    return userInfo;
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect ? { redirect: encodeURIComponent(router.currentRoute.value.fullPath) } : {},
    });
  }

  async function fetchUserInfo(useResult: ProfileApi.ProfileInfo = null as any) {
    let result: ProfileApi.ProfileInfo = {} as any;
    result = useResult === null ? await getProfileInfoApi() : useResult;
    const adminUserStore = useAdminUserStore();

    // 框架所需字段映射
    const userInfo: UserInfo = {
      avatar: await resolveLogicalPath(result.avatar),
      desc: '',
      homePath: preferences.app.defaultHomePath,
      realName: result.nickname,
      roles: result.roles ?? [],
      token: '',
      userId: result.id,
      username: result.username,
    };
    userStore.setUserInfo(userInfo);

    // 业务扩展字段
    adminUserStore.setAdminUserInfo({
      email: result.email,
      permissions: result.permissions,
      phone: result.phone,
    });

    // 将 permissions 作为 accessCodes 注入框架权限系统
    const accessCodes = await getAccessCodesApi();
    accessStore.setAccessCodes(accessCodes);

    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    afterLoginSuccess,
    authCodeLogin,
    authLogin,
    authMfaLogin,
    authTotpLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept();
}

export { BizCode } from '#/api/error-codes';
