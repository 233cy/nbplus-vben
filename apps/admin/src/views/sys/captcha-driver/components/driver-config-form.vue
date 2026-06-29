<script setup lang="ts">
import type { CaptchaDriverApi } from '#/api/sys/captchaDriver';

import { Form, FormItem, Input, InputNumber, Select, Switch } from 'ant-design-vue';

interface Props {
  driver: CaptchaDriverApi.DriverItem;
}

defineProps<Props>();
const config = defineModel<Record<string, any>>('config', { required: true });

function updateValue(key: string, value: any) {
  config.value = { ...config.value, [key]: value };
}
</script>

<template>
  <Form layout="vertical" :disabled="!driver.isValid">
    <FormItem v-for="field in driver.schema" :key="field.key" :label="field.label">
      <Switch v-if="field.component === 'Switch'" :checked="!!config[field.key]" @change="val => updateValue(field.key, val)" />
      <InputNumber v-else-if="field.component === 'InputNumber'" :value="config[field.key] ?? field.default" class="w-full" @change="val => updateValue(field.key, val)" />
      <Select
        v-else-if="field.component === 'Select'"
        :value="config[field.key] ?? field.default"
        :options="field.options"
        class="w-full"
        @change="val => updateValue(field.key, val)"
      />
      <Input v-else :value="config[field.key] ?? field.default" @change="e => updateValue(field.key, e.target.value)" />
    </FormItem>
  </Form>
</template>
