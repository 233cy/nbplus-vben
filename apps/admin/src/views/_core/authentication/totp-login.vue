<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { BizCode } from '#/api/error-codes';
import { useAuthStore } from '#/store';

defineOptions({ name: 'TotpLogin' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const username = ref((route.query.username as string) ?? '');
const CODE_LENGTH = 6;

const loginRef = useTemplateRef<InstanceType<typeof AuthenticationCodeLogin>>('loginRef');

const formSchema: VbenFormSchema[] = [
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: '请输入 Authenticator App 中的 6 位验证码',
      maxlength: CODE_LENGTH,
    },
    fieldName: 'totpCode',
    label: '动态验证码',
    rules: z.string().length(CODE_LENGTH, { message: `请输入 ${CODE_LENGTH} 位验证码` }),
  },
];

async function handleSubmit(values: Recordable<any>) {
  if (!username.value) {
    message.error('用户名丢失，请返回重新登录');
    router.push('/auth/login');
    return;
  }

  try {
    await authStore.authTotpLogin({
      username: username.value,
      totpCode: values.totpCode,
    });
  } catch (error: any) {
    if (error?.code === BizCode.SAFE_MFA_CODE_INVALID) {
      loginRef.value?.getFormApi()?.setValues({ totpCode: '' });
    }
  }
}
</script>

<template>
  <AuthenticationCodeLogin
    ref="loginRef"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    sub-title="请输入 Authenticator App 中显示的 6 位动态验证码"
    title="动态验证器验证 🔐"
    submit-button-text="确认验证"
    @submit="handleSubmit"
  />
</template>
