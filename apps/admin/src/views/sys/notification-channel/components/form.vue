<script setup lang="ts">
import type { NotificationChannelApi } from '#/api/sys/notificationChannel';

import { computed, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Button, Form, FormItem, Input, InputNumber, InputPassword, Select, Switch, Textarea } from 'ant-design-vue';

import { createNotificationChannelApi, getNotificationChannelDriverSchemasApi, updateNotificationChannelApi } from '#/api/sys/notificationChannel';
import SmsGatewayConfigForm from './SmsGatewayConfigForm.vue';
import DictRadio from '#/components/dict/DictRadio.vue';
import { $t } from '#/locales';
import { stringToCode } from '#/utils/string-to-code';

import { useNotificationChannelPermission } from '../permissions';

const emit = defineEmits<{ success: [] }>();

const { canUpdate } = useNotificationChannelPermission();

const schemas = ref<NotificationChannelApi.DriverSchema[]>([]);
const form = ref<Partial<NotificationChannelApi.ChannelItem>>({});
const formRef = ref();
const isEdit = ref(false);
const isReadonly = ref(false);

const title = computed(() => {
  if (isReadonly.value) return $t('sys.notification-channel.detail');
  return isEdit.value ? $t('sys.notification-channel.edit') : $t('sys.notification-channel.create');
});

const driverOptions = computed(() =>
  schemas.value.map(item => ({
    label: item.label,
    value: item.code,
  })),
);

const activeSchema = computed(() => {
  const driver = form.value.driver;
  return schemas.value.find(item => item.code === driver)?.schema || [];
});

const providerDsnTemplates: Record<string, string> = {
  qq: 'smtp://USERNAME:PASSWORD@smtp.qq.com:465?encryption=ssl',
  '163': 'smtp://USERNAME:PASSWORD@smtp.163.com:465?encryption=ssl',
  gmail: 'smtp://USERNAME:PASSWORD@smtp.gmail.com:465?encryption=ssl',
  outlook: 'smtp://USERNAME:PASSWORD@smtp.office365.com:587?encryption=tls',
  custom: '',
};

watch(
  () => form.value.config?.provider,
  (provider, prevProvider) => {
    if (!provider || !form.value.config || provider === prevProvider) return;

    const currentDsn = String(form.value.config.dsn || '').trim();
    // 仅在 DSN 为空或仍保留示例模板时才自动填充，避免覆盖用户已修改的内容
    const isTemplate = Object.values(providerDsnTemplates).includes(currentDsn);
    if (currentDsn !== '' && !isTemplate) return;

    const template = providerDsnTemplates[provider as string];
    if (template === undefined) return;
    form.value.config = { ...form.value.config, dsn: template };
  },
);

async function loadSchemas() {
  if (schemas.value.length > 0) return;
  schemas.value = await getNotificationChannelDriverSchemasApi();
}

function buildDefaultConfig(driverCode?: string): Record<string, any> {
  const driver = schemas.value.find(item => item.code === driverCode);
  if (!driver) return {};

  const defaults: Record<string, any> = {};
  driver.schema.forEach(field => {
    defaults[field.key] = field.default ?? '';
  });
  return defaults;
}

function onDriverChange(driver: string) {
  form.value = {
    ...form.value,
    driver,
    config: buildDefaultConfig(driver),
  };
}

function updateConfig(key: string, value: any) {
  form.value = {
    ...form.value,
    config: { ...form.value.config, [key]: value },
  };
}

function generateCodeFromName() {
  if (isEdit.value || isReadonly.value) return;
  form.value.code = stringToCode(form.value.name ?? '');
}

async function handleSubmit() {
  if (isReadonly.value) {
    drawerApi.close();
    return;
  }

  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  drawerApi.lock();
  try {
    const payload: NotificationChannelApi.SaveParams = {
      code: form.value.code,
      name: form.value.name ?? '',
      driver: form.value.driver ?? '',
      config: form.value.config || {},
      status: form.value.status ?? 1,
      sort: form.value.sort ?? 0,
      isDefault: form.value.isDefault ?? 2,
    };

    await (isEdit.value && form.value.id ? updateNotificationChannelApi({ id: form.value.id, ...payload }) : createNotificationChannelApi(payload));

    emit('success');
    drawerApi.close();
  } finally {
    drawerApi.unlock();
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;

    await loadSchemas();

    const data = drawerApi.getData<Partial<NotificationChannelApi.ChannelItem> & { readonly?: boolean }>();
    form.value = {};
    formRef.value?.resetFields?.();

    isReadonly.value = data?.readonly ?? false;

    if (data?.id) {
      isEdit.value = true;
      form.value = { ...data };
    } else {
      isEdit.value = false;
      const firstDriver = schemas.value[0]?.code || '';
      form.value = {
        name: '',
        code: '',
        driver: firstDriver,
        config: buildDefaultConfig(firstDriver),
        status: 1,
        sort: 0,
        isDefault: 2,
      };
    }
  },
});
</script>

