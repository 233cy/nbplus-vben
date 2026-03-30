<script setup lang="ts">
import type { CurdAdminApi } from '#/api/dev/curdAdmin';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Checkbox, Form, FormItem, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Spin, Table, Tag, Tooltip } from 'ant-design-vue';

import {
  createCurdTableApi,
  deleteCurdTableApi,
  generateCurdApi,
  getCurdFieldListApi,
  getCurdTableListApi,
  saveCurdFieldsApi,
  syncCurdFieldsApi,
  updateCurdTableApi,
} from '#/api/dev/curdAdmin';
import { $t } from '#/locales';

defineOptions({ name: 'DevCurdPage' });

// =========================================================================
// 表配置列表
// =========================================================================
const loading = ref(false);
const tableList = ref<CurdAdminApi.CurdTable[]>([]);
const total = ref(0);
const searchParams = ref({ page: 1, pageSize: 20, title: '', tableName: '' });

async function loadTableList() {
  loading.value = true;
  try {
    const res = await getCurdTableListApi(searchParams.value);
    tableList.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

loadTableList();

const tableColumns = [
  { title: $t('curd.table.fields.title'), dataIndex: 'title', width: 160 },
  { title: $t('curd.table.fields.tableName'), dataIndex: 'tableName', width: 160 },
  { title: $t('curd.table.fields.module'), dataIndex: 'module', width: 100 },
  { title: $t('curd.table.fields.className'), dataIndex: 'className', width: 120 },
  { title: $t('curd.table.fields.routePrefix'), dataIndex: 'routePrefix', width: 160 },
  { title: $t('curd.table.fields.author'), dataIndex: 'author', width: 100 },
  { title: $t('curd.table.fields.status'), dataIndex: 'status', width: 80 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const },
];

const STATUS_OPTIONS = [
  { label: $t('curd.status.enabled'), value: 1 },
  { label: $t('curd.status.disabled'), value: 2 },
];

// =========================================================================
// 表配置 新增/编辑
// =========================================================================
const tableModalVisible = ref(false);
const tableModalLoading = ref(false);
const isEdit = ref(false);

const defaultTableForm = (): CurdAdminApi.TableSaveParams & { id?: string } => ({
  title: '',
  tableName: '',
  module: '',
  className: '',
  routePrefix: '',
  author: '',
  remark: '',
  status: 1,
});

const tableForm = ref(defaultTableForm());

function openTableCreate() {
  isEdit.value = false;
  tableForm.value = defaultTableForm();
  tableModalVisible.value = true;
}

function openTableEdit(row: CurdAdminApi.CurdTable) {
  isEdit.value = true;
  tableForm.value = { ...row };
  tableModalVisible.value = true;
}

async function handleTableSubmit() {
  if (!tableForm.value.title?.trim()) {
    message.warning('请输入业务名称');
    return;
  }
  if (!tableForm.value.tableName?.trim()) {
    message.warning('请输入数据库表名');
    return;
  }
  if (!tableForm.value.module?.trim()) {
    message.warning('请输入模块名');
    return;
  }
  if (!tableForm.value.className?.trim()) {
    message.warning('请输入类名前缀');
    return;
  }
  if (!tableForm.value.routePrefix?.trim()) {
    message.warning('请输入路由前缀');
    return;
  }

  tableModalLoading.value = true;
  try {
    if (isEdit.value && tableForm.value.id) {
      await updateCurdTableApi(tableForm.value as CurdAdminApi.TableSaveParams & { id: string });
      message.success($t('curd.updateSuccess'));
    } else {
      await createCurdTableApi(tableForm.value);
      message.success($t('curd.createSuccess'));
    }
    tableModalVisible.value = false;
    await loadTableList();
  } finally {
    tableModalLoading.value = false;
  }
}

async function handleTableDelete(id: string) {
  await deleteCurdTableApi(id);
  message.success($t('curd.deleteSuccess'));
  await loadTableList();
}

// =========================================================================
// 字段配置抽屉
// =========================================================================
const fieldDrawerVisible = ref(false);
const fieldLoading = ref(false);
const fieldSaving = ref(false);
const currentTable = ref<CurdAdminApi.CurdTable | null>(null);
const fields = ref<CurdAdminApi.CurdField[]>([]);

async function openFieldDrawer(row: CurdAdminApi.CurdTable) {
  currentTable.value = row;
  fieldDrawerVisible.value = true;
  fieldLoading.value = true;
  try {
    fields.value = await getCurdFieldListApi(row.id);
  } finally {
    fieldLoading.value = false;
  }
}

function addField() {
  fields.value.push({
    tableId: currentTable.value!.id,
    columnName: '',
    columnType: 'string',
    label: '',
    isList: true,
    isSearch: false,
    isForm: true,
    isRequired: false,
    options: null,
    sort: (fields.value.length + 1) * 10,
  });
}

function removeField(index: number) {
  fields.value.splice(index, 1);
}

async function handleSyncFields() {
  if (!currentTable.value) return;
  fieldLoading.value = true;
  try {
    const synced = await syncCurdFieldsApi(currentTable.value.id);
    fields.value = synced;
    message.success($t('curd.syncSuccess'));
  } finally {
    fieldLoading.value = false;
  }
}

async function handleSaveFields() {
  if (!currentTable.value) return;
  fieldSaving.value = true;
  try {
    await saveCurdFieldsApi(currentTable.value.id, fields.value);
    message.success($t('curd.updateSuccess'));
  } finally {
    fieldSaving.value = false;
  }
}

const generateLoading = ref<Record<string, boolean>>({});

async function handleGenerate(id: string) {
  generateLoading.value[id] = true;
  try {
    const files = await generateCurdApi(id);
    message.success(`生成成功，共 ${files.length} 个文件`);
  } finally {
    generateLoading.value[id] = false;
  }
}

const COLUMN_TYPE_OPTIONS: { label: string; value: CurdAdminApi.ColumnType }[] = [
  { label: $t('curd.field.columnType.string'), value: 'string' },
  { label: $t('curd.field.columnType.int'), value: 'int' },
  { label: $t('curd.field.columnType.bool'), value: 'bool' },
  { label: $t('curd.field.columnType.datetime'), value: 'datetime' },
  { label: $t('curd.field.columnType.enum'), value: 'enum' },
  { label: $t('curd.field.columnType.relation'), value: 'relation' },
];

const fieldColumns = [
  { title: $t('curd.field.fields.columnName'), dataIndex: 'columnName', width: 140 },
  { title: $t('curd.field.fields.columnType'), dataIndex: 'columnType', width: 110 },
  { title: $t('curd.field.fields.label'), dataIndex: 'label', width: 160 },
  { title: $t('curd.field.fields.isList'), dataIndex: 'isList', width: 60 },
  { title: $t('curd.field.fields.isSearch'), dataIndex: 'isSearch', width: 60 },
  { title: $t('curd.field.fields.isForm'), dataIndex: 'isForm', width: 60 },
  { title: $t('curd.field.fields.isRequired'), dataIndex: 'isRequired', width: 60 },
  { title: $t('curd.field.fields.sort'), dataIndex: 'sort', width: 80 },
  { title: '操作', key: 'action', width: 60 },
];
</script>

<template>
  <div class="p-4">
    <!-- 搜索栏 -->
    <div class="mb-3 flex items-center gap-3">
      <Input v-model:value="searchParams.title" :placeholder="$t('curd.table.fields.title')" class="w-48" allow-clear @press-enter="loadTableList" />
      <Input v-model:value="searchParams.tableName" :placeholder="$t('curd.table.fields.tableName')" class="w-48" allow-clear @press-enter="loadTableList" />
      <Button type="primary" @click="loadTableList">
        <template #icon><IconifyIcon icon="ant-design:search-outlined" /></template>
        搜索
      </Button>
      <Button class="ml-auto" type="primary" @click="openTableCreate">
        <template #icon><IconifyIcon icon="ant-design:plus-outlined" /></template>
        {{ $t('curd.table.add') }}
      </Button>
    </div>

    <!-- 表格 -->
    <Spin :spinning="loading">
      <Table
        :columns="tableColumns"
        :data-source="tableList"
        :pagination="{
          current: searchParams.page,
          pageSize: searchParams.pageSize,
          total,
          onChange: (p) => {
            searchParams.page = p;
            loadTableList();
          },
        }"
        row-key="id"
        size="middle"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? $t('curd.status.enabled') : $t('curd.status.disabled') }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Tooltip title="字段配置">
                <Button size="small" type="text" @click="openFieldDrawer(record as CurdAdminApi.CurdTable)">
                  <IconifyIcon icon="ant-design:table-outlined" />
                </Button>
              </Tooltip>
              <Tooltip title="生成代码">
                <Button size="small" type="text" :loading="generateLoading[record.id]" @click="handleGenerate(record.id)">
                  <IconifyIcon icon="ant-design:code-outlined" />
                </Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button size="small" type="text" @click="openTableEdit(record as CurdAdminApi.CurdTable)">
                  <IconifyIcon icon="ant-design:edit-outlined" />
                </Button>
              </Tooltip>
              <Popconfirm :title="$t('curd.table.confirmDelete')" @confirm="handleTableDelete(record.id)">
                <Tooltip title="删除">
                  <Button size="small" type="text" danger>
                    <IconifyIcon icon="ant-design:delete-outlined" />
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Spin>

    <!-- 新增/编辑表配置弹窗 -->
    <Modal
      v-model:open="tableModalVisible"
      :title="isEdit ? $t('curd.table.edit') : $t('curd.table.add')"
      :confirm-loading="tableModalLoading"
      width="560px"
      @ok="handleTableSubmit"
    >
      <Form :model="tableForm" layout="vertical" class="mt-4">
        <div class="grid grid-cols-2 gap-x-4">
          <FormItem :label="$t('curd.table.fields.title')" required>
            <Input v-model:value="tableForm.title" :placeholder="$t('curd.table.placeholder.title')" />
          </FormItem>
          <FormItem :label="$t('curd.table.fields.tableName')" required>
            <Input v-model:value="tableForm.tableName" :placeholder="$t('curd.table.placeholder.tableName')" />
          </FormItem>
          <FormItem :label="$t('curd.table.fields.module')" required>
            <Input v-model:value="tableForm.module" :placeholder="$t('curd.table.placeholder.module')" />
          </FormItem>
          <FormItem :label="$t('curd.table.fields.className')" required>
            <Input v-model:value="tableForm.className" :placeholder="$t('curd.table.placeholder.className')" />
          </FormItem>
          <FormItem :label="$t('curd.table.fields.routePrefix')" required>
            <Input v-model:value="tableForm.routePrefix" :placeholder="$t('curd.table.placeholder.routePrefix')" />
          </FormItem>
          <FormItem :label="$t('curd.table.fields.author')">
            <Input v-model:value="tableForm.author" />
          </FormItem>
        </div>
        <FormItem :label="$t('curd.table.fields.remark')">
          <Input v-model:value="tableForm.remark" />
        </FormItem>
        <FormItem :label="$t('curd.table.fields.status')">
          <Select v-model:value="tableForm.status" :options="STATUS_OPTIONS" class="w-40" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 字段配置弹窗 -->
    <Modal
      v-model:open="fieldDrawerVisible"
      :title="`${currentTable?.title} - ${$t('curd.field.title')}`"
      :confirm-loading="fieldSaving"
      width="1000px"
      ok-text="保存字段"
      @ok="handleSaveFields"
    >
      <div class="mb-3 flex items-center gap-2">
        <Popconfirm :title="$t('curd.field.syncConfirm')" @confirm="handleSyncFields">
          <Button>
            <template #icon><IconifyIcon icon="ant-design:sync-outlined" /></template>
            {{ $t('curd.field.sync') }}
          </Button>
        </Popconfirm>
        <Button type="dashed" @click="addField">
          <template #icon><IconifyIcon icon="ant-design:plus-outlined" /></template>
          {{ $t('curd.field.addField') }}
        </Button>
      </div>

      <Spin :spinning="fieldLoading">
        <Table :columns="fieldColumns" :data-source="fields" :pagination="false" row-key="columnName" size="small">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.dataIndex === 'columnName'">
              <Input v-model:value="record.columnName" size="small" />
            </template>
            <template v-else-if="column.dataIndex === 'columnType'">
              <Select v-model:value="record.columnType" :options="COLUMN_TYPE_OPTIONS" size="small" class="w-full" />
            </template>
            <template v-else-if="column.dataIndex === 'label'">
              <Input v-model:value="record.label" size="small" />
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
            <template v-else-if="column.dataIndex === 'sort'">
              <InputNumber v-model:value="record.sort" size="small" :min="0" class="w-full" />
            </template>
            <template v-else-if="column.key === 'action'">
              <Button size="small" type="text" danger @click="removeField(index)">
                <IconifyIcon icon="ant-design:delete-outlined" />
              </Button>
            </template>
          </template>
        </Table>
      </Spin>
    </Modal>
  </div>
</template>
