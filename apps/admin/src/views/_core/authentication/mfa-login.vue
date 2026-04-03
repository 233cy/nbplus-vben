<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import type { AuthApi } from '#/api/core/auth';

import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { getMfaChannelsApi, sendMfaCodeApi } from '#/api';
import { BizCode } from '#/api/error-codes';
import { useAuthStore } from '#/store';

defineOptions({ name: 'MfaLogin' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const username = ref((route.query.username as string) ?? '');
const channels = ref<string[]>([]);
const selectedChannel = ref('');
const CODE_LENGTH = 6;

const channelLabels: Record<string, string> = {
  email: '邮箱验证码',
  sms: '短信验证码',
};

const loginRef = useTemplateRef<InstanceType<typeof AuthenticationCodeLogin>>('loginRef');

watch(selectedChannel, () => {
  loginRef.value?.getFormApi()?.resetForm();
});

async function loadChannels() {
  try {
    const res = await getMfaChannelsApi(username.value);
    channels.value = (res.channels ?? []).filter((c) => c !== 'totp');
    if (channels.value.length > 0) {
      selectedChannel.value = channels.value[0] ?? '';
    }
  } catch {
    message.error('获取 MFA 渠道失败，请返回重新登录');
  }
}

async function beforeSend() {
  const formApi = loginRef.value?.getFormApi();
  if (formApi) {
    const result = await formApi.validateField('mfaTarget');
    if (result?.errors && Object.keys(result.errors).length > 0) {
      throw new Error('请先填写手机号或邮箱');
    }
  }
}

async function sendApi(captcha: AuthApi.CaptchaPayload) {
  const formApi = loginRef.value?.getFormApi();
  const values = formApi ? await formApi.getValues() : {};
  const mfaTarget = values.mfaTarget as string;
  const result = await sendMfaCodeApi({
    captcha,
    mfaChannel: selectedChannel.value,
    mfaTarget,
    username: username.value,
  });
  return result?.retryAfter ?? 0;
}

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: selectedChannel.value === 'sms' ? '请输入手机号' : '请输入邮箱地址',
      },
      fieldName: 'mfaTarget',
      label: selectedChannel.value === 'sms' ? '手机号' : '邮箱',
      rules: z.string().min(1, {
        message: selectedChannel.value === 'sms' ? '请输入手机号' : '请输入邮箱地址',
      }),
    },
    {
      component: 'CaptchaPinInput',
      componentProps: {
        codeLength: CODE_LENGTH,
        createText: (countdown: number) => (countdown > 0 ? `${countdown}s 后重新发送` : $t('authentication.sendCode')),
        beforeSend,
        sendApi,
      },
      fieldName: 'mfaCode',
      label: '验证码',
      rules: z.string().length(CODE_LENGTH, { message: `请输入 ${CODE_LENGTH} 位验证码` }),
    },
  ];
});

async function handleSubmit(values: Recordable<any>) {
  if (!username.value) {
    message.error('用户名丢失，请返回重新登录');
    router.push('/auth/login');
    return;
  }

  try {
    await authStore.authMfaLogin({
      mfaChannel: selectedChannel.value,
      mfaCode: values.mfaCode,
      username: username.value,
    });
  } catch (error: any) {
    if (error?.code === BizCode.SAFE_MFA_CODE_INVALID || error?.code === BizCode.SAFE_MFA_CODE_EXPIRED) {
      loginRef.value?.getFormApi()?.setValues({ mfaCode: '' });
    }
  }
}

onMounted(loadChannels);
</script>

<template>
  <AuthenticationCodeLogin
    ref="loginRef"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    sub-title="验证码将发送至您绑定的手机或邮箱"
    title="身份二次验证 🔐"
    submit-button-text="确认验证"
    @submit="handleSubmit"
  >
    <template v-if="channels.length > 1" #title>
      <div class="mb-2 font-semibold">身份二次验证 🔐</div>
      <div class="mb-4 flex gap-2">
        <button
          v-for="ch in channels"
          :key="ch"
          class="rounded-full border px-3 py-1 text-xs transition-colors"
          :class="[selectedChannel === ch ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground']"
          type="button"
          @click="selectedChannel = ch"
        >
          {{ channelLabels[ch] ?? ch }}
        </button>
      </div>
    </template>
  </AuthenticationCodeLogin>
</template>
