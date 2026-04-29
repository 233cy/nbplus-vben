<script setup lang="ts">
import { computed } from 'vue';

import { $t } from '#/locales';
import { useSiteStore } from '#/store/site';

export interface Props {
  placeholder?: string;
  disabled?: boolean;
}

export interface Emits {
  (e: 'change', value: string, isValid: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: $t('profile.password.newPasswordPlaceholder'),
  disabled: false,
});

const modelValue = defineModel<any>('value');

const siteStore = useSiteStore();

// 密码策略
const policy = computed(() => ({
  level: siteStore.get('security.password.level', 'medium') as 'medium' | 'strong' | 'weak',
  minLength: Number.parseInt(siteStore.get('security.password.len', '8'), 10),
}));

// 是否达标
const isValid = computed(() => {
  const password = modelValue.value;
  if (!password) return false;
  if (password.length < policy.value.minLength) return false;

  const { level } = policy.value;
  if (level === 'weak') return true;
  if (level === 'medium') {
    return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
  }
  if (level === 'strong') {
    return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^a-z0-9]/i.test(password);
  }
  return false;
});

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

// 提示消息
const message = computed(() => {
  const password = modelValue.value;
  if (!password) return '';

  if (!isValid.value) {
    const messages: string[] = [];
    if (password.length < policy.value.minLength) {
      messages.push($t('common.passwordStrength.minLength', { minLength: policy.value.minLength }));
    }
    if (policy.value.level !== 'weak') {
      if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
        messages.push($t('common.passwordStrength.letter'));
      }
      if (!/\d/.test(password)) {
        messages.push($t('common.passwordStrength.digit'));
      }
      if (policy.value.level === 'strong' && !/[^a-z0-9]/i.test(password)) {
        messages.push($t('common.passwordStrength.special'));
      }
    }
    return messages.join('，');
  }
  return $t('common.passwordStrength.good');
});
</script>

<template>
  <div class="password-input-wrapper">
    <a-input-password v-model:value="modelValue" :placeholder="props.placeholder" :disabled="props.disabled" class="password-input">
      <template #suffix>
        <div v-if="modelValue" class="strength-indicator">
          <span :style="{ color: currentStrength.color }" class="text-sm font-medium">{{ currentStrength.text }}</span>
        </div>
      </template>
    </a-input-password>
    <div v-if="modelValue" class="strength-message">
      <span :style="{ color: currentStrength.color }">{{ currentStrength.text }}</span>
      <span :class="isValid ? 'text-gray-500' : 'text-red-500'" class="ml-2 text-xs">{{ message }}</span>
    </div>
  </div>
</template>

<style scoped>
.password-input-wrapper {
  width: 100%;
}

.password-input :deep(.ant-input-suffix) {
  display: flex;
  align-items: center;
  padding-right: 8px;
}

.strength-message {
  margin-top: 4px;
  font-size: 12px;
}
</style>
