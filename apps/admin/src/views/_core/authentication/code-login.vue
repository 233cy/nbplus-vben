<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, ref, useTemplateRef } from 'vue';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { sendLoginCodeApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'CodeLogin' });

const authStore = useAuthStore();
const loginRef = useTemplateRef<InstanceType<typeof AuthenticationCodeLogin>>('loginRef');

type Channel = 'email' | 'sms';
const selectedChannel = ref<Channel>('sms');
const CODE_LENGTH = 6;

const channelLabels: Record<Channel, string> = {
  email: $t('core.authentication.codeLogin.emailChannel'),
  sms: $t('core.authentication.codeLogin.smsChannel'),
};

const channelIcons: Record<Channel, string> = {
  sms: 'ant-design:mobile-outlined',
  email: 'ant-design:mail-outlined',
};

async function beforeSend() {
  const formApi = loginRef.value?.getFormApi();
  if (formApi) {
    const result = await formApi.validateField('codeTarget');
    if (result?.errors && Object.keys(result.errors).length > 0) {
      throw new Error($t('core.authentication.codeLogin.targetRequired'));
    }
  }
}

async function sendApi(captcha: any) {
  const formApi = loginRef.value?.getFormApi();
  const values = formApi ? await formApi.getValues() : {};
  const codeTarget = values.codeTarget as string;
  const result = await sendLoginCodeApi({ codeChannel: selectedChannel.value, codeTarget, captcha });
  return result?.retryAfter ?? 0;
}

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'Input',
    componentProps: {
      placeholder: selectedChannel.value === 'sms' ? $t('core.authentication.codeLogin.phonePlaceholder') : $t('core.authentication.codeLogin.emailPlaceholder'),
    },
    fieldName: 'codeTarget',
    defaultValue: '18700842199',
    label: selectedChannel.value === 'sms' ? $t('core.authentication.codeLogin.phone') : $t('core.authentication.codeLogin.email'),
    rules:
      selectedChannel.value === 'sms'
        ? z.string().regex(/^1[3-9]\d{9}$/, { message: $t('core.authentication.codeLogin.invalidPhone') })
        : z.string().email({ message: $t('core.authentication.codeLogin.invalidEmail') }),
  },
  {
    component: 'CaptchaPinInput',
    componentProps: {
      codeLength: CODE_LENGTH,
      createText: (countdown: number) => (countdown > 0 ? $t('core.authentication.sendText', [countdown]) : $t('core.authentication.sendCode')),
      beforeSend,
      sendApi,
    },
    fieldName: 'code',
    label: $t('core.authentication.code'),
    rules: z.string().length(CODE_LENGTH, {
      message: $t('core.authentication.codeTip', [CODE_LENGTH]),
    }),
  },
]);

async function handleSubmit(values: Recordable<any>) {
  await authStore.authCodeLogin({
    code: values.code,
    codeChannel: selectedChannel.value,
    codeTarget: values.codeTarget,
  });
}
</script>

<template>
  <AuthenticationCodeLogin ref="loginRef" :form-schema="formSchema" sub-title="通过你绑定的邮箱/手机号快捷登录" :loading="authStore.loginLoading" @submit="handleSubmit">
    <template #title>
      <div class="mb-2 text-xl font-semibold">{{ $t('core.authentication.codeLogin.title') }}</div>
      <div class="mb-4 flex gap-2">
        <button
          v-for="(label, ch) in channelLabels"
          :key="ch"
          class="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors"
          :class="[selectedChannel === ch ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground']"
          type="button"
          @click="selectedChannel = ch"
        >
          <IconifyIcon :icon="channelIcons[ch]" />
          {{ label }}
        </button>
      </div>
    </template>
  </AuthenticationCodeLogin>
</template>
