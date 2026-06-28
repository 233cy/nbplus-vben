<script setup lang="ts">
import type { MenuAdminApi } from '#/api/admin/sys/menuAdmin';

import { CheckboxGroup, Form, FormItem, Input, Modal } from 'ant-design-vue';

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  genItem: MenuAdminApi.MenuItem | null;
  genPrefix: string;
  genSelected: string[];
  permissionOptions: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'update:genPrefix': [value: string];
  'update:genSelected': [value: string[]];
  submit: [];
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
    :title="$t('dev.menu.permission.generateTitle', { title: genItem?.title ?? '' })"
    :confirm-loading="loading"
    width="480px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form layout="vertical" class="mt-4">
      <FormItem :label="$t('dev.menu.fields.permission')" required>
        <Input v-model:value="genPrefix" :placeholder="$t('dev.menu.placeholder.permissionPrefix')" />
      </FormItem>
      <FormItem :label="$t('dev.menu.permission.standardPermissions')" required>
        <CheckboxGroup v-model:value="genSelected" :options="permissionOptions" />
      </FormItem>
    </Form>
  </Modal>
</template>
