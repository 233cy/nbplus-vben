<script setup lang="ts">
import type { DeptApi } from '#/api/sys/dept';

import { computed } from 'vue';

import { Button, Form, FormItem, Input, Modal, Select, TreeSelect } from 'ant-design-vue';

import { $t } from '#/locales';
import { stringToCode } from '#/utils/string-to-code';

import { createDefaultForm, createStatusOptions } from '../data';

const props = defineProps<{
  isEdit: boolean;
  loading: boolean;
  title: string;
  treeData: DeptApi.DeptItem[];
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
  set: (val) => emit('update:visible', val),
});

const statusOptions = createStatusOptions($t);

const treeSelectData = computed(() => {
  const excludeId = props.isEdit ? form.value.id : undefined;
  return buildTreeData(props.treeData, excludeId);
});

function generateCodeFromName() {
  form.value.code = stringToCode(form.value.name ?? '');
}

function handleCancel() {
  showVisible.value = false;
}

function handleOk() {
  emit('submit');
}

function buildTreeData(
  nodes: DeptApi.DeptItem[],
  excludeId?: string,
): { children: any[]; label: string; value: string }[] {
  const result: { children: any[]; label: string; value: string }[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    result.push({
      label: `${node.name}${node.code ? `（${node.code}）` : ''}`,
      value: node.id,
      children: node.children?.length ? buildTreeData(node.children, excludeId) : [],
    });
  }
  return result;
}
</script>

<template>
  <Modal
    v-model:open="showVisible"
    :title="title"
    :confirm-loading="loading"
    :ok-text="$t('common.confirm')"
    :cancel-text="$t('common.cancel')"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form :model="form" layout="vertical" class="mt-4">
      <FormItem :label="$t('system.dept.fields.parentId')">
        <TreeSelect
          :value="form.parentId || ''"
          :tree-data="[{ label: $t('system.dept.rootLevel'), value: '', children: treeSelectData }]"
          :placeholder="$t('system.dept.placeholder.parentId')"
          allow-clear
          tree-default-expand-all
          class="w-full"
          @update:value="form.parentId = $event || null"
        />
      </FormItem>

      <FormItem :label="$t('system.dept.fields.name')" required>
        <Input v-model:value="form.name" :placeholder="$t('system.dept.placeholder.name')" />
      </FormItem>

      <FormItem :label="$t('system.dept.fields.code')">
        <Input
          v-model:value="form.code"
          :placeholder="$t('system.dept.placeholder.code')"
          :disabled="isEdit"
        >
          <template v-if="!isEdit" #addonAfter>
            <Button type="link" size="small" @click="generateCodeFromName">
              {{ $t('system.dept.generateCode') }}
            </Button>
          </template>
        </Input>
      </FormItem>

      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('system.dept.fields.leaderId')">
          <Input v-model:value="form.leaderId" :placeholder="$t('system.dept.placeholder.leaderId')" />
        </FormItem>
        <FormItem :label="$t('system.dept.fields.status')">
          <Select v-model:value="form.status" :options="statusOptions" class="w-full" />
        </FormItem>
      </div>

      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('system.dept.fields.phone')">
          <Input v-model:value="form.phone" :placeholder="$t('system.dept.placeholder.phone')" />
        </FormItem>
        <FormItem :label="$t('system.dept.fields.email')">
          <Input v-model:value="form.email" :placeholder="$t('system.dept.placeholder.email')" />
        </FormItem>
      </div>
    </Form>
  </Modal>
</template>
