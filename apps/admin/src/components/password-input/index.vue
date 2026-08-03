<script setup lang="ts">
import { computed } from 'vue';

import { $t } from '#/locales';
import { isPasswordValid } from '#/utils/password-policy';

export interface Props {
  placeholder?: string;
  disabled?: boolean;
}

export interface Emits {
  (e: 'change', value: string, isValid: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: $t('core.profile.password.newPasswordPlaceholder'),
  disabled: false,
});

const modelValue = defineModel<any>('value');

// 是否达标（策略统一取自 utils/password-policy，经 /config/public 与后端 PasswordPolicy 同源）
const isValid = computed(() => isPasswordValid(modelValue.value ?? ''));

// 强度等级（根据密码实际强度判断）
const strengthLevel = computed(() => {
  if (!isValid.value) return 'weak';

  const password = modelValue.value;
  if (!password) return 'weak';

  // 检查是否满足 strong 要求
  const hasSpecial = /[^a-z0-9]/i.test(password);
  if (hasSpecial) return 'strong';

  // 检查是否满足 medium 要求
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  if (hasLower && hasUpper && hasDigit) return 'medium';

  return 'weak';
});

// 强度配置
const STRENGTH_CONFIG = {
  weak: { color: '#ff4d4f', text: $t('common.passwordStrength.weak') },
  medium: { color: '#faad14', text: $t('common.passwordStrength.medium') },
  strong: { color: '#52c41a', text: $t('common.passwordStrength.strong') },
};

// 当前强度
const currentStrength = computed(() => STRENGTH_CONFIG[strengthLevel.value]);
</script>

<template>
  <!--
    只负责输入与输入框内的强度指示（弱/中/强）；
    强度不达标的错误提示由表单校验（zod refine + passwordPolicyDescription）
    在表单项错误位统一展示，组件不再自渲染消息，避免与表单错误提示重叠。
  -->
  <a-input-password v-model:value="modelValue" :placeholder="props.placeholder" :disabled="props.disabled" class="password-input">
    <template #suffix>
      <span v-if="modelValue" :style="{ color: currentStrength.color }" class="text-sm font-medium">{{ currentStrength.text }}</span>
    </template>
  </a-input-password>
</template>

<style scoped>
.password-input {
  width: 100%;
}

.password-input :deep(.ant-input-suffix) {
  display: flex;
  align-items: center;
  padding-right: 8px;
}
</style>
