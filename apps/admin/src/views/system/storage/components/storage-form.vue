<script setup lang="ts">
import type { StorageApi } from '#/api/system/storage';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Form, FormItem, Input, InputNumber, InputPassword, Select, Switch, message } from 'ant-design-vue';

import { createStorageApi, updateStorageApi } from '#/api/system/storage';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  onConfirm: handleSubmit,
  onOpenChange: handleOpenChange,
});

const schemas = ref<StorageApi.DriverSchema[]>([]);
const form = ref<Partial<StorageApi.StorageItem>>({});
const isEdit = ref(false);
const formRef = ref();

function handleOpenChange(isOpen: boolean) {
  if (!isOpen) {
    return;
  }

  const data = drawerApi.getData<{ form?: Partial<StorageApi.StorageItem>; schemas?: StorageApi.DriverSchema[] }>();
  schemas.value = data?.schemas || [];
  form.value = { ...(data?.form || {}) };
  isEdit.value = !!form.value.id;

  // 新增时按当前引擎填充默认配置
  if (!isEdit.value && form.value.engine && schemas.value.length > 0) {
    const schema = schemas.value.find((s) => s.engine === form.value.engine);
    if (schema) {
      const defaults: Record<string, any> = {};
      schema.schema.forEach((field) => {
        defaults[field.key] = field.default;
      });
      form.value.config = defaults;
    }
  }
}

const engineOptions = computed(() =>
  schemas.value.map((s) => ({
    label: s.label,
    value: s.engine,
  })),
);

const activeSchema = computed(() => {
  const schema = schemas.value.find((s) => s.engine === form.value.engine);
  return schema?.schema || [];
});

function onEngineChange(engine: string) {
  const schema = schemas.value.find((s) => s.engine === engine);
  const defaults: Record<string, any> = {};
  schema?.schema.forEach((field) => {
    defaults[field.key] = field.default;
  });
  form.value = { ...form.value, engine, config: defaults };
}

function updateConfig(key: string, value: any) {
  form.value = {
    ...form.value,
    config: { ...(form.value.config || {}), [key]: value },
  };
}

async function handleSubmit() {
  // 表单基础校验
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  drawerApi.lock();
  try {
    if (isEdit.value) {
      await updateStorageApi(form.value as StorageApi.StorageItem);
    } else {
      await createStorageApi(form.value as StorageApi.SaveParams);
    }
    message.success($t('system.storage.saveSuccess'));
    drawerApi.close();
    emit('success');
  } finally {
    drawerApi.unlock();
  }
}
</script>

<template>
  <Drawer :title="isEdit ? $t('system.storage.edit') : $t('system.storage.create')">
    <Form ref="formRef" layout="vertical" :model="form">
      <FormItem :label="$t('system.storage.fields.name')" name="name" :rules="[{ required: true, message: $t('system.storage.fields.name') + '必填' }]">
        <Input v-model:value="form.name" :placeholder="$t('system.storage.fields.name')" />
      </FormItem>
      <FormItem :label="$t('system.storage.fields.code')" name="code" :rules="[{ required: true, message: $t('system.storage.fields.code') + '必填' }]">
        <Input v-model:value="form.code" :disabled="isEdit" :placeholder="$t('system.storage.fields.code')" />
      </FormItem>
      <FormItem :label="$t('system.storage.fields.engine')" name="engine" :rules="[{ required: true, message: $t('system.storage.fields.engine') + '必填' }]">
        <Select :value="form.engine" :options="engineOptions" class="w-full" @change="(value: any) => onEngineChange(value as string)" />
      </FormItem>
      <FormItem :label="$t('system.storage.fields.sort')" name="sort">
        <InputNumber v-model:value="form.sort" class="w-full" :min="0" />
      </FormItem>

      <div class="mt-4 border-t pt-4">
        <h4 class="mb-2 font-medium">{{ $t('system.storage.configForm') }}</h4>
        <FormItem v-for="field in activeSchema" :key="field.key" :label="field.label">
          <Switch
            v-if="field.component === 'Switch'"
            :checked="!!form.config?.[field.key]"
            @change="(checked: any) => updateConfig(field.key, checked)"
          />
          <InputNumber
            v-else-if="field.component === 'InputNumber'"
            :value="form.config?.[field.key] ?? field.default"
            class="w-full"
            @change="(value: any) => updateConfig(field.key, value)"
          />
          <Select
            v-else-if="field.component === 'Select'"
            :value="form.config?.[field.key] ?? field.default"
            :options="field.options"
            class="w-full"
            @change="(value: any) => updateConfig(field.key, value)"
          />
          <InputPassword
            v-else-if="field.component === 'InputPassword'"
            :value="form.config?.[field.key] ?? field.default"
            @change="(e: any) => updateConfig(field.key, e.target.value)"
          />
          <Input
            v-else
            :value="form.config?.[field.key] ?? field.default"
            @change="(e: any) => updateConfig(field.key, e.target.value)"
          />
        </FormItem>
      </div>
    </Form>
  </Drawer>
</template>
