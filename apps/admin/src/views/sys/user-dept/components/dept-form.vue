<script setup lang="ts">
import type { DeptApi } from '#/api/sys/userDept';

import { computed } from 'vue';

import { Button, Form, FormItem, Input, Modal, Select, TreeSelect } from 'ant-design-vue';

import { $t } from '#/locales';
import { stringToCode } from '#/utils/string-to-code';

import { createDefaultForm, createStatusOptions } from '../data';

const props = defineProps<{
  isDetail: boolean;
  isEdit: boolean;
  loading: boolean;
  title: string;
  treeData: { children: any[]; label: string; value: string }[];
  treeExpandedKeys: string[];
  treeLoading: boolean;
  visible: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  'update:visible': [visible: boolean];
}>();

const form = defineModel<DeptApi.SaveParams & { id?: string }>('form', {
  required: true,
  default: () => createDefaultForm(),
});

const showVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
});

const statusOptions = createStatusOptions($t);

function generateCodeFromName() {
  form.value.code = stringToCode(form.value.name ?? '');
}

function handleCancel() {
  showVisible.value = false;
}

function handleOk() {
  if (props.isDetail) {
    handleCancel();
    return;
  }
  emit('submit');
}
</script>

<template>
  <Modal
    v-model:open="showVisible"
    :title="title"
    :confirm-loading="loading"
    :ok-text="isDetail ? undefined : $t('common.confirm')"
    :cancel-text="$t('common.cancel')"
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <template v-if="isDetail" #footer>
      <Button @click="handleCancel">{{ $t('common.cancel') }}</Button>
    </template>

    <Form :model="form" layout="vertical" class="mt-4">
      <FormItem :label="$t('sys.user-dept.fields.parentId')">
        <TreeSelect
          v-model:value="form.parentId"
          :tree-data="treeData"
          :loading="treeLoading"
          :allow-clear="true"
          :disabled="isDetail"
          :placeholder="$t('sys.user-dept.placeholder.parentId')"
          :field-names="{ title: 'label', value: 'value', children: 'children' } as any"
          :tree-default-expanded-keys="treeExpandedKeys"
          class="w-full"
        />
      </FormItem>

      <FormItem :label="$t('sys.user-dept.fields.name')" required>
        <Input v-model:value="form.name" :disabled="isDetail" :placeholder="$t('sys.user-dept.placeholder.name')" />
      </FormItem>

      <FormItem :label="$t('sys.user-dept.fields.code')">
        <Input v-model:value="form.code" :disabled="isDetail || isEdit" :placeholder="$t('sys.user-dept.placeholder.code')">
          <template v-if="!isEdit && !isDetail" #addonAfter>
            <Button type="link" size="small" @click="generateCodeFromName">
              {{ $t('sys.user-dept.generateCode') }}
            </Button>
          </template>
        </Input>
      </FormItem>

      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('sys.user-dept.fields.leaderId')">
          <Input v-model:value="form.leaderId" :disabled="isDetail" :placeholder="$t('sys.user-dept.placeholder.leaderId')" />
        </FormItem>
        <FormItem :label="$t('sys.user-dept.fields.status')">
          <Select v-model:value="form.status" :disabled="isDetail" :options="statusOptions" class="w-full" />
        </FormItem>
      </div>

      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('sys.user-dept.fields.phone')">
          <Input v-model:value="form.phone" :disabled="isDetail" :placeholder="$t('sys.user-dept.placeholder.phone')" />
        </FormItem>
        <FormItem :label="$t('sys.user-dept.fields.email')">
          <Input v-model:value="form.email" :disabled="isDetail" :placeholder="$t('sys.user-dept.placeholder.email')" />
        </FormItem>
      </div>
    </Form>
  </Modal>
</template>
