<script setup lang="ts">
import type { CurdAdminApi } from '#/api/dev/curdAdmin';

import { computed, onMounted, ref } from 'vue';

import { IconPicker } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Checkbox, Form, FormItem, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Spin, Table, Tag, Tooltip, TreeSelect } from 'ant-design-vue';

import {
  createCurdMenuApi,
  createCurdTableApi,
  deleteCurdTableApi,
  generateCurdApi,
  getCurdConnectionsApi,
  getCurdFieldListApi,
  getCurdTableListApi,
  getCurdTablesApi,
  saveCurdFieldsApi,
  syncCurdFieldsApi,
  updateCurdTableApi,
} from '#/api/dev/curdAdmin';
import { getMenuListApi } from '#/api/dev/menuAdmin';
import { $t } from '#/locales';

defineOptions({ name: 'DevCurdPage' });

const connectionOptions = ref<{ label: string; value: string }[]>([]);
const tableNameOptions = ref<{ label: string; value: string }[]>([]);
const tableNamesLoading = ref(false);

onMounted(async () => {
  const connections = await getCurdConnectionsApi();
  connectionOptions.value = connections.map((c) => ({ label: c, value: c }));
});

async function loadTableNames(connection: string) {
  tableNamesLoading.value = true;
  try {
    const tables = await getCurdTablesApi(connection);
    tableNameOptions.value = tables.map((t) => ({ label: t, value: t }));
  } finally {
    tableNamesLoading.value = false;
  }
}

function onConnectionChange(connection: string) {
  tableForm.value.tableName = '';
  loadTableNames(connection);
}

const COMPONENT_OPTIONS: { label: string; value: CurdAdminApi.ComponentType }[] = [
  { label: 'Input（单行文本）', value: 'Input' },
  { label: 'InputNumber（数字）', value: 'InputNumber' },
  { label: 'InputPassword（密码）', value: 'InputPassword' },
  { label: 'Textarea（多行文本）', value: 'Textarea' },
  { label: 'Select（下拉选择）', value: 'Select' },
  { label: 'ApiSelect（远程下拉）', value: 'ApiSelect' },
  { label: 'Switch（开关）', value: 'Switch' },
  { label: 'Checkbox（复选框）', value: 'Checkbox' },
  { label: 'CheckboxGroup（复选组）', value: 'CheckboxGroup' },
  { label: 'Radio（单选）', value: 'Radio' },
  { label: 'RadioGroup（单选组）', value: 'RadioGroup' },
  { label: 'DatePicker（日期）', value: 'DatePicker' },
  { label: 'TimePicker（时间）', value: 'TimePicker' },
  { label: 'RangePicker（日期范围）', value: 'RangePicker' },
  { label: 'TreeSelect（树形选择）', value: 'TreeSelect' },
  { label: 'Upload（文件上传）', value: 'Upload' },
  { label: 'ImageUpload（图片上传）', value: 'ImageUpload' },
  { label: 'AvatarUpload（头像上传）', value: 'AvatarUpload' },
  { label: 'Edit（富文本）', value: 'Edit' },
  { label: 'IconPicker（图标选择）', value: 'IconPicker' },
  { label: 'Rate（评分）', value: 'Rate' },
  { label: 'Mentions（提及）', value: 'Mentions' },
  { label: 'AutoComplete（自动完成）', value: 'AutoComplete' },
  { label: 'CreatableSelect（可创建下拉）', value: 'CreatableSelect' },
];

const loading = ref(false);
const tableList = ref<CurdAdminApi.CurdTable[]>([]);
const total = ref(0);
const searchParams = ref({ page: 1, pageSize: 20, title: '', tableName: '' });

