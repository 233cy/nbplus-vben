<script lang="ts" setup>
import type { AuthApi } from '#/api/core/auth';

import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { Button, Form, FormItem, Input, InputPassword, message, Steps } from 'ant-design-vue';

import { sendPasswordResetCodeApi, submitPasswordResetApi, verifyPasswordResetCodeApi } from '#/api';
import Verify from '#/components/verifition/Verify.vue';

defineOptions({ name: 'ForgetPassword' });

const router = useRouter();
const verifyRef = useTemplateRef<InstanceType<typeof Verify>>('verifyRef');

// ─── 步骤控制 ───────────────────────────────────────────────────────────────
// 0: 发送验证码  1: 校验验证码  2: 重置密码  3: 完成
const currentStep = ref(0);
const loading = ref(false);

// ─── 步骤一：发送验证码 ──────────────────────────────────────────────────────
type Channel = 'email' | 'sms';
const channel = ref<Channel>('sms');
const target = ref('');
const targetError = ref('');

// 缓存已验证的 captcha，避免重复弹窗
let cachedCaptcha: AuthApi.CaptchaPayload | null = null;
let captchaResolve: ((payload: AuthApi.CaptchaPayload) => void) | null = null;

function onCaptchaSuccess(data: AuthApi.CaptchaPayload) {
  const resolve = captchaResolve;
  captchaResolve = null;
  cachedCaptcha = data;
  verifyRef.value?.closeBox();
  resolve?.(data);
}

async function getCaptcha(): Promise<AuthApi.CaptchaPayload> {
  if (cachedCaptcha) return cachedCaptcha;
  verifyRef.value?.show();
  return new Promise<AuthApi.CaptchaPayload>((resolve) => {
    captchaResolve = resolve;
  });
}

function validateTarget(): boolean {
  if (!target.value) {
    targetError.value = channel.value === 'sms' ? $t('core.authentication.forgetPasswordPage.phoneRequired') : $t('core.authentication.forgetPasswordPage.emailRequired');
    return false;
  }
  if (channel.value === 'sms' && !/^1[3-9]\d{9}$/.test(target.value)) {
    targetError.value = $t('core.authentication.forgetPasswordPage.invalidPhone');
    return false;
  }
  if (channel.value === 'email' && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(target.value)) {
    targetError.value = $t('core.authentication.forgetPasswordPage.invalidEmail');
    return false;
  }
  targetError.value = '';
  return true;
}

async function handleSendCode() {
  if (!validateTarget()) return;

  const captcha = await getCaptcha();

  loading.value = true;
  try {
    await sendPasswordResetCodeApi({ channel: channel.value, target: target.value, captcha });
    cachedCaptcha = null; // 发送成功后清空，下次重发需重新验证
    message.success($t('core.authentication.forgetPasswordPage.codeSent'));
    currentStep.value = 1;
    countdown.value = 60;
    startCountdown();
  } finally {
    loading.value = false;
  }
}

// ─── 步骤二：校验验证码 ──────────────────────────────────────────────────────
const code = ref('');
const codeError = ref('');
const resetToken = ref('');
const countdown = ref(0);
let countdownTimer: null | ReturnType<typeof setInterval> = null;

function startCountdown() {
  countdownTimer = setInterval(() => {
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!);
      return;
    }
    countdown.value--;
  }, 1000);
}

async function handleResend() {
  if (countdown.value > 0) return;
  // 每次重发都需要重新验证
  cachedCaptcha = null;
  const captcha = await getCaptcha();
  loading.value = true;
  try {
    await sendPasswordResetCodeApi({ channel: channel.value, target: target.value, captcha });
    cachedCaptcha = null; // 发送成功后清空
    message.success($t('core.authentication.forgetPasswordPage.codeSent'));
    countdown.value = 60;
    startCountdown();
  } finally {
    loading.value = false;
  }
}

async function handleVerifyCode() {
  if (!code.value || code.value.length !== 6) {
    codeError.value = $t('core.authentication.forgetPasswordPage.codeRequired');
    return;
  }
  codeError.value = '';
  loading.value = true;
  try {
    const result = await verifyPasswordResetCodeApi({
      channel: channel.value,
      target: target.value,
      code: code.value,
    });
    resetToken.value = result.resetToken;
    currentStep.value = 2;
  } finally {
    loading.value = false;
  }
}

// ─── 步骤三：重置密码 ────────────────────────────────────────────────────────
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');

async function handleResetPassword() {
  if (!newPassword.value || newPassword.value.length < 8) {
    passwordError.value = $t('core.authentication.forgetPasswordPage.passwordMinLength');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = $t('core.authentication.forgetPasswordPage.passwordMismatch');
    return;
  }
  passwordError.value = '';
  loading.value = true;
  try {
    await submitPasswordResetApi({
      resetToken: resetToken.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    });
    currentStep.value = 3;
  } finally {
    loading.value = false;
  }
}

function goLogin() {
  router.push('/auth/login');
}
</script>

