<script setup lang="ts">
import type { AuthApi } from '#/api/core/auth';

import { ref, useAttrs } from 'vue';

import { VbenPinInput } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import Verify from '#/components/verifition/Verify.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), {
  codeLength: 6,
  maxTime: 60,
  disabled: false,
  beforeSend: undefined,
  successMessage: undefined,
  createText: undefined,
});

interface Props {
  codeLength?: number;
  maxTime?: number;
  disabled?: boolean;
  /**
   * 发送前校验钩子，throw 或 reject 则阻止发送流程
   */
  beforeSend?: () => Promise<void>;
  /**
   * 实际发送接口，接收人机验证 payload，返回后端给的冷却秒数（0 则用 maxTime 兜底）
   */
  sendApi: (captcha: AuthApi.CaptchaPayload) => Promise<number>;
  /**
   * 发送成功提示文案，默认读 captcha.sendSuccess
   */
  successMessage?: string;
  /**
   * 自定义按钮文本
   */
  createText?: (countdown: number) => string;
}

const modelValue = defineModel<string>();

const attrs = useAttrs();
const verifyRef = ref<InstanceType<typeof Verify>>();
// 动态冷却时间，由后端返回的 retryAfter 驱动，兜底用 props.maxTime
const currentMaxTime = ref(props.maxTime);

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

/**
 * 传给 VbenPinInput 的 handleSendCode：
 * resolve → 倒计时启动；throw → 不启动
 */
async function handleSendCode() {
  await props.beforeSend?.();
  const captcha = await getCaptcha();
  let retryAfter: number;
  try {
    retryAfter = await props.sendApi(captcha);
  } catch (error) {
    // 发送失败：清空缓存，下次需重新人机验证，并 rethrow 阻止倒计时
    cachedCaptcha = null;
    throw error;
  }
  cachedCaptcha = null;
  // 用后端返回的冷却秒数驱动倒计时，0 则兜底用 props.maxTime
  currentMaxTime.value = retryAfter > 0 ? retryAfter : props.maxTime;
  message.success(props.successMessage ?? $t('core.captcha.sendSuccess'));
}
</script>

<template>
  <div class="w-full">
    <!-- 人机验证弹窗，无触发器 UI，通过 ref 手动控制 -->
    <Verify ref="verifyRef" mode="pop" @success="onCaptchaSuccess">
      <template #trigger></template>
    </Verify>

    <VbenPinInput
      v-bind="attrs"
      v-model="modelValue"
      :code-length="codeLength"
      :max-time="currentMaxTime"
      :disabled="disabled"
      :create-text="createText"
      :handle-send-code="handleSendCode"
    />
  </div>
</template>
