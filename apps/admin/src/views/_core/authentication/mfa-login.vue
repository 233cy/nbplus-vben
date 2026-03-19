<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, onMounted, ref, useTemplateRef } from 'vue';
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

/** 渠道友好名称映射 */
const channelLabels: Record<string, string> = {
  email: '邮箱验证码',
  sms: '短信验证码',
  totp: '动态口令 (TOTP)',
};

/** TOTP 渠道不需要发送，用户自行从 App 获取 */
const isTotpChannel = computed(() => selectedChannel.value === 'totp');

async function loadChannels() {
  try {
    const res = await getMfaChannelsApi();
    channels.value = res.channels ?? [];
    if (channels.value.length > 0) {
      selectedChannel.value = channels.value[0] ?? '';
    }
  } catch {
    message.error('获取 MFA 渠道失败，请返回重新登录');
  }
}

const loginRef = useTemplateRef<InstanceType<typeof AuthenticationCodeLogin>>('loginRef');

/** 发送验证码（由 VbenPinInput 的 handleSendCode 调用） */
async function handleSendCode() {
  const formApi = loginRef.value?.getFormApi();
  const values = formApi ? await formApi.getValues() : {};
  const mfaTarget = values.mfa_target as string | undefined;

  if (!mfaTarget) {
    throw new Error('请先填写手机号或邮箱');
  }

  await sendMfaCodeApi({
    mfaChannel: selectedChannel.value,
    mfaTarget,
    username: username.value,
  });

  message.success('验证码已发送');
}

const formSchema = computed((): VbenFormSchema[] => {
  const schema: VbenFormSchema[] = [];

  // 非 TOTP 渠道需要填写接收目标
  if (!isTotpChannel.value) {
    schema.push({
      component: 'VbenInput',
      componentProps: {
        placeholder: selectedChannel.value === 'sms' ? '请输入手机号' : '请输入邮箱地址',
      },
      fieldName: 'mfa_target',
      label: selectedChannel.value === 'sms' ? '手机号' : '邮箱',
      rules: z.string().min(1, { message: '请填写接收目标' }),
    });
  }

  schema.push({
    component: 'VbenPinInput',
    componentProps: {
      codeLength: CODE_LENGTH,
      createText: (countdown: number) => (countdown > 0 ? `${countdown}s 后重新发送` : $t('authentication.sendCode')),
      handleSendCode: isTotpChannel.value ? undefined : handleSendCode,
      placeholder: isTotpChannel.value ? '请输入 Authenticator App 中的验证码' : $t('authentication.code'),
    },
    fieldName: 'mfa_code',
    label: '验证码',
    rules: z.string().length(CODE_LENGTH, {
      message: `请输入 ${CODE_LENGTH} 位验证码`,
    }),
  });

  return schema;
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
      mfaCode: values.mfa_code,
      username: username.value,
    });
  } catch (error: any) {
    const code = error?.code ?? error?.data?.code;
    if (code === BizCode.SAFE_MFA_CODE_INVALID) {
      message.error(error?.data?.message || '验证码无效或已过期，请重新获取');
    } else if (code === BizCode.SAFE_LOGIN_THROTTLE) {
      message.error(error?.data?.message || '操作过于频繁，请稍后再试');
    } else {
      message.error(error?.data?.message || '验证失败，请重试');
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
    :sub-title="isTotpChannel ? '请输入 Authenticator App 中显示的 6 位动态验证码' : '验证码将发送至您绑定的手机或邮箱'"
    title="身份二次验证 🔐"
    submit-button-text="确认验证"
    @submit="handleSubmit"
  >
    <!-- 多渠道切换 Tab -->
    <template v-if="channels.length > 1" #title>
      <div class="mb-2 text-xl font-semibold">身份二次验证 🔐</div>
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
