<script setup lang="ts">
import type { NotificationChannelApi } from '#/api/sys/notificationChannel';

import { computed, ref, watch } from 'vue';

import { FormItem, Input, InputNumber, InputPassword, Select, Switch } from 'ant-design-vue';

interface Props {
  gateway?: string;
  value?: Record<string, any>;
  gatewaySchemas?: Record<string, NotificationChannelApi.SchemaField[]>;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  gateway: '',
  value: () => ({}),
  gatewaySchemas: () => ({}),
  disabled: false,
});

const emit = defineEmits<{ 'update:value': [value: Record<string, any>] }>();

const config = ref<Record<string, any>>({ ...props.value });

watch(
  () => props.value,
  (v) => {
    config.value = { ...(v || {}) };
  },
  { deep: true },
);

const activeFields = computed(() => {
  if (!props.gateway) return [];
  return props.gatewaySchemas?.[props.gateway] || [];
});

function updateField(key: string, value: any) {
  config.value[key] = value;
  emit('update:value', { ...config.value });
}
</script>

<template>
  <div class="space-y-4">
    <FormItem
      v-for="field in activeFields"
      :key="field.key"
      :label="field.label"
      :required="field.required"
    >
      <Select
        v-if="field.component === 'Select'"
        :value="config[field.key] ?? field.default"
        :options="field.options"
        :disabled="disabled"
        class="w-full"
        @change="(value: any) => updateField(field.key, value)"
      />
      <InputPassword
        v-else-if="field.component === 'InputPassword'"
        :value="config[field.key] ?? field.default"
        :disabled="disabled"
        @change="(e: any) => updateField(field.key, e.target.value)"
      />
      <InputNumber
        v-else-if="field.component === 'InputNumber'"
        :value="config[field.key] ?? field.default"
        :disabled="disabled"
        class="w-full"
        @change="(value: any) => updateField(field.key, value)"
      />
      <Switch
        v-else-if="field.component === 'Switch'"
        :checked="!!(config[field.key] ?? field.default)"
        :disabled="disabled"
        @change="(checked: any) => updateField(field.key, checked)"
      />
      <Input
        v-else
        :value="config[field.key] ?? field.default"
        :disabled="disabled"
        :placeholder="field.placeholder"
        @change="(e: any) => updateField(field.key, e.target.value)"
      />
      <div v-if="field.description" class="mt-1 text-xs text-gray-500">
        {{ field.description }}
      </div>
    </FormItem>
  </div>
</template>
