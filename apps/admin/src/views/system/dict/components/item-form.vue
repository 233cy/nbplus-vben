<script setup lang="ts">
import { Form, FormItem, Input, Modal, Select, Tag } from 'ant-design-vue';

import { $t } from '#/locales';

import { createColorOptions } from '../data';

interface ItemFormModel {
  label: string;
  value: string;
  color: string;
  remark: string;
  sort: number;
  status: number;
}

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  isEdit: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });
const form = defineModel<ItemFormModel>('form', { required: true });

const statusOptions = [
  { label: $t('common.enabled'), value: 1 },
  { label: $t('common.disabled'), value: 2 },
];

const colorOptions = createColorOptions($t);

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
    :title="isEdit ? $t('system.dict.editItem') : $t('system.dict.addItem')"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form :model="form" layout="vertical" class="mt-4">
      <FormItem :label="$t('system.dict.itemFields.label')" required>
        <Input v-model:value="form.label" />
      </FormItem>
      <FormItem :label="$t('system.dict.itemFields.value')" required>
        <Input v-model:value="form.value" />
      </FormItem>
      <FormItem :label="$t('system.dict.itemFields.color')">
        <Select v-model:value="form.color" :options="colorOptions" allow-clear>
          <template #option="{ label, value: val }">
            <span v-if="val"><Tag :color="val">{{ label }}</Tag></span>
            <span v-else>{{ label }}</span>
          </template>
        </Select>
      </FormItem>
      <FormItem :label="$t('system.dict.fields.status')">
        <Select v-model:value="form.status" :options="statusOptions" />
      </FormItem>
      <FormItem :label="$t('system.dict.fields.remark')">
        <Input v-model:value="form.remark" />
      </FormItem>
      <FormItem :label="$t('system.dict.itemFields.sort')">
        <Input v-model:value="form.sort" type="number" />
      </FormItem>
    </Form>
  </Modal>
</template>
