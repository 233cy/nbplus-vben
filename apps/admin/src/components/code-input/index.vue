<script setup lang="ts">
import { Button, Input } from 'ant-design-vue';

import { $t } from '#/locales';
import { stringToCode } from '#/utils/string-to-code';

/**
 * 编码输入组件（带"生成编码"按钮）.
 *
 * 用法：
 * - 普通表单：`<CodeInput v-model="form.code" :name="form.name" />`
 * - vben schema：`component: 'CodeInput', componentProps: (values) => ({ name: values.name })`
 */
interface Props {
  /** 生成编码的来源名称（点击按钮时按拼音转换为编码） */
  name?: string;
  disabled?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  disabled: false,
  placeholder: '',
});

const modelValue = defineModel<string>({ default: '' });

function generate() {
  if (props.disabled) {
    return;
  }
  const code = stringToCode(props.name ?? '');
  if (code !== '') {
    modelValue.value = code;
  }
}
</script>

<template>
  <Input v-model:value="modelValue" :disabled="disabled" :placeholder="placeholder">
    <template v-if="!disabled" #addonAfter>
      <Button type="link" @click="generate">
        {{ $t('components.code-input.generateCode') }}
      </Button>
    </template>
  </Input>
</template>
