<script setup lang="ts">
import { Form, FormItem, Input, Modal, Select, Textarea } from 'ant-design-vue';

import { $t } from '#/locales';

interface DictFormModel {
  name: string;
  code: string;
  groups: string;
  remark: string;
  status: number;
}

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  isEdit: boolean;
  groupOptions: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  submit: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });
const form = defineModel<DictFormModel>('form', { required: true });

const statusOptions = [
  { label: $t('common.enabled'), value: 1 },
  { label: $t('common.disabled'), value: 2 },
];

function handleOk() {
  emit('submit');
}

function handleCancel() {
  visible.value = false;
}
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="isEdit ? $t('sys.dict.editDict') : $t('sys.dict.addDict')"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form :model="form" layout="vertical" class="mt-4">
      <FormItem :label="$t('sys.dict.fields.name')" required>
        <Input v-model:value="form.name" :placeholder="$t('sys.dict.placeholder.name')" />
      </FormItem>
      <FormItem :label="$t('sys.dict.fields.code')" required>
        <Input v-model:value="form.code" :disabled="isEdit" :placeholder="$t('sys.dict.placeholder.code')" />
      </FormItem>
      <FormItem :label="$t('sys.dict.fields.groups')">
        <Select
          v-model:value="form.groups"
          :options="groupOptions"
          :placeholder="$t('sys.dict.placeholder.groups')"
          allow-clear
          show-search
        />
      </FormItem>
      <FormItem :label="$t('sys.dict.fields.status')">
        <Select v-model:value="form.status" :options="statusOptions" />
      </FormItem>
      <FormItem :label="$t('sys.dict.fields.remark')">
        <Textarea v-model:value="form.remark" :rows="2" />
      </FormItem>
    </Form>
  </Modal>
</template>
