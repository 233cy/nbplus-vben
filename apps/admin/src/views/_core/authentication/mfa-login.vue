<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { getMfaChannelsApi, sendMfaCodeApi } from '#/api';
import { BizCode } from '#/api/error-codes';
import { useAuthStore } from '#/store';

defineOptions({ name: 'MfaLogin' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 从路由 query 中取登录时传过来的用户名
const username = ref((route.query.username as string) ?? '');
const channels = ref<string[]>([]);
const selectedChannel = ref('');
const mfaTarget = ref('');
const mfaCode = ref('');
const codeSent = ref(false);
const sending = ref(false);

async function loadChannels() {
  try {
    const res = await getMfaChannelsApi();
    channels.value = res.channels;
    if (res.channels.length > 0) {
      selectedChannel.value = res.channels[0] ?? '';
    }
  } catch {
    message.error('获取 MFA 渠道失败');
  }
}

async function sendCode() {
  if (!mfaTarget.value) {
    message.warning('请输入验证目标（手机号或邮箱）');
    return;
  }
  sending.value = true;
  try {
    await sendMfaCodeApi({
      mfa_channel: selectedChannel.value,
      mfa_target: mfaTarget.value,
      username: username.value,
    });
    codeSent.value = true;
    message.success('验证码已发送');
  } catch (error: any) {
    const bizCode = String(error?.data?.code ?? '') as unknown as BizCode;
    if (bizCode === BizCode.SAFE_MFA_CHANNEL_OFF) {
      message.error('该验证渠道未开启');
    } else {
      message.error(error?.data?.message || '发送失败，请重试');
    }
  } finally {
    sending.value = false;
  }
}

async function onSubmit(params: Recordable<any>) {
  try {
    await authStore.authMfaLogin({
      mfa_channel: selectedChannel.value,
      mfa_code: params.mfa_code ?? mfaCode.value,
      username: username.value,
    });
  } catch (error: any) {
    const bizCode = String(error?.data?.code ?? '') as unknown as BizCode;
    if (bizCode === BizCode.SAFE_MFA_CODE_INVALID) {
      message.error(error?.data?.message || 'MFA 验证码无效或已过期');
    } else {
      message.error(error?.data?.message || '验证失败，请重试');
    }
  }
}

function goBack() {
  router.push('/auth/login');
}

loadChannels();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="text-2xl font-semibold text-foreground">
      {{ $t('page.auth.mfaLogin') || '二次验证' }}
    </div>
    <p class="text-sm text-muted-foreground">
      {{ $t('page.auth.mfaLoginDesc') || '请完成身份二次验证以继续登录' }}
    </p>

    <div class="flex flex-col gap-3">
      <!-- 渠道选择 -->
      <div v-if="channels.length > 1" class="flex gap-2">
        <button
          v-for="ch in channels"
          :key="ch"
          class="rounded-md border px-3 py-1.5 text-sm transition-colors"
          :class="[selectedChannel === ch ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary']"
          type="button"
          @click="selectedChannel = ch"
        >
          {{ ch }}
        </button>
      </div>

      <!-- 验证目标输入 -->
      <input v-model="mfaTarget" class="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1" placeholder="手机号或邮箱" type="text" />

      <!-- 发送验证码 -->
      <button
        :disabled="sending"
        class="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary disabled:opacity-50"
        type="button"
        @click="sendCode"
      >
        {{ sending ? '发送中...' : codeSent ? '重新发送' : '发送验证码' }}
      </button>

      <!-- 验证码输入 -->
      <input v-model="mfaCode" class="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1" placeholder="请输入验证码" type="text" />

      <!-- 提交 -->
      <button
        :disabled="authStore.loginLoading || !mfaCode"
        class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground transition-opacity disabled:opacity-50"
        type="button"
        @click="onSubmit({})"
      >
        {{ authStore.loginLoading ? '验证中...' : '确认验证' }}
      </button>

      <button class="text-sm text-muted-foreground hover:text-foreground" type="button" @click="goBack">返回登录</button>
    </div>
  </div>
</template>
