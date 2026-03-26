<script setup lang="ts">
import type { AuthApi } from '#/api/core/auth';
import type { ProfileApi } from '#/api/core/profile';

import { computed, onMounted, ref, useTemplateRef } from 'vue';

import { message } from 'ant-design-vue';

import { bindContactApi, getProfileInfoApi, sendContactCodeApi, totpBindApi, totpGenerateApi, totpUnbindApi, unbindContactApi } from '#/api';
import Verify from '#/components/verifition/Verify.vue';
import { $t } from '#/locales';

type Channel = 'email' | 'sms';

interface ProfileInfo {
  email?: string;
  phone?: string;
  totpEnabled?: boolean;
}

const profileInfo = ref<ProfileInfo>({});

// 弹窗状态
const modalVisible = ref(false);
const modalChannel = ref<Channel>('sms');
const modalMode = ref<'bind' | 'change' | 'unbind'>('bind');

// 表单状态
const targetInput = ref('');
const codeInput = ref('');
const submitting = ref(false);

// 人机验证（与 code-login 保持一致：隐藏触发器，手动 show/resolve）
const verifyRef = useTemplateRef<InstanceType<typeof Verify>>('verifyRef');
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

// 倒计时
const countdown = ref(0);
let countdownTimer: null | ReturnType<typeof setInterval> = null;

const canSend = computed(() => countdown.value === 0 && targetInput.value.trim().length > 0);

const modalTitle = computed(() => {
  const ch = modalChannel.value;
  if (modalMode.value === 'bind') return ch === 'sms' ? $t('profile.security.bindPhone') : $t('profile.security.bindEmail');
  if (modalMode.value === 'change') return ch === 'sms' ? $t('profile.security.changePhone') : $t('profile.security.changeEmail');
  return ch === 'sms' ? $t('profile.security.unbindPhone') : $t('profile.security.unbindEmail');
});

const targetLabel = computed(() => {
  if (modalMode.value === 'unbind') {
    return modalChannel.value === 'sms' ? $t('profile.security.currentPhone') : $t('profile.security.currentEmail');
  }
  return modalChannel.value === 'sms' ? $t('profile.security.newPhone') : $t('profile.security.newEmail');
});

const targetPlaceholder = computed(() => (modalChannel.value === 'sms' ? $t('profile.security.phonePlaceholder') : $t('profile.security.emailPlaceholder')));

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function maskEmail(email: string) {
  return email.replace(/(.{2}).+(@.+)/, '$1***$2');
}

async function loadProfile() {
  profileInfo.value = await getProfileInfoApi();
}

function openModal(channel: Channel, mode: 'bind' | 'change' | 'unbind') {
  modalChannel.value = channel;
  modalMode.value = mode;
  targetInput.value = mode === 'unbind' ? (channel === 'sms' ? (profileInfo.value.phone ?? '') : (profileInfo.value.email ?? '')) : '';
  codeInput.value = '';
  cachedCaptcha = null;
  countdown.value = 0;
  if (countdownTimer) clearInterval(countdownTimer);
  modalVisible.value = true;
}

function startCountdown() {
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
}

async function handleSendCode() {
  const target = targetInput.value.trim();
  if (!target) return;

  // 1. 校验格式
  if (modalChannel.value === 'sms' && !/^1[3-9]\d{9}$/.test(target)) {
    message.warning($t('profile.security.invalidPhone'));
    return;
  }
  if (modalChannel.value === 'email' && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(target)) {
    message.warning($t('profile.security.invalidEmail'));
    return;
  }

  // 2. 人机验证（已有缓存时复用，否则弹窗等待用户完成）
  const captcha = await getCaptcha();

  // 3. 调发送接口
  try {
    await sendContactCodeApi({ channel: modalChannel.value, target, captcha });
    cachedCaptcha = null; // 发送成功后清空，下次需重新验证
    message.success($t('profile.security.codeSent'));
    startCountdown();
  } catch {
    // 发送失败：清空缓存，下次点击需重新人机验证
    cachedCaptcha = null;
    verifyRef.value?.clearVerifyVal();
  }
}

