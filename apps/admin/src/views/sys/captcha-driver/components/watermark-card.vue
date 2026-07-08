<script setup lang="ts">
import type { CaptchaDriverApi } from '#/api/sys/captchaDriver';

import { IconifyIcon } from '@vben/icons';

import { Button, Card, Form, FormItem, Input, InputNumber } from 'ant-design-vue';

import { $t } from '#/locales';

import { useCaptchaDriverPermission } from '../permissions';

interface Props {
  saving?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'save'): void;
}>();

const { canWatermark } = useCaptchaDriverPermission();

const config = defineModel<CaptchaDriverApi.WatermarkConfig>('config', { required: true });

function updateColor(value: string) {
  config.value = { ...config.value, color: value };
}

function updateText(value: string) {
  config.value = { ...config.value, text: value };
}

function updateFontsize(value: number) {
  config.value = { ...config.value, fontsize: value };
}
</script>

<template>
  <Card :title="$t('sys.captcha-driver.watermarkTitle')">
    <Form layout="vertical">
      <FormItem :label="$t('sys.captcha-driver.watermarkText')">
        <Input :value="config.text" :placeholder="$t('sys.captcha-driver.watermarkTextPlaceholder')" @change="e => updateText(e.target.value || '')" />
      </FormItem>
      <FormItem :label="$t('sys.captcha-driver.watermarkColor')">
        <div class="flex items-center gap-2">
          <input :value="config.color" type="color" class="h-8 w-10 cursor-pointer rounded border" @input="e => updateColor((e.target as HTMLInputElement).value || '')" />
          <Input :value="config.color" class="flex-1" placeholder="#ffffff" @change="e => updateColor(e.target.value || '')" />
        </div>
      </FormItem>
      <FormItem :label="$t('sys.captcha-driver.watermarkFontsize')">
        <InputNumber :value="config.fontsize" :min="8" :max="32" class="w-full" @change="val => updateFontsize(val as number)" />
      </FormItem>
    </Form>
    <div class="mt-2 flex justify-end">
      <Button type="primary" size="small" :loading="saving" :disabled="!canWatermark" @click="emit('save')">
        <template #icon>
          <IconifyIcon icon="ant-design:save-outlined" />
        </template>
        {{ $t('sys.config.save') }}
      </Button>
    </div>
  </Card>
</template>
