<script setup lang="ts">
import { Button, Form, FormItem, Input, Modal, Select } from 'ant-design-vue';

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  controllerPrefix: string;
  permissionPrefix: string;
  methods: { label: string; value: string }[];
  selected: string;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'update:controllerPrefix': [value: string];
  'update:permissionPrefix': [value: string];
  'update:selected': [value: string];
  scan: [];
  pick: [];
}>();

const showVisible = defineModel<boolean>('visible', { required: true });
const controllerPrefix = defineModel<string>('controllerPrefix', { required: true });
const permissionPrefix = defineModel<string>('permissionPrefix', { required: true });
const selected = defineModel<string>('selected', { required: true });

function handleScan() {
  emit('scan');
}

function handleOk() {
  emit('pick');
}

function handleCancel() {
  showVisible.value = false;
}
</script>

<template>
  <Modal
    v-model:open="showVisible"
    :title="$t('dev.menu.permission.pickTitle')"
    width="560px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form layout="vertical" class="mt-4">
      <FormItem :label="$t('dev.menu.permission.controllerPrefix')" required>
        <div class="flex gap-2">
          <Input v-model:value="controllerPrefix" :placeholder="$t('dev.menu.placeholder.controllerPrefix')" class="flex-1" />
          <Button :loading="loading" @click="handleScan">{{ $t('dev.menu.permission.scan') }}</Button>
        </div>
      </FormItem>
      <FormItem :label="$t('dev.menu.permission.permissionPrefix')">
        <Input v-model:value="permissionPrefix" :placeholder="$t('dev.menu.placeholder.permissionPrefix')" />
      </FormItem>
      <FormItem :label="$t('dev.menu.permission.method')">
        <Select
          v-model:value="selected"
          :loading="loading"
          :options="methods"
          :placeholder="$t('dev.menu.permission.methodPlaceholder')"
          class="w-full"
          show-search
          option-filter-prop="label"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
