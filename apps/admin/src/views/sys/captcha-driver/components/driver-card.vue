<script setup lang="ts">
import type { CaptchaDriverApi } from '#/api/sys/captchaDriver.js';

import { IconifyIcon } from '@vben/icons';

import { Badge, Button, Card, Popconfirm, Switch, Tag, Tooltip } from 'ant-design-vue';

import { $t } from '#/locales';

import { useCaptchaDriverPermission } from '../permissions';
import DriverConfigForm from './driver-config-form.vue';

interface Props {
  driver: CaptchaDriverApi.DriverItem;
  saving?: boolean;
}

defineProps<Props>();

const { canUpdate, canPreview } = useCaptchaDriverPermission();

const emit = defineEmits<{
  (e: 'toggle', enabled: boolean): void;
  (e: 'save'): void;
  (e: 'preview'): void;
}>();

const config = defineModel<Record<string, any>>('config', { required: true });
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <span class="font-medium">{{ driver.label }}</span>
        <Tag v-if="!driver.isValid" color="red">{{ $t('sys.captcha-driver.invalid') }}</Tag>
        <Badge v-else-if="driver.isEnabled" status="success" :text="$t('sys.captcha-driver.enabled')" />
        <Badge v-else status="default" :text="$t('sys.captcha-driver.disabled')" />
      </div>
    </template>

    <template #extra>
      <Tooltip v-if="!driver.isValid" :title="$t('sys.captcha-driver.invalidTip')">
        <Switch :checked="false" disabled />
      </Tooltip>
      <Popconfirm v-else :title="driver.isEnabled ? $t('sys.captcha-driver.disableConfirm') : $t('sys.captcha-driver.enableConfirm')" @confirm="emit('toggle', !driver.isEnabled)">
        <Switch :checked="driver.isEnabled" :disabled="!canUpdate" />
      </Popconfirm>
    </template>

    <DriverConfigForm :driver="driver" v-model:config="config" />

    <div class="flex justify-end gap-2">
      <Button size="small" :disabled="!driver.isValid || !canPreview" @click="emit('preview')">
        <template #icon>
          <IconifyIcon icon="ant-design:eye-outlined" />
        </template>
        {{ $t('sys.captcha-driver.preview') }}
      </Button>
      <Button type="primary" size="small" :loading="saving" :disabled="!driver.isValid || !canUpdate" @click="emit('save')">
        <template #icon>
          <IconifyIcon icon="ant-design:save-outlined" />
        </template>
        {{ $t('sys.config.save') }}
      </Button>
    </div>
  </Card>
</template>
