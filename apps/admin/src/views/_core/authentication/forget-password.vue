<script lang="ts" setup>
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

let captchaResolve: ((token: string) => void) | null = null;

function onCaptchaSuccess(data: any) {
  const resolve = captchaResolve;
  captchaResolve = null;
  verifyRef.value?.closeBox();
  resolve?.(data.captchaVerification as string);
}

function validateTarget(): boolean {
  if (!target.value) {
    targetError.value = channel.value === 'sms' ? $t('page.auth.forgetPassword.phoneRequired') : $t('page.auth.forgetPassword.emailRequired');
    return false;
  }
  if (channel.value === 'sms' && !/^1[3-9]\d{9}$/.test(target.value)) {
    targetError.value = $t('page.auth.forgetPassword.invalidPhone');
    return false;
  }
  if (channel.value === 'email' && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(target.value)) {
    targetError.value = $t('page.auth.forgetPassword.invalidEmail');
    return false;
  }
  targetError.value = '';
  return true;
}

async function handleSendCode() {
  if (!validateTarget()) return;

  verifyRef.value?.show();
  const captcha = await new Promise<string>((resolve) => {
    captchaResolve = resolve;
  });

  loading.value = true;
  try {
    await sendPasswordResetCodeApi({ channel: channel.value, target: target.value, captcha });
    message.success($t('page.auth.forgetPassword.codeSent'));
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
  verifyRef.value?.show();
  const captcha = await new Promise<string>((resolve) => {
    captchaResolve = resolve;
  });
  loading.value = true;
  try {
    await sendPasswordResetCodeApi({ channel: channel.value, target: target.value, captcha });
    message.success($t('page.auth.forgetPassword.codeSent'));
    countdown.value = 60;
    startCountdown();
  } finally {
    loading.value = false;
  }
}

async function handleVerifyCode() {
  if (!code.value || code.value.length !== 6) {
    codeError.value = $t('page.auth.forgetPassword.codeRequired');
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
    passwordError.value = $t('page.auth.forgetPassword.passwordMinLength');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = $t('page.auth.forgetPassword.passwordMismatch');
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
      <h2 class="text-2xl font-semibold">{{ $t('page.auth.forgetPassword.title') }}</h2>
      <p class="mt-1 text-sm text-muted-foreground">{{ $t('page.auth.forgetPassword.subTitle') }}</p>
    </div>

    <!-- 步骤条 -->
    <Steps :current="currentStep" class="mb-8" size="small">
      <Steps.Step :title="$t('page.auth.forgetPassword.step1')" />
      <Steps.Step :title="$t('page.auth.forgetPassword.step2')" />
      <Steps.Step :title="$t('page.auth.forgetPassword.step3')" />
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
          v-for="(label, ch) in { sms: $t('page.auth.forgetPassword.smsChannel'), email: $t('page.auth.forgetPassword.emailChannel') }"
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
          :label="channel === 'sms' ? $t('page.auth.forgetPassword.phone') : $t('page.auth.forgetPassword.email')"
          :validate-status="targetError ? 'error' : ''"
          :help="targetError"
        >
          <Input
            v-model:value="target"
            :placeholder="channel === 'sms' ? $t('page.auth.forgetPassword.phonePlaceholder') : $t('page.auth.forgetPassword.emailPlaceholder')"
            size="large"
            @change="targetError = ''"
          />
        </FormItem>
      </Form>

      <Button type="primary" block size="large" :loading="loading" @click="handleSendCode">
        {{ $t('page.auth.forgetPassword.sendCode') }}
      </Button>

      <div class="text-center">
        <a class="text-sm text-primary" @click="goLogin">{{ $t('page.auth.forgetPassword.backToLogin') }}</a>
      </div>
    </div>

    <!-- 步骤二：输入验证码 -->
    <div v-else-if="currentStep === 1" class="space-y-4">
      <p class="text-sm text-muted-foreground">
        {{ $t('page.auth.forgetPassword.codeSentTo', { target }) }}
      </p>

      <Form layout="vertical">
        <FormItem :label="$t('page.auth.forgetPassword.code')" :validate-status="codeError ? 'error' : ''" :help="codeError">
          <Input v-model:value="code" :placeholder="$t('page.auth.forgetPassword.codePlaceholder')" size="large" maxlength="6" @change="codeError = ''" />
        </FormItem>
      </Form>

      <Button type="primary" block size="large" :loading="loading" @click="handleVerifyCode">
        {{ $t('page.auth.forgetPassword.verifyCode') }}
      </Button>

      <div class="text-center text-sm">
        <span class="text-muted-foreground">{{ $t('page.auth.forgetPassword.noCode') }}</span>
        <a class="ml-1" :class="countdown > 0 ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer text-primary'" @click="handleResend">
          {{ countdown > 0 ? $t('page.auth.forgetPassword.resendCountdown', { seconds: countdown }) : $t('page.auth.forgetPassword.resend') }}
        </a>
      </div>
    </div>

    <!-- 步骤三：设置新密码 -->
    <div v-else-if="currentStep === 2" class="space-y-4">
      <Form layout="vertical">
        <FormItem :label="$t('page.auth.forgetPassword.newPassword')" :validate-status="passwordError ? 'error' : ''" :help="passwordError">
          <InputPassword v-model:value="newPassword" :placeholder="$t('page.auth.forgetPassword.newPasswordPlaceholder')" size="large" @change="passwordError = ''" />
        </FormItem>
        <FormItem :label="$t('page.auth.forgetPassword.confirmPassword')">
          <InputPassword v-model:value="confirmPassword" :placeholder="$t('page.auth.forgetPassword.confirmPasswordPlaceholder')" size="large" />
        </FormItem>
      </Form>

      <Button type="primary" block size="large" :loading="loading" @click="handleResetPassword">
        {{ $t('page.auth.forgetPassword.submit') }}
      </Button>
    </div>

    <!-- 步骤四：完成 -->
    <div v-else class="space-y-4 text-center">
      <div class="text-5xl text-success">✓</div>
      <p class="text-lg font-medium">{{ $t('page.auth.forgetPassword.successTitle') }}</p>
      <p class="text-sm text-muted-foreground">{{ $t('page.auth.forgetPassword.successDesc') }}</p>
      <Button type="primary" block size="large" @click="goLogin">
        {{ $t('page.auth.forgetPassword.goLogin') }}
      </Button>
    </div>
  </div>
</template>