async function loadTableList() {
  loading.value = true;
  try {
    const res = await getCurdTableListApi(searchParams.value);
    tableList.value = res.items;
    total.value = res.meta?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

loadTableList();

const tableColumns = [
  { title: $t('dev/curd.table.fields.title'), dataIndex: 'title', width: 140 },
  { title: $t('dev/curd.table.fields.tableName'), dataIndex: 'tableName', width: 140 },
  { title: '数据库连接', dataIndex: 'dbConnection', width: 100 },
  { title: $t('dev/curd.table.fields.module'), dataIndex: 'module', width: 90 },
  { title: $t('dev/curd.table.fields.className'), dataIndex: 'className', width: 110 },
  { title: $t('dev/curd.table.fields.routePrefix'), dataIndex: 'routePrefix', width: 140 },
  { title: $t('dev/curd.table.fields.status'), dataIndex: 'status', width: 70 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

const STATUS_OPTIONS = [
  { label: $t('dev/curd.status.enabled'), value: 1 },
  { label: $t('dev/curd.status.disabled'), value: 2 },
];

const tableModalVisible = ref(false);
const tableModalLoading = ref(false);
const isEdit = ref(false);

const defaultTableForm = (): CurdAdminApi.TableSaveParams & { id?: string } => ({
  title: '',
  tableName: '',
  dbConnection: 'default',
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
  loadTableNames('default');
  tableModalVisible.value = true;
}

function openTableEdit(row: CurdAdminApi.CurdTable) {
  isEdit.value = true;
  tableForm.value = { ...row };
  loadTableNames(row.dbConnection || 'default');
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
      message.success($t('dev/curd.updateSuccess'));
    } else {
      await createCurdTableApi(tableForm.value);
      message.success($t('dev/curd.createSuccess'));
    }
    tableModalVisible.value = false;
    await loadTableList();
  } finally {
    tableModalLoading.value = false;
  }
}

async function handleTableDelete(id: string) {
  await deleteCurdTableApi(id);
  message.success($t('dev/curd.deleteSuccess'));
  await loadTableList();
}

const fieldModalVisible = ref(false);
const fieldLoading = ref(false);
const fieldSaving = ref(false);
const currentTable = ref<CurdAdminApi.CurdTable | null>(null);
const fields = ref<CurdAdminApi.CurdField[]>([]);

async function openFieldModal(row: CurdAdminApi.CurdTable) {
  currentTable.value = row;
  fieldModalVisible.value = true;
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
    component: 'Input',
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
    message.success($t('dev/curd.syncSuccess'));
  } finally {
    fieldLoading.value = false;
  }
}

async function handleSaveFields() {
  if (!currentTable.value) return;
  fieldSaving.value = true;
  try {
    await saveCurdFieldsApi(currentTable.value.id, fields.value);
    message.success($t('dev/curd.updateSuccess'));
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

// =========================================================================
// 菜单生成
// =========================================================================
const menuModalVisible = ref(false);
const menuModalLoading = ref(false);
const currentMenuRow = ref<CurdAdminApi.CurdTable | null>(null);
const menuForm = ref({
  id: '',
  menuParentId: null as null | string,
  menuPath: '',
  menuIcon: '',
  menuSort: 0,
});
const menuTreeData = ref<any[]>([]);
const menuTreeFlat = ref<any[]>([]);

/** 根据 id 在平铺列表里找节点 */
function findMenuNode(id: null | string): any {
  if (!id || id === '__root__') return null;
  return menuTreeFlat.value.find((n) => n.id === id) ?? null;
}

/** 递归拼接某节点的完整路径（遇到 / 开头的节点截断上级） */
function getFullPath(id: null | string): string {
  if (!id || id === '__root__') return '';
  const node = findMenuNode(id);
  if (!node) return '';
  const selfPath = node.path ?? '';
  // 自身是绝对路径，直接返回
  if (selfPath.startsWith('/')) return selfPath;
  // 相对路径，拼接父级完整路径
  const parentFull = getFullPath(node.parentId ?? null);
  return parentFull ? `${parentFull}/${selfPath}` : `/${selfPath}`;
}

/** 选中父节点后，自动推导路径 path */
function onMenuParentChange(parentId: null | string) {
  if (!currentMenuRow.value) return;
  const kebab = currentMenuRow.value.className.replaceAll(/([A-Z])/g, (_, c, i) => (i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`));
  const parentFull = getFullPath(parentId);
  // 有父节点：只填相对路径（kebab），预览时拼接
  // 无父节点：填绝对路径
  menuForm.value.menuPath = parentFull ? kebab : `/${currentMenuRow.value.module}/${kebab}`;
}

/** 递归平铺菜单树（只保留目录节点 type===1） */
function flattenTree(nodes: any[]): any[] {
  const result: any[] = [];
  for (const node of nodes) {
    if (node.type === 1) {
      result.push(node);
      if (node.children?.length) result.push(...flattenTree(node.children));
    }
  }
  return result;
}

/** 递归过滤只保留目录节点的树 */
function filterDirTree(nodes: any[]): any[] {
  const result: any[] = [];
  for (const node of nodes) {
    if (node.type !== 1) continue;
    const children = filterDirTree(node.children ?? []);
    result.push({ ...node, children });
  }
  return result;
}

async function openMenuModal(row: CurdAdminApi.CurdTable) {
  currentMenuRow.value = row;
  const kebab = row.className.replaceAll(/([A-Z])/g, (_, c, i) => (i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`));
  menuForm.value = {
    id: row.id,
    menuParentId: null,
    menuPath: `/${row.module}/${kebab}`,
    menuIcon: 'lucide:table-2',
    menuSort: 0,
  };
  const tree = await getMenuListApi();
  menuTreeFlat.value = flattenTree(tree);
  menuTreeData.value = [{ id: '__root__', title: '顶级', path: '', type: 1, children: filterDirTree(tree) }];
  menuModalVisible.value = true;
}

/** 父节点完整路径展示 */
const parentNodePath = computed(() => getFullPath(menuForm.value.menuParentId));

/** 最终路由预览 */
const menuPathPreview = computed(() => {
  const path = menuForm.value.menuPath;
  if (!path) return '';
  if (path.startsWith('/')) return path;
  const parentFull = getFullPath(menuForm.value.menuParentId);
  return parentFull ? `${parentFull}/${path}` : `/${path}`;
});

async function handleMenuSubmit() {
  menuModalLoading.value = true;
  try {
    await createCurdMenuApi({
      ...menuForm.value,
      menuParentId: menuForm.value.menuParentId === '__root__' ? null : menuForm.value.menuParentId,
    });
    message.success('菜单生成成功');
    menuModalVisible.value = false;
  } finally {
    menuModalLoading.value = false;
  }
}

const fieldColumns = [
  { title: '字段名（camelCase）', dataIndex: 'columnName', width: 150 },
  { title: '组件', dataIndex: 'component', width: 180 },
  { title: '标签', dataIndex: 'label', width: 120 },
  { title: '列表', dataIndex: 'isList', width: 50 },
  { title: '搜索', dataIndex: 'isSearch', width: 50 },
  { title: '表单', dataIndex: 'isForm', width: 50 },
  { title: '必填', dataIndex: 'isRequired', width: 50 },
  { title: '排序', dataIndex: 'sort', width: 70 },
  { title: '操作', key: 'action', width: 60 },
];
</script>

<template>
  <div class="p-4">
    <div class="mb-3 flex items-center gap-3">
      <Input v-model:value="searchParams.title" placeholder="业务名称" class="w-40" allow-clear @press-enter="loadTableList" />
      <Input v-model:value="searchParams.tableName" placeholder="表名" class="w-40" allow-clear @press-enter="loadTableList" />
      <Button type="primary" @click="loadTableList">
        <template #icon>
          <IconifyIcon icon="ant-design:search-outlined" />
        </template>
        搜索
      </Button>
      <Button class="ml-auto" type="primary" @click="openTableCreate">
        <template #icon>
          <IconifyIcon icon="ant-design:plus-outlined" />
        </template>
        {{ $t('dev/curd.table.add') }}
      </Button>
    </div>

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
        :scroll="{ x: 1100 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? $t('dev/curd.status.enabled') : $t('dev/curd.status.disabled') }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Tooltip title="字段配置">
                <Button size="small" type="text" @click="openFieldModal(record as CurdAdminApi.CurdTable)">
                  <IconifyIcon icon="ant-design:table-outlined" />
                </Button>
              </Tooltip>
              <Tooltip title="生成代码">
                <Button size="small" type="text" :loading="generateLoading[record.id]" @click="handleGenerate(record.id)">
                  <IconifyIcon icon="ant-design:code-outlined" />
                </Button>
              </Tooltip>
              <Tooltip title="生成菜单">
                <Button size="small" type="text" @click="openMenuModal(record as CurdAdminApi.CurdTable)">
                  <IconifyIcon icon="ant-design:menu-outlined" />
                </Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button size="small" type="text" @click="openTableEdit(record as CurdAdminApi.CurdTable)">
                  <IconifyIcon icon="ant-design:edit-outlined" />
                </Button>
              </Tooltip>
              <Popconfirm :title="$t('dev/curd.table.confirmDelete')" @confirm="handleTableDelete(record.id)">
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

    <!-- 新增/编辑表配置弹�?-->
    <Modal
      v-model:open="tableModalVisible"
      :title="isEdit ? $t('dev/curd.table.edit') : $t('dev/curd.table.add')"
      :confirm-loading="tableModalLoading"
      width="600px"
      @ok="handleTableSubmit"
    >
      <Form :model="tableForm" layout="vertical" class="mt-4">
        <div class="grid grid-cols-2 gap-x-4">
          <FormItem :label="$t('dev/curd.table.fields.title')" required>
            <Input v-model:value="tableForm.title" :placeholder="$t('dev/curd.table.placeholder.title')" />
          </FormItem>
          <FormItem label="数据库连接">
            <Select v-model:value="tableForm.dbConnection" :options="connectionOptions" class="w-full" @change="(v) => onConnectionChange(v as string)" />
          </FormItem>
          <FormItem :label="$t('dev/curd.table.fields.tableName')" required>
            <Select
              v-model:value="tableForm.tableName"
              :options="tableNameOptions"
              :loading="tableNamesLoading"
              show-search
              class="w-full"
              :placeholder="$t('dev/curd.table.placeholder.tableName')"
            />
          </FormItem>
          <FormItem :label="$t('dev/curd.table.fields.module')" required>
            <Input v-model:value="tableForm.module" :placeholder="$t('dev/curd.table.placeholder.module')" />
          </FormItem>
          <FormItem :label="$t('dev/curd.table.fields.className')" required>
            <Input v-model:value="tableForm.className" :placeholder="$t('dev/curd.table.placeholder.className')" />
          </FormItem>
          <FormItem :label="$t('dev/curd.table.fields.routePrefix')" required>
            <Input v-model:value="tableForm.routePrefix" :placeholder="$t('dev/curd.table.placeholder.routePrefix')" />
          </FormItem>
          <FormItem :label="$t('dev/curd.table.fields.author')">
            <Input v-model:value="tableForm.author" />
          </FormItem>
          <FormItem :label="$t('dev/curd.table.fields.status')">
            <Select v-model:value="tableForm.status" :options="STATUS_OPTIONS" class="w-full" />
          </FormItem>
        </div>
        <FormItem :label="$t('dev/curd.table.fields.remark')">
          <Input v-model:value="tableForm.remark" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 字段配置弹窗 -->
    <Modal v-model:open="fieldModalVisible" :title="`${currentTable?.title} - 字段配置`" :confirm-loading="fieldSaving" width="1100px" ok-text="保存字段" @ok="handleSaveFields">
      <div class="mb-3 flex items-center gap-2">
        <Popconfirm :title="$t('dev/curd.field.syncConfirm')" @confirm="handleSyncFields">
          <Button :loading="fieldLoading">
            <template #icon>
              <IconifyIcon icon="ant-design:sync-outlined" />
            </template>
            {{ $t('dev/curd.field.sync') }}
          </Button>
        </Popconfirm>
        <Button type="dashed" @click="addField">
          <template #icon>
            <IconifyIcon icon="ant-design:plus-outlined" />
          </template>
          {{ $t('dev/curd.field.addField') }}
        </Button>
      </div>

      <Spin :spinning="fieldLoading">
        <Table :columns="fieldColumns" :data-source="fields" :pagination="false" row-key="columnName" size="small">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.dataIndex === 'columnName'">
              <Input v-model:value="record.columnName" size="small" placeholder="如：userName" />
            </template>
            <template v-else-if="column.dataIndex === 'component'">
              <Select v-model:value="record.component" :options="COMPONENT_OPTIONS" size="small" class="w-full" />
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

    <!-- 生成菜单弹窗 -->
    <Modal v-model:open="menuModalVisible" title="生成菜单" :confirm-loading="menuModalLoading" width="520px" @ok="handleMenuSubmit">
      <Form :model="menuForm" layout="vertical" class="mt-4">
        <FormItem label="挂载到" required>
          <TreeSelect
            v-model:value="menuForm.menuParentId"
            :tree-data="menuTreeData"
            :field-names="{ label: 'title', value: 'id', children: 'children' }"
            tree-default-expand-all
            class="w-full"
            placeholder="选择父节点（不选则挂到顶级）"
            @change="onMenuParentChange"
          />
          <div v-if="menuForm.menuParentId && menuForm.menuParentId !== '__root__'" class="mt-1 text-xs text-gray-400">
            父节点完整路由：<span class="font-mono text-blue-500">{{ parentNodePath }}</span>
          </div>
        </FormItem>
        <FormItem label="菜单路由" required>
          <Input v-model:value="menuForm.menuPath" placeholder="/ 开头为绝对路径，否则拼在父节点后" />
          <div class="mt-1 text-xs text-gray-400">
            最终路由：<span class="font-mono text-green-600">{{ menuPathPreview }}</span>
            <span class="ml-2">{{ menuForm.menuPath.startsWith('/') ? '（绝对路径）' : '（相对路径，拼在父节点后）' }}</span>
          </div>
        </FormItem>
        <div class="grid grid-cols-2 gap-x-4">
          <FormItem label="菜单图标">
            <IconPicker v-model="menuForm.menuIcon" prefix="lucide" />
          </FormItem>
          <FormItem label="排序">
            <InputNumber v-model:value="menuForm.menuSort" :min="0" class="w-full" />
          </FormItem>
        </div>
        <div class="rounded bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">
          将自动创建菜单节点及 <span class="font-medium text-gray-700 dark:text-gray-300">查询 / 新增 / 编辑 / 删除</span> 四个按钮权限。
        </div>
      </Form>
    </Modal>
  </div>
</template>
