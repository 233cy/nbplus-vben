<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, ref, useTemplateRef } from 'vue';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { sendLoginCodeApi } from '#/api';
import Verify from '#/components/verifition/Verify.vue';
import { useAuthStore } from '#/store';

defineOptions({ name: 'CodeLogin' });

const authStore = useAuthStore();
const loginRef = useTemplateRef<InstanceType<typeof AuthenticationCodeLogin>>('loginRef');
const verifyRef = useTemplateRef<InstanceType<typeof Verify>>('verifyRef');

type Channel = 'email' | 'sms';
const selectedChannel = ref<Channel>('sms');
const CODE_LENGTH = 6;

const channelLabels: Record<Channel, string> = {
  email: $t('page.auth.codeLogin.emailChannel'),
  sms: $t('page.auth.codeLogin.smsChannel'),
};

const channelIcons: Record<Channel, string> = {
  sms: 'ant-design:mobile-outlined',
  email: 'ant-design:mail-outlined',
};

// 等待人机验证结果的 Promise 控制器
let captchaResolve: ((token: string) => void) | null = null;

function onCaptchaSuccess(data: any) {
  const resolve = captchaResolve;
  captchaResolve = null;
  verifyRef.value?.closeBox();
  resolve?.(data.captchaVerification as string);
}

// VbenPinInput 的 handleSendCode：resolve 后倒计时启动，throw 则不启动
async function handleSendCode() {
  const formApi = loginRef.value?.getFormApi();

  if (formApi) {
    const result = await formApi.validateField('codeTarget');
    if (result?.errors && Object.keys(result.errors).length > 0) {
      throw new Error($t('page.auth.codeLogin.targetRequired'));
    }
  }

  const values = formApi ? await formApi.getValues() : {};
  const codeTarget = values.codeTarget as string | undefined;
  if (!codeTarget) throw new Error($t('page.auth.codeLogin.targetRequired'));

  verifyRef.value?.show();
  const captcha = await new Promise<string>((resolve) => {
    captchaResolve = resolve;
  });

  await sendLoginCodeApi({ codeChannel: selectedChannel.value, codeTarget, captcha });
  message.success($t('page.auth.codeLogin.codeSent'));
}

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'Input',
    componentProps: {
      placeholder: selectedChannel.value === 'sms' ? $t('page.auth.codeLogin.phonePlaceholder') : $t('page.auth.codeLogin.emailPlaceholder'),
    },
    fieldName: 'codeTarget',
    defaultValue: '18700842199',
    label: selectedChannel.value === 'sms' ? $t('page.auth.codeLogin.phone') : $t('page.auth.codeLogin.email'),
    rules:
      selectedChannel.value === 'sms'
        ? z.string().regex(/^1[3-9]\d{9}$/, { message: $t('page.auth.codeLogin.invalidPhone') })
        : z.string().email({ message: $t('page.auth.codeLogin.invalidEmail') }),
  },
  {
    component: 'VbenPinInput',
    componentProps: {
      codeLength: CODE_LENGTH,
      createText: (countdown: number) => (countdown > 0 ? $t('authentication.sendText', [countdown]) : $t('authentication.sendCode')),
      handleSendCode,
      placeholder: $t('authentication.code'),
    },
    fieldName: 'code',
    label: $t('authentication.code'),
    rules: z.string().length(CODE_LENGTH, {
      message: $t('authentication.codeTip', [CODE_LENGTH]),
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
      <div class="mb-2 text-xl font-semibold">{{ $t('page.auth.codeLogin.title') }}</div>
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
      <!-- 人机验证弹窗，通过 ref 手动触发，无触发器 UI -->
      <Verify ref="verifyRef" captcha-type="blockPuzzle" mode="pop" @success="onCaptchaSuccess">
        <template #trigger></template>
      </Verify>
    </template>
  </AuthenticationCodeLogin>
</template>
