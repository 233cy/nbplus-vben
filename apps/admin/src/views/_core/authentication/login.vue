<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, markRaw, onMounted, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useDebounceFn } from '@vueuse/core';

import { checkLoginStatusApi } from '#/api';
import { BizCode } from '#/api/error-codes';
import Verify from '#/components/verifition/Verify.vue';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const router = useRouter();
const loginRef = useTemplateRef<InstanceType<typeof AuthenticationLogin>>('loginRef');

/** 是否需要展示人机验证组件 */
const showCaptcha = ref(false);
/** captchaCheck 请求进行中，禁用提交按钮防止用户在验证码出现前提交 */
const checkingStatus = ref(false);
/** 上次成功查询的用户名，相同时跳过重复请求 */
let lastCheckedUsername = '';

function resetCaptcha() {
  const formApi = loginRef.value?.getFormApi();
  formApi?.setFieldValue('captcha', null);
  const verifyRef = formApi?.getFieldComponentRef<InstanceType<typeof Verify>>('captcha');
  verifyRef?.clearVerifyVal();
}

async function doCheckLoginStatus(username: string) {
  if (!username || username === lastCheckedUsername) return;
  checkingStatus.value = true;
  try {
    const { action } = await checkLoginStatusApi(username);
    lastCheckedUsername = username;
    showCaptcha.value = action !== 'none';
    if (!showCaptcha.value) {
      resetCaptcha();
    }
  } catch {
    // 查询失败不影响登录流程
  } finally {
    checkingStatus.value = false;
  }
}

/** 用户名失焦后防抖查询，300ms 内只触发一次 */
const checkLoginStatus = useDebounceFn((username: string) => doCheckLoginStatus(username), 300);

async function onSubmit(params: Recordable<any>) {
  try {
    await authStore.authLogin(params);
  } catch (error: any) {
    const code = error?.data?.code ?? error?.response?.data?.code;
    if (code === BizCode.SAFE_MFA_REQUIRED) {
      router.push({ path: '/auth/mfa-login', query: { username: params.username } });
      return;
    }
    resetCaptcha();
  }
}

const formSchema = computed((): VbenFormSchema[] => {
  const schema: VbenFormSchema[] = [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
        onBlur: (e: FocusEvent) => {
          const username = (e.target as HTMLInputElement).value;
          checkLoginStatus(username);
        },
      },
      fieldName: 'username',
      defaultValue: 'admin',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      defaultValue: 'admin',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
  ];

  if (showCaptcha.value) {
    schema.push({
      component: markRaw(Verify),
      componentProps: {},
      label: $t('page.captcha.title') || '验证码',
      fieldName: 'captcha',
      rules: z.any().refine((value) => value !== null && value !== undefined && value !== '', { message: $t('page.captcha.required') || '请先完成安全验证' }),
    });
  }

  return schema;
});

// 页面挂载时用默认用户名立即查一次，处理有预填值的场景
onMounted(() => {
  doCheckLoginStatus('admin');
});
</script>

<template>
  <AuthenticationLogin ref="loginRef" :form-schema="formSchema" :loading="authStore.loginLoading || checkingStatus" @submit="onSubmit" />
</template>
