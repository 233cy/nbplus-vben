<script setup lang="ts">
import type { StorageApi } from '#/api/sys/storage.js';

import { onMounted } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteStorageApi } from '#/api/sys/storage.js';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { $t } from '#/locales';

import StorageForm from './components/storage-form.vue';
import { useStorage } from './composables/useStorage';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const storage = useStorage();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: StorageForm,
  destroyOnClose: true,
});

function resetForm(): Partial<StorageApi.StorageItem> {
  return {
    name: '',
    code: '',
    engine: 'local',
    config: {},
    sort: 0,
    status: 1,
  };
}

function openCreate() {
  const form = resetForm();
  const schema = storage.schemas.value.find((s) => s.engine === 'local');
  if (schema) {
    const defaults: Record<string, any> = {};
    schema.schema.forEach((field) => {
      defaults[field.key] = field.default;
    });
    form.config = defaults;
  }
  formDrawerApi.setData({ form, schemas: storage.schemas.value }).open();
}

async function openEdit(record: StorageApi.StorageItem) {
  const detail = await storage.detail(record.id);
  formDrawerApi.setData({ form: detail, schemas: storage.schemas.value }).open();
}

async function handleToggle(record: StorageApi.StorageItem, checked: boolean) {
  await storage.updateStatus(record.id, checked ? 1 : 2);
  gridApi.query();
}

async function handleSetDefault(record: StorageApi.StorageItem) {
  await storage.setDefault(record.id);
  gridApi.query();
}

async function handleSingleDelete(record: StorageApi.StorageItem) {
  await storage.batchDelete([record.id]);
  gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
    showCollapseButton: true,
    submitOnChange: false,
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(openEdit, handleSetDefault, handleToggle, handleSingleDelete),
    height: 'auto',
    proxyConfig: {
      ajax: {
        queryApi: storage.loadList,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

/** 从 VxeTable 获取当前所有选中的行 ID（跨页保留） */
function getSelectedIds(): string[] {
  return (gridApi.grid?.getCheckboxRecords() as StorageApi.StorageItem[])?.map((r) => r.id) ?? [];
}

function onRefresh() {
  gridApi.query();
}

onMounted(() => {
  storage.loadSchemas();
});
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="gridApi.query" />

    <Grid :table-title="$t('sys.storage.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteStorageApi(ids)"
          :get-ids="getSelectedIds"
          :on-success="onRefresh"
        >
          <template #default="{ onClick }">
            <Button danger @click="onClick">
              <IconifyIcon icon="lucide:trash-2" class="size-4" />
              {{ $t('common.batchDelete') }}
            </Button>
          </template>
        </BatchActionDropdown>

        <Button type="primary" class="ml-2" @click="openCreate">
          <Plus class="size-5" />
          {{ $t('sys.storage.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
