<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

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
const isTotpOnly = route.query.totp === '1'; // 从密码登录跳转过来的 TOTP 强制二步验证
const channels = ref<string[]>([]);
const selectedChannel = ref('');
const CODE_LENGTH = 6;

const channelLabels: Record<string, string> = {
  email: '邮箱验证码',
  sms: '短信验证码',
  totp: '动态口令 (TOTP)',
};

const isTotpChannel = computed(() => selectedChannel.value === 'totp');

const loginRef = useTemplateRef<InstanceType<typeof AuthenticationCodeLogin>>('loginRef');

// 切换渠道时重置表单，清除残留的校验状态
watch(selectedChannel, () => {
  loginRef.value?.getFormApi()?.resetForm();
});

async function loadChannels() {
  // TOTP 强制二步验证：直接锁定 totp 渠道，不需要查接口
  if (isTotpOnly) {
    channels.value = ['totp'];
    selectedChannel.value = 'totp';
    return;
  }

  try {
    const res = await getMfaChannelsApi(username.value);
    channels.value = res.channels ?? [];
    if (channels.value.length > 0) {
      selectedChannel.value = channels.value[0] ?? '';
    }
  } catch {
    message.error('获取 MFA 渠道失败，请返回重新登录');
  }
}

async function handleSendCode() {
  const formApi = loginRef.value?.getFormApi();
  const values = formApi ? await formApi.getValues() : {};
  const mfaTarget = values.mfaTarget as string | undefined;

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

  if (!isTotpChannel.value) {
    schema.push({
      component: 'VbenInput',
      componentProps: {
        placeholder: selectedChannel.value === 'sms' ? '请输入手机号' : '请输入邮箱地址',
      },
      fieldName: 'mfaTarget',
      label: selectedChannel.value === 'sms' ? '手机号' : '邮箱',
      rules: z.string().min(1, {
        message: selectedChannel.value === 'sms' ? '请输入手机号' : '请输入邮箱地址',
      }),
    });
  }

  if (isTotpChannel.value) {
    // TOTP：普通输入框，无发送按钮
    schema.push({
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入 Authenticator App 中的 6 位验证码',
        maxlength: CODE_LENGTH,
      },
      fieldName: 'mfaCode',
      label: '验证码',
      rules: z.string().length(CODE_LENGTH, { message: `请输入 ${CODE_LENGTH} 位验证码` }),
    });
  } else {
    // 短信/邮箱：带发送按钮的 PinInput
    schema.push({
      component: 'VbenPinInput',
      componentProps: {
        codeLength: CODE_LENGTH,
        createText: (countdown: number) => (countdown > 0 ? `${countdown}s 后重新发送` : $t('authentication.sendCode')),
        handleSendCode,
        placeholder: $t('authentication.code'),
      },
      fieldName: 'mfaCode',
      label: '验证码',
      rules: z.string().length(CODE_LENGTH, { message: `请输入 ${CODE_LENGTH} 位验证码` }),
    });
  }

  return schema;
});

async function handleSubmit(values: Recordable<any>) {
  if (!username.value) {
    message.error('用户名丢失，请返回重新登录');
    router.push('/auth/login');
    return;
  }

  // request.ts 已托管通用错误提示，catch 只处理需要特殊 UI 响应的业务码
  // error 直接是后端响应体 { code, message, data, ... }，不是 axios 原始 error
  try {
    await authStore.authMfaLogin({
      mfaChannel: selectedChannel.value,
      mfaCode: values.mfaCode,
      username: username.value,
    });
  } catch (error: any) {
    if (error?.code === BizCode.SAFE_MFA_CODE_INVALID) {
      // 验证码错误时清空输入框，方便用户重新输入
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
    :sub-title="isTotpChannel ? '请输入 Authenticator App 中显示的 6 位动态验证码' : '验证码将发送至您绑定的手机或邮箱'"
    :title="isTotpOnly ? '动态验证器验证 🔐' : '身份二次验证 🔐'"
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
