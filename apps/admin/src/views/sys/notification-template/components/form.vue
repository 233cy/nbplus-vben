<script setup lang="ts">
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { Button, Form, FormItem, Input, InputNumber, Textarea } from 'ant-design-vue';
import DictRadio from '#/components/dict/DictRadio.vue';

import { createNotificationTemplateApi, updateNotificationTemplateApi } from '#/api/sys/notificationTemplate';
import CodeInput from '#/components/code-input/index.vue';
import { $t } from '#/locales';

import { useNotificationTemplatePermission } from '../permissions';
import TemplateItemEditor from './template-item-editor.vue';

const emit = defineEmits<{ success: [] }>();

const { canUpdate } = useNotificationTemplatePermission();

interface VariableRow {
  key: string;
  desc: string;
}

const form = ref<Partial<NotificationTemplateApi.SaveParams & { id?: string }>>({});
const formRef = ref();
const isEdit = ref(false);
const isReadonly = ref(false);
const templateItems = ref<NotificationTemplateApi.TemplateItemSave[]>([]);
const variableRows = ref<VariableRow[]>([]);

const title = computed(() => {
  if (isReadonly.value) return $t('sys.notification-template.detail');
  return isEdit.value ? $t('sys.notification-template.edit') : $t('sys.notification-template.create');
});

function variablesToRows(variables?: Record<string, string>): VariableRow[] {
  const rows: VariableRow[] = [];
  if (!variables) return rows;
  Object.entries(variables).forEach(([key, desc]) => {
    rows.push({ key, desc: String(desc ?? '') });
  });
  return rows;
}

function rowsToVariables(rows: VariableRow[]): Record<string, string> {
  const result: Record<string, string> = {};
  rows.forEach((row) => {
    const key = row.key.trim();
    if (key) {
      result[key] = row.desc.trim();
    }
  });
  return result;
}

function addVariable() {
  variableRows.value.push({ key: '', desc: '' });
}

function removeVariable(index: number) {
  variableRows.value.splice(index, 1);
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
    const payload: NotificationTemplateApi.SaveParams = {
      code: form.value.code,
      name: form.value.name ?? '',
      bizType: form.value.bizType,
      variables: rowsToVariables(variableRows.value),
      remark: form.value.remark,
      status: form.value.status ?? 1,
      sort: form.value.sort ?? 0,
      items: templateItems.value,
    };

    if (isEdit.value && form.value.id) {
      await updateNotificationTemplateApi({ id: form.value.id, ...payload });
    } else {
      await createNotificationTemplateApi(payload);
    }

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

    const data = drawerApi.getData<NotificationTemplateApi.Template & { readonly?: boolean }>();
    form.value = {};
    templateItems.value = [];
    formRef.value?.resetFields?.();

    isReadonly.value = data?.readonly ?? false;

    if (data?.id) {
      isEdit.value = true;
      form.value = { ...data };
      variableRows.value = variablesToRows(data.variables);
      templateItems.value = (data.items || []).map(item => ({
        channelType: item.channelType,
        remark: item.remark,
        subject: item.subject,
        summary: item.summary,
        content: item.content,
        extra: item.extra || {},
        status: item.status,
      }));
    } else {
      isEdit.value = false;
      form.value = {
        name: '',
        code: '',
        bizType: 'system',
        remark: '',
        status: 1,
        sort: 0,
      };
      variableRows.value = [];
    }
  },
});
</script>

<template>
  <Drawer :title="title" :show-confirm-button="!isReadonly && (isEdit ? canUpdate : true)">
    <Form ref="formRef" layout="vertical" :model="form">
      <FormItem :label="$t('sys.notification-template.fields.name')" name="name" :rules="[{ required: true, message: $t('sys.notification-template.fields.name') + '必填' }]">
        <Input v-model:value="form.name" :disabled="isReadonly" :placeholder="$t('sys.notification-template.fields.name')" />
      </FormItem>

      <FormItem :label="$t('sys.notification-template.fields.code')" name="code" :rules="[{ required: true, message: $t('sys.notification-template.fields.code') + '必填' }]">
        <CodeInput
          v-model="form.code"
          :name="form.name"
          :disabled="isEdit || isReadonly"
          :placeholder="$t('sys.notification-template.fields.code')"
        />
      </FormItem>

      <FormItem :label="$t('sys.notification-template.fields.bizType')" name="bizType">
        <Input v-model:value="form.bizType" :disabled="isReadonly" :placeholder="$t('sys.notification-template.fields.bizType')" />
      </FormItem>

      <FormItem :label="$t('sys.notification-template.fields.variables')">
        <div class="space-y-2">
          <div
            v-for="(row, index) in variableRows"
            :key="index"
            class="grid grid-cols-12 gap-2"
          >
            <Input
              v-model:value="row.key"
              :disabled="isReadonly"
              class="col-span-4"
              :placeholder="$t('sys.notification-template.variableKey')"
            />
            <Input
              v-model:value="row.desc"
              :disabled="isReadonly"
              class="col-span-7"
              :placeholder="$t('sys.notification-template.variableDesc')"
            />
            <Button
              v-if="!isReadonly"
              danger
              class="col-span-1"
              @click="removeVariable(index)"
            >
              -
            </Button>
          </div>
          <Button v-if="!isReadonly" type="dashed" block @click="addVariable">
            + {{ $t('sys.notification-template.addVariable') }}
          </Button>
        </div>
      </FormItem>

      <FormItem :label="$t('sys.notification-template.fields.remark')" name="remark">
        <Textarea v-model:value="form.remark" :disabled="isReadonly" :rows="2" />
      </FormItem>

      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('common.status')" name="status">
          <DictRadio v-model:value="form.status" code="is_enable" value-type="number" :disabled="isReadonly" />
        </FormItem>
        <FormItem :label="$t('sys.notification-template.fields.sort')" name="sort">
          <InputNumber v-model:value="form.sort" :disabled="isReadonly" class="w-full" :min="0" />
        </FormItem>
      </div>
    </Form>

    <div class="mt-4">
      <TemplateItemEditor v-model="templateItems" :is-readonly="isReadonly" :variables="form.variables" />
    </div>
  </Drawer>
</template>
