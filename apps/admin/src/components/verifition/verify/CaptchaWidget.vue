<script setup lang="ts">
/**
 * CaptchaWidget — 支持 imageText / math 两种简单验证码类型
 *
 * 这两种类型没有一段校验（check），用户填写答案后直接拼成
 * "{token}:{userInput}" 作为 captchaVerification 提交二段校验（verify）。
 */
import { ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { useDebounceFn } from '@vueuse/core';

import { reqGet } from '#/api/admin/core/captcha';

interface Props {
  captchaType: 'imageText' | 'math';
  initialData?: any;
  mode?: 'fixed' | 'pop';
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  mode: 'pop',
});

const emit = defineEmits<{
  (e: 'success', data: { captchaVerification: string }): void;
  (e: 'error'): void;
  (e: 'close'): void;
  (e: 'typeChange', type: string): void;
}>();

const imageBase64 = ref('');
const token = ref('');
const userInput = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function doLoadCaptcha(initial?: any) {
  loading.value = true;
  errorMsg.value = '';
  userInput.value = '';
  try {
    const res: any = initial ?? (await reqGet());
    // 服务端返回的 type 与当前不一致时，通知父组件切换组件
    if (res?.type && res.type !== props.captchaType) {
      emit('typeChange', res.type);
      return;
    }
    imageBase64.value = res.imageBase64 ?? '';
    token.value = res.token ?? '';
  } catch {
    errorMsg.value = $t('captcha.loadFailed') || '加载失败，请刷新';
  } finally {
    loading.value = false;
  }
}

const loadCaptcha = useDebounceFn((initial?: any) => doLoadCaptcha(initial), 800);

function refresh() {
  loading.value = true; // 立即给反馈，防抖期间保持 loading 状态
  loadCaptcha(undefined);
}

function submit() {
  const input = userInput.value.trim();
  if (!input) {
    errorMsg.value = $t('captcha.inputRequired') || '请输入验证码';
    return;
  }
  const captchaVerification = `${token.value}:${input}`;
  emit('success', { captchaVerification });
  if (props.mode === 'pop') {
    setTimeout(() => emit('close'), 300);
  }
}

// 初次挂载用 initialData，后续 captchaType 变化时重新加载
watch(
  () => props.captchaType,
  () => doLoadCaptcha(props.initialData),
  { immediate: true },
);

defineExpose({ refresh });
</script>

<template>
  <div class="captcha-widget flex flex-col items-center gap-3 p-2">
    <!-- 图片区域 -->
    <div class="relative flex h-10 w-full items-center justify-center overflow-hidden rounded border">
      <span v-if="loading" class="text-sm text-muted-foreground">{{ $t('captcha.loading') || '加载中...' }}</span>
      <img v-else-if="imageBase64" :src="imageBase64" alt="captcha" class="h-full w-auto cursor-pointer select-none" @click="refresh" />
    </div>

    <!-- 输入区域 -->
    <div class="flex w-full gap-2">
      <input
        v-model="userInput"
        class="h-9 flex-1 rounded border px-3 text-sm outline-none focus:border-primary"
        :placeholder="captchaType === 'math' ? $t('captcha.mathPlaceholder') || '请输入计算结果' : $t('captcha.imageTextPlaceholder') || '请输入图中字符'"
        @keyup.enter="submit"
      />
      <button type="button" class="h-9 rounded bg-primary px-3 text-sm text-white hover:opacity-90" @click="submit">
        {{ $t('captcha.confirm') || '确认' }}
      </button>
    </div>

    <!-- 错误提示 -->
    <p v-if="errorMsg" class="w-full text-xs text-destructive">{{ errorMsg }}</p>

    <!-- 刷新提示 -->
    <p class="w-full cursor-pointer text-xs text-muted-foreground hover:text-primary" @click="refresh">
      {{ $t('captcha.clickImageToRefresh') || '点击图片可刷新' }}
    </p>
  </div>
</template>