<template>
  <Drawer :title="title" :show-confirm-button="!isReadonly && (isEdit ? canUpdate : true)">
    <Form ref="formRef" layout="vertical" :model="form">
      <FormItem :label="$t('sys.notification-channel.fields.name')" name="name" :rules="[{ required: true, message: `${$t('sys.notification-channel.fields.name') }必填` }]">
        <Input v-model:value="form.name" :disabled="isReadonly" :placeholder="$t('sys.notification-channel.fields.name')" />
      </FormItem>

      <FormItem :label="$t('sys.notification-channel.fields.code')" name="code" :rules="[{ required: true, message: `${$t('sys.notification-channel.fields.code') }必填` }]">
        <Input v-model:value="form.code" :disabled="isEdit || isReadonly" :placeholder="$t('sys.notification-channel.fields.code')">
          <template v-if="!isEdit && !isReadonly" #addonAfter>
            <Button type="link" size="small" @click="generateCodeFromName">
              {{ $t('sys.user-dept.generateCode') }}
            </Button>
          </template>
        </Input>
      </FormItem>

      <FormItem :label="$t('sys.notification-channel.fields.driver')" name="driver" :rules="[{ required: true, message: `${$t('sys.notification-channel.fields.driver') }必填` }]">
        <Select :value="form.driver" :options="driverOptions" :disabled="isEdit || isReadonly" class="w-full" @change="(value: any) => onDriverChange(value as string)" />
      </FormItem>

      <FormItem :label="$t('sys.notification-channel.fields.sort')" name="sort">
        <InputNumber v-model:value="form.sort" :disabled="isReadonly" class="w-full" :min="0" />
      </FormItem>

      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('common.status')" name="status">
          <DictRadio v-model:value="form.status" code="is_enable" value-type="number" :disabled="isReadonly" />
        </FormItem>
        <FormItem :label="$t('sys.notification-channel.fields.isDefault')" name="isDefault">
          <DictRadio v-model:value="form.isDefault" code="is_yes_no" value-type="number" :disabled="isReadonly" />
        </FormItem>
      </div>

      <div v-if="activeSchema.length > 0" class="mt-4 border-t pt-4">
        <h4 class="mb-2 font-medium">{{ $t('sys.notification-channel.configForm') }}</h4>
        <FormItem v-for="field in activeSchema" :key="field.key" :label="field.label">
          <Switch
            v-if="field.component === 'Switch'"
            :checked="!!form.config?.[field.key]"
            :disabled="isReadonly"
            @change="(checked: any) => updateConfig(field.key, checked)"
          />
          <InputNumber
            v-else-if="field.component === 'InputNumber'"
            :value="form.config?.[field.key] ?? field.default"
            :disabled="isReadonly"
            class="w-full"
            @change="(value: any) => updateConfig(field.key, value)"
          />
          <Select
            v-else-if="field.component === 'Select'"
            :value="form.config?.[field.key] ?? field.default"
            :options="field.options"
            :disabled="isReadonly"
            class="w-full"
            @change="(value: any) => updateConfig(field.key, value)"
          />
          <InputPassword
            v-else-if="field.component === 'InputPassword'"
            :value="form.config?.[field.key] ?? field.default"
            :disabled="isReadonly"
            @change="(e: any) => updateConfig(field.key, e.target.value)"
          />
          <Textarea
            v-else-if="field.component === 'Textarea'"
            :value="form.config?.[field.key] ?? field.default"
            :disabled="isReadonly"
            :placeholder="field.placeholder"
            :rows="4"
            @change="(e: any) => updateConfig(field.key, (e?.target as HTMLTextAreaElement)?.value || '')"
          />
          <SmsGatewayConfigForm
            v-else-if="field.component === 'SmsGatewayConfigForm'"
            :gateway="form.config?.gateway"
            :gateway-schemas="field.gatewaySchemas"
            :value="form.config?.[field.key] ?? {}"
            :disabled="isReadonly"
            @update:value="(v) => updateConfig(field.key, v)"
          />
          <Input
            v-else
            :value="form.config?.[field.key] ?? field.default"
            :disabled="isReadonly"
            :placeholder="field.placeholder"
            @change="(e: any) => updateConfig(field.key, e.target.value)"
          />
          <div v-if="field.description" class="mt-1 text-xs text-gray-500">
            {{ field.description }}
          </div>
        </FormItem>
      </div>
    </Form>
  </Drawer>
</template>
