<script setup lang="ts">
import type { CurdAdminApi } from '#/api/dev/curdAdmin';

import { IconifyIcon } from '@vben/icons';

import { Button, Checkbox, Input, InputNumber, Modal, Popconfirm, Select, Spin, Table } from 'ant-design-vue';

import { $t } from '#/locales';

import { useFieldForm } from '../composables/useFieldForm';
import { BATCH_UPDATE_COMPONENTS, COMPONENT_OPTIONS, DICT_COMPONENTS } from '../data';

const fieldForm = useFieldForm();

const fieldColumns = [
  { title: $t('dev.curd.field.fields.columnName'), dataIndex: 'columnName', width: 150 },
  { title: $t('dev.curd.field.fields.component'), dataIndex: 'component', width: 180 },
  { title: $t('dev.curd.field.fields.dictCode'), dataIndex: 'dictCode', width: 160 },
  { title: $t('dev.curd.field.fields.label'), dataIndex: 'label', width: 120 },
  { title: $t('dev.curd.field.fields.isList'), dataIndex: 'isList', width: 50 },
  { title: $t('common.search'), dataIndex: 'isSearch', width: 50 },
  { title: $t('dev.curd.field.fields.isForm'), dataIndex: 'isForm', width: 50 },
  { title: $t('dev.curd.field.fields.isRequired'), dataIndex: 'isRequired', width: 50 },
  { title: $t('dev.curd.field.fields.isBatchUpdate'), dataIndex: 'isBatchUpdate', width: 60 },
  { title: $t('dev.curd.field.fields.sort'), dataIndex: 'sort', width: 70 },
  { title: $t('common.operation'), key: 'action', width: 60 },
];

function getDictCode(field: CurdAdminApi.CurdField): string {
  return field.options?.dictCode ?? '';
}

function setDictCode(field: CurdAdminApi.CurdField, code: string) {
  if (!field.options) field.options = {};
  field.options.dictCode = code;
}

function onComponentChange(field: CurdAdminApi.CurdField) {
  if (!DICT_COMPONENTS.has(field.component) && field.options?.dictCode) {
    field.options.dictCode = undefined;
  }
}

defineExpose({
  open: fieldForm.open,
});
</script>

<template>
  <Modal
    v-model:open="fieldForm.visible.value"
    :title="fieldForm.title.value"
    :confirm-loading="fieldForm.saving.value"
    width="1260px"
    :ok-text="$t('dev.curd.field.saveFields')"
    @ok="fieldForm.saveFields"
  >
    <div class="mb-3 flex items-center gap-2">
      <Popconfirm :title="$t('dev.curd.field.syncConfirm')" @confirm="fieldForm.syncFields">
        <Button :loading="fieldForm.loading.value">
          <template #icon>
            <IconifyIcon icon="ant-design:sync-outlined" />
          </template>
          {{ $t('dev.curd.field.sync') }}
        </Button>
      </Popconfirm>
      <Button type="dashed" @click="fieldForm.addField">
        <template #icon>
          <IconifyIcon icon="ant-design:plus-outlined" />
        </template>
        {{ $t('dev.curd.field.addField') }}
      </Button>
    </div>

    <Spin :spinning="fieldForm.loading.value">
      <Table :columns="fieldColumns" :data-source="fieldForm.fields.value" :pagination="false" row-key="columnName" >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.dataIndex === 'columnName'">
            <Input v-model:value="record.columnName"  placeholder="如：userName" />
          </template>
          <template v-else-if="column.dataIndex === 'component'">
            <Select v-model:value="record.component" :options="COMPONENT_OPTIONS"  class="w-full" @change="onComponentChange(record as CurdAdminApi.CurdField)" />
          </template>
          <template v-else-if="column.dataIndex === 'dictCode'">
            <Select
              v-if="DICT_COMPONENTS.has(record.component)"
              :value="getDictCode(record as CurdAdminApi.CurdField)"
              :options="fieldForm.dictOptions.value"
              
              class="w-full"
              show-search
              option-filter-prop="label"
              :placeholder="$t('dev.curd.field.dictPlaceholder')"
              allow-clear
              @change="(v: any) => setDictCode(record as CurdAdminApi.CurdField, v)"
            />
            <span v-else class="text-xs text-gray-300">—</span>
          </template>
          <template v-else-if="column.dataIndex === 'label'">
            <Input v-model:value="record.label"  />
          </template>
          <template v-else-if="column.dataIndex === 'isList'">
            <Checkbox v-model:checked="record.isList" />
          </template>
          <template v-else-if="column.dataIndex === 'isSearch'">
            <Checkbox v-model:checked="record.isSearch" />
          </template>
          <template v-else-if="column.dataIndex === 'isForm'">
            <Checkbox v-model:checked="record.isForm" />
          </template>
          <template v-else-if="column.dataIndex === 'isRequired'">
            <Checkbox v-model:checked="record.isRequired" />
          </template>
          <template v-else-if="column.dataIndex === 'isBatchUpdate'">
            <Checkbox v-model:checked="record.isBatchUpdate" :disabled="!BATCH_UPDATE_COMPONENTS.includes(record.component)" />
          </template>
          <template v-else-if="column.dataIndex === 'sort'">
            <InputNumber v-model:value="record.sort"  :min="0" class="w-full" />
          </template>
          <template v-else-if="column.key === 'action'">
            <Button  type="text" danger @click="fieldForm.removeField(index)">
              <IconifyIcon icon="ant-design:delete-outlined" />
            </Button>
          </template>
        </template>
      </Table>
    </Spin>
  </Modal>
</template>