async function handleSubmit() {
  const target = targetInput.value.trim();
  const code = codeInput.value.trim();
  if (!target || !code) return;

  submitting.value = true;
  try {
    const result = await (modalMode.value === 'unbind' ? unbindContactApi({ channel: modalChannel.value, code }) : bindContactApi({ channel: modalChannel.value, target, code }));
    profileInfo.value = { ...profileInfo.value, ...result };
    message.success(modalMode.value === 'unbind' ? $t('profile.security.unbindSuccess') : $t('profile.security.bindSuccess'));
    modalVisible.value = false;
  } finally {
    submitting.value = false;
  }
}

// =========================================================================
// TOTP
// =========================================================================
const totpModalVisible = ref(false);
const totpModalMode = ref<'bind' | 'unbind'>('bind');
const totpGenerating = ref(false);
const totpData = ref<null | ProfileApi.TotpGenerateResult>(null);
const totpCodeInput = ref('');
const totpSubmitting = ref(false);

async function openTotpBind() {
  totpModalMode.value = 'bind';
  totpCodeInput.value = '';
  totpData.value = null;
  totpGenerating.value = true;
  totpModalVisible.value = true;
  try {
    totpData.value = await totpGenerateApi();
  } finally {
    totpGenerating.value = false;
  }
}

function openTotpUnbind() {
  totpModalMode.value = 'unbind';
  totpCodeInput.value = '';
  totpData.value = null;
  totpModalVisible.value = true;
}

async function handleTotpSubmit() {
  const code = totpCodeInput.value.trim();
  if (!code) return;

  totpSubmitting.value = true;
  try {
    if (totpModalMode.value === 'bind') {
      const result = await totpBindApi({ totpSecret: totpData.value!.secret, totpCode: code });
      profileInfo.value = { ...profileInfo.value, ...result };
      message.success($t('profile.security.totpBindSuccess'));
    } else {
      const result = await totpUnbindApi({ totpCode: code });
      profileInfo.value = { ...profileInfo.value, ...result };
      message.success($t('profile.security.totpUnbindSuccess'));
    }
    totpModalVisible.value = false;
  } finally {
    totpSubmitting.value = false;
  }
}

onMounted(loadProfile);
</script>

