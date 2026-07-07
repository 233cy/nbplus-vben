<script setup lang="ts">
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { CheckboxGroup, Form, FormItem, Input, Modal } from 'ant-design-vue';

defineProps<{
  genItem: MenuAdminApi.MenuItem | null;
  loading: boolean;
  permissionOptions: { label: string; value: string }[];
  visible: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  'update:genPrefix': [value: string];
  'update:genSelected': [value: string[]];
  'update:visible': [visible: boolean];
}>();

const showVisible = defineModel<boolean>('visible', { required: true });
const genPrefix = defineModel<string>('genPrefix', { required: true });
const genSelected = defineModel<string[]>('genSelected', { required: true });

function handleOk() {
  emit('submit');
}

function handleCancel() {
  showVisible.value = false;
}
</script>

<template>
  <Modal
    v-model:open="showVisible"
    :title="$t('sys.menu.permission.generateTitle', { title: genItem?.title ?? '' })"
    :confirm-loading="loading"
    width="480px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form layout="vertical" class="mt-4">
      <FormItem :label="$t('sys.menu.fields.permission')" required>
        <Input v-model:value="genPrefix" :placeholder="$t('sys.menu.placeholder.permissionPrefix')" />
      </FormItem>
      <FormItem :label="$t('sys.menu.permission.standardPermissions')" required>
        <CheckboxGroup v-model:value="genSelected" :options="permissionOptions" />
      </FormItem>
    </Form>
  </Modal>
</template>
