<script setup lang="ts">
import type { FileApi } from '#/api/sys/file.js';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteFileApi, previewFileApi, saveFileConfigApi } from '#/api/sys/file.js';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { $t } from '#/locales';
import QuickConfigDrawer from '#/views/sys/config/shared/quick-config-drawer.vue';

import MoveDrawer from './components/move-drawer.vue';
import UploadDrawer from './components/upload-drawer.vue';
import { useFile } from './composables/useFile';
import { useFilePermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const file = useFile();
const { canDelete, canMove, canSaveConfig } = useFilePermission();

const configDrawerVisible = ref(false);

const [MoveDrawerComp, moveDrawerApi] = useVbenDrawer({
  connectedComponent: MoveDrawer,
  destroyOnClose: true,
});

const [UploadDrawerComp, uploadDrawerApi] = useVbenDrawer({
  connectedComponent: UploadDrawer,
  destroyOnClose: true,
});

async function handlePreview(record: FileApi.FileItem) {
  const res = await previewFileApi(record.logicalPath);
  window.open(res.url, '_blank');
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
    columns: useColumns(handlePreview, openMove, handleSingleDelete),
    height: 'auto',
    proxyConfig: {
      ajax: {
        queryApi: file.loadList,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

/** 从 VxeTable 获取当前所有选中的行 ID（跨页保留） */
function getSelectedIds(): string[] {
  return (gridApi.grid?.getCheckboxRecords() as FileApi.FileItem[])?.map(r => r.id) ?? [];
}

function onRefresh() {
  gridApi.query();
}

function openMove(record: FileApi.FileItem) {
  moveDrawerApi.setData({ ids: [record.id] }).open();
}

function openBatchMove() {
  const ids = getSelectedIds();
  if (ids.length === 0) {
    // 批量迁移等同批量操作：必须先勾选数据，未勾选不兜底当前页
    message.warning($t('common.batchActionNoSelection'));
    return;
  }
  moveDrawerApi.setData({ ids: [...ids] }).open();
}

async function handleMoveConfirm(ids: string[], code: string) {
  await file.batchMove(ids, code);
  onRefresh();
}

async function handleSingleDelete(record: FileApi.FileItem) {
  await file.batchDelete([record.id]);
  onRefresh();
}
</script>

<template>
  <Page auto-content-height>
    <MoveDrawerComp @confirm="handleMoveConfirm" />
    <UploadDrawerComp @success="onRefresh" />
    <QuickConfigDrawer v-model:open="configDrawerVisible" group="storage" :title="$t('common.paramConfig')" :save-api="saveFileConfigApi" />

    <Grid :table-title="$t('sys.file.pageTitle')">
      <template #toolbar-tools>
        <Space>
          <Button type="primary" @click="uploadDrawerApi.open()">
            <IconifyIcon icon="lucide:upload" class="size-4" />
            {{ $t('sys.file.upload') }}
          </Button>

          <Button v-if="canMove" @click="openBatchMove">
            <IconifyIcon icon="lucide:move" class="size-4" />
            {{ $t('sys.file.batchMove') }}
          </Button>

          <BatchActionDropdown
            v-if="canDelete"
            type="direct"
            :action="$t('common.delete')"
            :api-fn="(ids: string[]) => batchDeleteFileApi(ids)"
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

          <Button v-if="canSaveConfig" @click="configDrawerVisible = true">
            <IconifyIcon icon="lucide:settings" class="size-4" />
            {{ $t('common.paramConfig') }}
          </Button>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
