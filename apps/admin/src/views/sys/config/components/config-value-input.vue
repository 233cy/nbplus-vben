<script setup lang="ts">
import type { ComponentType } from '#/adapter/component';
import type { ConfigApi } from '#/api/sys/config';

import { computed } from 'vue';

import { DatePicker, Input, InputNumber, InputPassword, RadioGroup, Select, Switch, Textarea, TimePicker } from 'ant-design-vue';

import CaptchaPinInput from '#/components/captcha-pin-input/index.vue';
import DictRadio from '#/components/dict/DictRadio.vue';
import DictSelect from '#/components/dict/DictSelect.vue';
import UpAvatar from '#/components/upload/upAvatar.vue';
import UpImg from '#/components/upload/upImg.vue';
import WangEditor from '#/components/wang-editor/index.vue';
import { $t } from '#/locales';

import { getModelPropName, isOptionsComponent, normalizeComponent, resolveOptions, stringToValue, valueToString } from '../composables/useConfigValue';

interface Props {
  item: ConfigApi.ConfigItem;
  /** 只读展示（详情模式），禁用所有输入 */
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});
const modelValue = defineModel<string>({ default: '' });

const componentType = computed(() => normalizeComponent(props.item.component));

/** 是否加密：后端约定 1开 2关，不能用真值判断（2 也是真值） */
const encrypted = computed(() => props.item.isEncrypted === 1);

const componentMap: Partial<Record<ComponentType, any>> = {
  Input,
  InputPassword,
  Textarea,
  InputNumber,
  Switch,
  Select,
  RadioGroup,
  DatePicker,
  TimePicker,
  ImageUpload: UpImg,
  AvatarUpload: UpAvatar,
  Edit: WangEditor,
  DictSelect,
  DictRadio,
  CaptchaPinInput,
};

const renderComponent = computed(() => componentMap[componentType.value] || Input);

const modelPropName = computed(() => getModelPropName(componentType.value));

const nativeValue = computed({
  get: () => stringToValue(modelValue.value, componentType.value, encrypted.value),
  set: val => {
    modelValue.value = valueToString(val, componentType.value, encrypted.value);
  },
});

const placeholder = computed(() => (encrypted.value ? $t('sys.config.encryptedPlaceholder') : ''));

const showOptions = computed(() => isOptionsComponent(componentType.value));

const options = computed(() => resolveOptions(props.item));

const isTextarea = computed(() => componentType.value === 'Textarea');

const isNumber = computed(() => componentType.value === 'InputNumber');
</script>

<template>
  <component
    :is="renderComponent"
    v-model:[modelPropName]="nativeValue"
    class="w-full"
    :allow-clear="showOptions ? true : undefined"
    :disabled="readonly || undefined"
    :readonly="readonly || undefined"
    :options="showOptions ? options : undefined"
    :placeholder="placeholder"
    :rows="isTextarea ? 3 : undefined"
    :string-mode="isNumber ? false : undefined"
  />
</template>
