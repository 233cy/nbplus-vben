<script setup lang="ts">
import { Button, Form, FormItem, Input, Modal, Select } from 'ant-design-vue';

defineProps<{
  loading: boolean;
  methods: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  pick: [];
  scan: [];
  'update:controllerPrefix': [value: string];
  'update:permissionPrefix': [value: string];
  'update:selected': [value: string];
  'update:visible': [visible: boolean];
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
  <Modal v-model:open="showVisible" :title="$t('sys.menu.permission.pickTitle')" width="560px" @ok="handleOk" @cancel="handleCancel">
    <Form layout="vertical" class="mt-4">
      <FormItem :label="$t('sys.menu.permission.controllerPrefix')" required>
        <div class="flex gap-2">
          <Input v-model:value="controllerPrefix" :placeholder="$t('sys.menu.placeholder.controllerPrefix')" class="flex-1" />
          <Button :loading="loading" @click="handleScan">{{ $t('sys.menu.permission.scan') }}</Button>
        </div>
      </FormItem>
      <FormItem :label="$t('sys.menu.permission.permissionPrefix')">
        <Input v-model:value="permissionPrefix" :placeholder="$t('sys.menu.placeholder.permissionPrefix')" />
      </FormItem>
      <FormItem :label="$t('sys.menu.permission.method')">
        <Select
          v-model:value="selected"
          :loading="loading"
          :options="methods"
          :placeholder="$t('sys.menu.permission.methodPlaceholder')"
          class="w-full"
          show-search
          option-filter-prop="label"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