<template>
  <div class="space-y-4 p-2">
    <!-- 人机验证弹窗，隐藏触发器，通过 ref 手动触发（与 code-login 保持一致） -->
    <Verify ref="verifyRef" mode="pop" @success="onCaptchaSuccess">
      <template #trigger></template>
    </Verify>

    <!-- 密保手机 -->
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div class="font-medium">{{ $t('profile.security.phone') }}</div>
        <div class="mt-1 text-sm text-muted-foreground">
          <template v-if="profileInfo.phone">
            {{ $t('profile.security.phoneDesc', { phone: maskPhone(profileInfo.phone) }) }}
          </template>
          <template v-else>{{ $t('profile.security.phoneEmpty') }}</template>
        </div>
      </div>
      <div class="flex gap-2">
        <a-button v-if="!profileInfo.phone" @click="openModal('sms', 'bind')">
          {{ $t('profile.security.bind') }}
        </a-button>
        <template v-else>
          <a-button @click="openModal('sms', 'change')">
            {{ $t('profile.security.change') }}
          </a-button>
          <a-button danger @click="openModal('sms', 'unbind')">
            {{ $t('profile.security.unbind') }}
          </a-button>
        </template>
      </div>
    </div>

    <!-- 备用邮箱 -->
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div class="font-medium">{{ $t('profile.security.email') }}</div>
        <div class="mt-1 text-sm text-muted-foreground">
          <template v-if="profileInfo.email">
            {{ $t('profile.security.emailDesc', { email: maskEmail(profileInfo.email) }) }}
          </template>
          <template v-else>{{ $t('profile.security.emailEmpty') }}</template>
        </div>
      </div>
      <div class="flex gap-2">
        <a-button v-if="!profileInfo.email" @click="openModal('email', 'bind')">
          {{ $t('profile.security.bind') }}
        </a-button>
        <template v-else>
          <a-button @click="openModal('email', 'change')">
            {{ $t('profile.security.change') }}
          </a-button>
          <a-button danger @click="openModal('email', 'unbind')">
            {{ $t('profile.security.unbind') }}
          </a-button>
        </template>
      </div>
    </div>

    <!-- 动态验证器 TOTP -->
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div class="font-medium">{{ $t('profile.security.totp') }}</div>
        <div class="mt-1 text-sm text-muted-foreground">
          <template v-if="profileInfo.totpEnabled">
            {{ $t('profile.security.totpDesc') }}
          </template>
          <template v-else>{{ $t('profile.security.totpEmpty') }}</template>
        </div>
      </div>
      <div class="flex gap-2">
        <a-button v-if="!profileInfo.totpEnabled" type="primary" @click="openTotpBind">
          {{ $t('profile.security.totpBind') }}
        </a-button>
        <a-button v-else danger @click="openTotpUnbind">
          {{ $t('profile.security.totpUnbind') }}
        </a-button>
      </div>
    </div>

    <!-- 绑定/换绑/解绑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" :confirm-loading="submitting" :ok-text="$t('profile.security.bind')" @ok="handleSubmit">
      <div class="space-y-4 py-2">
        <!-- 解绑时提示 -->
        <a-alert v-if="modalMode === 'unbind'" type="warning" show-icon :message="$t('profile.security.unbindConfirm', { target: targetInput })" />

        <!-- 目标输入（解绑时只读） -->
        <div>
          <div class="mb-1 text-sm font-medium">{{ targetLabel }}</div>
          <a-input v-model:value="targetInput" :placeholder="targetPlaceholder" :disabled="modalMode === 'unbind'" />
        </div>

        <!-- 验证码输入 + 发送按钮 -->
        <!-- 点击发送：校验格式 → 人机验证弹窗 → 调接口 → 成功倒计时 / 失败重置验证码 -->
        <div>
          <div class="mb-1 text-sm font-medium">{{ $t('profile.security.code') }}</div>
          <a-input-group compact>
            <a-input v-model:value="codeInput" :placeholder="$t('profile.security.codePlaceholder')" :maxlength="6" style="width: calc(100% - 130px)" />
            <a-button :disabled="!canSend" style="width: 130px" @click="handleSendCode">
              <template v-if="countdown > 0">
                {{ $t('profile.security.resendCountdown', { seconds: countdown }) }}
              </template>
              <template v-else>{{ $t('profile.security.sendCode') }}</template>
            </a-button>
          </a-input-group>
        </div>
      </div>
    </a-modal>

    <!-- TOTP 绑定/解绑弹窗 -->
    <a-modal
      v-model:open="totpModalVisible"
      :title="totpModalMode === 'bind' ? $t('profile.security.totpBindTitle') : $t('profile.security.totpUnbindTitle')"
      :confirm-loading="totpSubmitting"
      :ok-text="totpModalMode === 'bind' ? $t('profile.security.totpBind') : $t('profile.security.totpUnbind')"
      :ok-button-props="{ danger: totpModalMode === 'unbind' }"
      @ok="handleTotpSubmit"
    >
      <div class="space-y-4 py-2">
        <!-- 绑定流程：展示二维码 -->
        <template v-if="totpModalMode === 'bind'">
          <a-spin :spinning="totpGenerating" :tip="$t('profile.security.totpLoading')">
            <div v-if="totpData" class="flex flex-col items-center gap-3">
              <!-- SVG 二维码 -->
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="rounded border p-2" v-html="totpData.qrCodeSvg"></div>
              <div class="text-center text-sm text-muted-foreground">
                <div>{{ $t('profile.security.totpStep1') }}</div>
                <div class="mt-1">{{ $t('profile.security.totpStep2') }}</div>
              </div>
            </div>
          </a-spin>
        </template>

        <!-- 解绑流程：提示 -->
        <template v-else>
          <a-alert type="warning" show-icon :message="$t('profile.security.totpUnbindConfirm')" />
        </template>

        <!-- 验证码输入 -->
        <div>
          <div class="mb-1 text-sm font-medium">{{ $t('profile.security.totpCode') }}</div>
          <a-input v-model:value="totpCodeInput" :placeholder="$t('profile.security.totpCodePlaceholder')" :maxlength="6" autocomplete="one-time-code" />
        </div>
      </div>
    </a-modal>
  </div>
</template>