<template>
  <div class="mx-auto w-full max-w-md px-4 py-8">
    <!-- 标题 -->
    <div class="mb-8 text-center">
      <h2 class="text-2xl font-semibold">{{ $t('core.authentication.forgetPasswordPage.title') }}</h2>
      <p class="mt-1 text-sm text-muted-foreground">{{ $t('core.authentication.forgetPasswordPage.subTitle') }}</p>
    </div>

    <!-- 步骤条 -->
    <Steps :current="currentStep" class="mb-8" size="small">
      <Steps.Step :title="$t('core.authentication.forgetPasswordPage.step1')" />
      <Steps.Step :title="$t('core.authentication.forgetPasswordPage.step2')" />
      <Steps.Step :title="$t('core.authentication.forgetPasswordPage.step3')" />
    </Steps>

    <!-- 人机验证弹窗 -->
    <Verify ref="verifyRef" captcha-type="blockPuzzle" mode="pop" @success="onCaptchaSuccess">
      <template #trigger></template>
    </Verify>

    <!-- 步骤一：填写手机号/邮箱 -->
    <div v-if="currentStep === 0" class="space-y-4">
      <!-- 渠道切换 -->
      <div class="flex gap-2">
        <button
          v-for="(label, ch) in { sms: $t('core.authentication.forgetPasswordPage.smsChannel'), email: $t('core.authentication.forgetPasswordPage.emailChannel') }"
          :key="ch"
          class="flex-1 rounded-full border py-1.5 text-sm transition-colors"
          :class="[channel === ch ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary']"
          type="button"
          @click="
            channel = ch as Channel;
            target = '';
            targetError = '';
          "
        >
          {{ label }}
        </button>
      </div>

      <Form layout="vertical">
        <FormItem
          :label="channel === 'sms' ? $t('core.authentication.forgetPasswordPage.phone') : $t('core.authentication.forgetPasswordPage.email')"
          :validate-status="targetError ? 'error' : ''"
          :help="targetError"
        >
          <Input
            v-model:value="target"
            :placeholder="channel === 'sms' ? $t('core.authentication.forgetPasswordPage.phonePlaceholder') : $t('core.authentication.forgetPasswordPage.emailPlaceholder')"
            size="large"
            @change="targetError = ''"
          />
        </FormItem>
      </Form>

      <Button type="primary" block size="large" :loading="loading" @click="handleSendCode">
        {{ $t('core.authentication.forgetPasswordPage.sendCode') }}
      </Button>

      <div class="text-center">
        <a class="text-sm text-primary" @click="goLogin">{{ $t('core.authentication.forgetPasswordPage.backToLogin') }}</a>
      </div>
    </div>

    <!-- 步骤二：输入验证码 -->
    <div v-else-if="currentStep === 1" class="space-y-4">
      <p class="text-sm text-muted-foreground">
        {{ $t('core.authentication.forgetPasswordPage.codeSentTo', { target }) }}
      </p>

      <Form layout="vertical">
        <FormItem :label="$t('core.authentication.forgetPasswordPage.code')" :validate-status="codeError ? 'error' : ''" :help="codeError">
          <Input v-model:value="code" :placeholder="$t('core.authentication.forgetPasswordPage.codePlaceholder')" size="large" :maxlength="6" @change="codeError = ''" />
        </FormItem>
      </Form>

      <Button type="primary" block size="large" :loading="loading" @click="handleVerifyCode">
        {{ $t('core.authentication.forgetPasswordPage.verifyCode') }}
      </Button>

      <div class="text-center text-sm">
        <span class="text-muted-foreground">{{ $t('core.authentication.forgetPasswordPage.noCode') }}</span>
        <a class="ml-1" :class="countdown > 0 ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer text-primary'" @click="handleResend">
          {{ countdown > 0 ? $t('core.authentication.forgetPasswordPage.resendCountdown', { seconds: countdown }) : $t('core.authentication.forgetPasswordPage.resend') }}
        </a>
      </div>
    </div>

    <!-- 步骤三：设置新密码 -->
    <div v-else-if="currentStep === 2" class="space-y-4">
      <Form layout="vertical">
        <FormItem :label="$t('core.authentication.forgetPasswordPage.newPassword')" :validate-status="passwordError ? 'error' : ''" :help="passwordError">
          <InputPassword v-model:value="newPassword" :placeholder="$t('core.authentication.forgetPasswordPage.newPasswordPlaceholder')" size="large" @change="passwordError = ''" />
        </FormItem>
        <FormItem :label="$t('core.authentication.forgetPasswordPage.confirmPassword')">
          <InputPassword v-model:value="confirmPassword" :placeholder="$t('core.authentication.forgetPasswordPage.confirmPasswordPlaceholder')" size="large" />
        </FormItem>
      </Form>

      <Button type="primary" block size="large" :loading="loading" @click="handleResetPassword">
        {{ $t('core.authentication.forgetPasswordPage.submit') }}
      </Button>
    </div>

    <!-- 步骤四：完成 -->
    <div v-else class="space-y-4 text-center">
      <div class="text-5xl text-success">✓</div>
      <p class="text-lg font-medium">{{ $t('core.authentication.forgetPasswordPage.successTitle') }}</p>
      <p class="text-sm text-muted-foreground">{{ $t('core.authentication.forgetPasswordPage.successDesc') }}</p>
      <Button type="primary" block size="large" @click="goLogin">
        {{ $t('core.authentication.forgetPasswordPage.goLogin') }}
      </Button>
    </div>
  </div>
</template>
