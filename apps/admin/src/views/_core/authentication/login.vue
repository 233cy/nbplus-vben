<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, markRaw, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { BizCode } from '#/api/error-codes';
import Verify from '#/components/verifition/Verify.vue';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const router = useRouter();
const loginRef = useTemplateRef<InstanceType<typeof AuthenticationLogin>>('loginRef');

function resetCaptcha() {
  const formApi = loginRef.value?.getFormApi();
  formApi?.setFieldValue('captcha', null);
  const verifyRef = formApi?.getFieldComponentRef<InstanceType<typeof Verify>>('captcha');
  verifyRef?.clearVerifyVal();
}

async function onSubmit(params: Recordable<any>) {
  try {
    await authStore.authLogin(params);
  } catch (error: any) {
    if (error.code === BizCode.SAFE_MFA_REQUIRED) {
      router.push({ path: '/auth/mfa-login', query: { username: params.username } });
      return;
    }

    resetCaptcha();
  }
}

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
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
    {
      hide: true,
      component: 'input',
      fieldName: 'captchaType',
      defaultValue: 'blockPuzzle',
    },
    {
      component: markRaw(Verify),
      componentProps: {
        captchaType: 'blockPuzzle',
      },
      label: '验证码',
      fieldName: 'captcha',
      rules: z.any().refine(
        (value) => {
          return value !== null && value !== undefined && value !== '';
        },
        {
          message: $t('请先完成安全验证'),
        },
      ),
    },
  ];
});
</script>

<template>
  <AuthenticationLogin ref="loginRef" :form-schema="formSchema" :loading="authStore.loginLoading" @submit="onSubmit" />
</template>
