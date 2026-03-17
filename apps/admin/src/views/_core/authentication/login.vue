<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import Verify from '#/components/verifition/Verify.vue';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: 'hidden',
      fieldName: 'captchaType',
      defaultValue: 'blockPuzzle',
    },
    {
      component: markRaw(Verify),
      // 2. 🌟 你需要的参数（Props 或事件）统一放到 componentProps 里
      componentProps: {
        captchaType: 'blockPuzzle',
      },
      label: '验证码',
      fieldName: 'captcha',
      rules: z.any().refine(
        (value) => {
          // value 就是 handleSuccess 传出来的 data
          // 只要 value 不是 null/undefined/空，就说明验证通过了
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
  <AuthenticationLogin :form-schema="formSchema" :loading="authStore.loginLoading" @submit="authStore.authLogin" />
</template>
