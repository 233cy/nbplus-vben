<script setup lang="ts">
import type { FieldDef } from '../data';

import { IconifyIcon } from '@vben/icons';

import { Button, Input, Modal, Select } from 'ant-design-vue';

import { $t } from '#/locales';

import { useFlowDesignerContext } from '../composables/useFlowDesigner';

/**
 * fields 声明编辑弹窗：表格形式编辑条件字段（name/label/type/options），
 * 供分支条件构建器选择；直接编辑 reactive 的 flowDef.fields。
 */
const designer = useFlowDesignerContext();

const typeOptions = [
  { value: 'number', label: $t('approval.designer.fields.typeNumber') },
  { value: 'string', label: $t('approval.designer.fields.typeString') },
  { value: 'enum', label: $t('approval.designer.fields.typeEnum') },
];

function fields(): FieldDef[] {
  return designer.state.flowDef.fields;
}

function addField() {
  fields().push({ name: '', label: '', type: 'string' });
}

function removeField(index: number) {
  fields().splice(index, 1);
}

/** 切换字段类型：非枚举类型清除 options，枚举类型补空数组 */
function onTypeChange(field: FieldDef) {
  if (field.type === 'enum') {
    field.options ??= [];
  } else {
    delete field.options;
  }
}

function close() {
  designer.state.fieldsEditorOpen = false;
}
</script>

<template>
  <Modal
    :open="designer.state.fieldsEditorOpen"
    :title="$t('approval.designer.fields.title')"
    :width="880"
    @cancel="close"
  >
    <div class="fields-row fields-row-head">
      <span>{{ $t('approval.designer.fields.name') }}</span>
      <span>{{ $t('approval.designer.fields.label') }}</span>
      <span>{{ $t('approval.designer.fields.type') }}</span>
      <span>{{ $t('approval.designer.fields.options') }}</span>
      <span>{{ $t('common.operation') }}</span>
    </div>
    <div v-for="(field, i) in fields()" :key="i" class="fields-row">
      <Input v-model:value="field.name" placeholder="amount" />
      <Input v-model:value="field.label" :placeholder="$t('approval.designer.fields.label')" />
      <Select
        v-model:value="field.type"
        :options="typeOptions"
        @change="() => onTypeChange(field)"
      />
      <Select
        v-if="field.type === 'enum'"
        v-model:value="field.options"
        mode="tags"
        :options="(field.options ?? []).map(o => ({ value: o, label: o }))"
        :placeholder="$t('approval.designer.fields.optionsPlaceholder')"
      />
      <span v-else class="text-center">-</span>
      <IconifyIcon
        icon="lucide:trash-2"
        class="field-remove size-4"
        @click="removeField(i)"
      />
    </div>
    <Button size="small" class="mt-1" @click="addField">
      <IconifyIcon icon="lucide:plus" class="size-3.5" />
      {{ $t('approval.designer.fields.addField') }}
    </Button>
    <template #footer>
      <Button type="primary" @click="close">{{ $t('approval.designer.fields.done') }}</Button>
    </template>
  </Modal>
</template>
