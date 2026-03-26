<script setup lang="ts">
import type { CaptchaDriverApi } from '#/api/core/captchaDriver';

import { nextTick, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Alert, Badge, Button, Card, Form, FormItem, Input, InputNumber, message, Popconfirm, Select, Spin, Switch, Tag, Tooltip } from 'ant-design-vue';

import { getCaptchaDriversApi, getCaptchaWatermarkApi, previewCaptchaDriverApi, saveCaptchaWatermarkApi, updateCaptchaDriverApi } from '#/api';
import Verify from '#/components/verifition/Verify.vue';
import { $t } from '#/locales';

defineOptions({ name: 'CaptchaDriverPage' });

const loading = ref(false);
const drivers = ref<CaptchaDriverApi.DriverItem[]>([]);

async function loadDrivers() {
  loading.value = true;
  try {
    drivers.value = await getCaptchaDriversApi();
  } finally {
    loading.value = false;
  }
}

// watermark
const watermark = ref<CaptchaDriverApi.WatermarkConfig>({ fontsize: 12, color: '#ffffff', text: '' });
const watermarkSaving = ref(false);

async function loadWatermark() {
  watermark.value = await getCaptchaWatermarkApi();
}

async function handleSaveWatermark() {
  watermarkSaving.value = true;
  try {
    await saveCaptchaWatermarkApi(watermark.value);
    message.success($t('captcha.driver.saveSuccess'));
  } finally {
    watermarkSaving.value = false;
  }
}

onMounted(() => {
  loadDrivers();
  loadWatermark();
});

// 驱动配置
const editConfigs = ref<Record<string, Record<string, any>>>({});

function getEditConfig(driver: CaptchaDriverApi.DriverItem): Record<string, any> {
  if (!editConfigs.value[driver.id]) {
    editConfigs.value[driver.id] = { ...driver.config };
  }
  return editConfigs.value[driver.id]!;
}

const hasEnabled = () => drivers.value.some((d) => d.isEnabled && d.isValid);

async function handleToggle(driver: CaptchaDriverApi.DriverItem, enabled: boolean) {
  await updateCaptchaDriverApi({ id: driver.id, isEnabled: enabled });
  await loadDrivers();
}

const saving = ref<Record<string, boolean>>({});

async function handleSave(driver: CaptchaDriverApi.DriverItem) {
  saving.value[driver.id] = true;
  try {
    await updateCaptchaDriverApi({ id: driver.id, config: editConfigs.value[driver.id] });
    message.success($t('captcha.driver.saveSuccess'));
    await loadDrivers();
  } finally {
    saving.value[driver.id] = false;
  }
}

// 预览：用 Verify.vue + fetchFn 指向预览接口
const previewFetchFn = ref<(() => Promise<any>) | undefined>(undefined);
const verifyRef = ref<InstanceType<typeof Verify> | null>(null);

async function handlePreview(driver: CaptchaDriverApi.DriverItem) {
  previewFetchFn.value = () => previewCaptchaDriverApi(driver.type);
  await nextTick();
  verifyRef.value?.show();
}
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <Alert v-if="!loading && !hasEnabled()" :message="$t('captcha.driver.noDriverEnabled')" type="warning" show-icon class="mb-4" />

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card v-for="driver in drivers" :key="driver.id">
          <template #title>
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ driver.label }}</span>
              <Tag v-if="!driver.isValid" color="red">{{ $t('captcha.driver.invalid') }}</Tag>
              <Badge v-else-if="driver.isEnabled" status="success" :text="$t('captcha.driver.enabled')" />
              <Badge v-else status="default" :text="$t('captcha.driver.disabled')" />
            </div>
          </template>

          <template #extra>
            <Tooltip v-if="!driver.isValid" :title="$t('captcha.driver.invalidTip')">
              <Switch :checked="false" disabled />
            </Tooltip>
            <Popconfirm
              v-else
              :title="driver.isEnabled ? $t('captcha.driver.disableConfirm') : $t('captcha.driver.enableConfirm')"
              @confirm="handleToggle(driver, !driver.isEnabled)"
            >
              <Switch :checked="driver.isEnabled" />
            </Popconfirm>
          </template>

          <Form layout="vertical" :disabled="!driver.isValid">
            <FormItem v-for="field in driver.schema" :key="field.key" :label="field.label">
              <Switch v-if="field.component === 'Switch'" :checked="!!getEditConfig(driver)[field.key]" @change="(val) => (getEditConfig(driver)[field.key] = val)" />
              <InputNumber
                v-else-if="field.component === 'InputNumber'"
                :value="getEditConfig(driver)[field.key] ?? field.default"
                class="w-full"
                @change="(val) => (getEditConfig(driver)[field.key] = val)"
              />
              <Select
                v-else-if="field.component === 'Select'"
                :value="getEditConfig(driver)[field.key] ?? field.default"
                :options="field.options"
                class="w-full"
                @change="(val) => (getEditConfig(driver)[field.key] = val)"
              />
              <Input v-else :value="getEditConfig(driver)[field.key] ?? field.default" @change="(e) => (getEditConfig(driver)[field.key] = e.target.value)" />
            </FormItem>
          </Form>

          <div class="flex justify-end gap-2">
            <Button size="small" :disabled="!driver.isValid" @click="handlePreview(driver)">
              <template #icon>
                <IconifyIcon icon="ant-design:eye-outlined" />
              </template>
              {{ $t('captcha.driver.preview') }}
            </Button>
            <Button type="primary" size="small" :loading="saving[driver.id]" :disabled="!driver.isValid" @click="handleSave(driver)">
              <template #icon>
                <IconifyIcon icon="ant-design:save-outlined" />
              </template>
              {{ $t('config.save') }}
            </Button>
          </div>
        </Card>

        <!-- 水印配置卡片 -->
        <Card :title="$t('captcha.driver.watermarkTitle')">
          <Form layout="vertical">
            <FormItem :label="$t('captcha.driver.watermarkText')">
              <Input v-model:value="watermark.text" :placeholder="$t('captcha.driver.watermarkTextPlaceholder')" />
            </FormItem>
            <FormItem :label="$t('captcha.driver.watermarkColor')">
              <div class="flex items-center gap-2">
                <input v-model="watermark.color" type="color" class="h-8 w-10 cursor-pointer rounded border" />
                <Input v-model:value="watermark.color" class="flex-1" placeholder="#ffffff" />
              </div>
            </FormItem>
            <FormItem :label="$t('captcha.driver.watermarkFontsize')">
              <InputNumber v-model:value="watermark.fontsize" :min="8" :max="32" class="w-full" />
            </FormItem>
          </Form>
          <div class="mt-2 flex justify-end">
            <Button type="primary" size="small" :loading="watermarkSaving" @click="handleSaveWatermark">
              <template #icon>
                <IconifyIcon icon="ant-design:save-outlined" />
              </template>
              {{ $t('config.save') }}
            </Button>
          </div>
        </Card>
      </div>
    </Spin>

    <!-- 预览 Modal：用 Verify.vue mode=fixed，fetchFn 指向预览接口 -->
    <div class="hidden">
      <Verify ref="verifyRef" v-model:fetch-fn="previewFetchFn" />
    </div>
  </div>
</template>
