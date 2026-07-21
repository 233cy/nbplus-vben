<script setup lang="ts">
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchDeleteNotificationTemplateApi,
  batchUpdateNotificationTemplateApi,
  getNotificationTemplateDetailApi,
  getNotificationTemplateListApi,
} from '#/api/sys/notificationTemplate.js';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { $t } from '#/locales';

import Form from './components/form.vue';
import TestSendModal from './components/test-send-modal.vue';
import { useNotificationTemplate } from './composables/useNotificationTemplate';
import { useNotificationTemplatePermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { canCreate, canBatchDelete, canBatchUpdate } = useNotificationTemplatePermission();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [TestSendModalComponent, testSendModalApi] = useVbenModal({
  connectedComponent: TestSendModal,
  destroyOnClose: true,
});

async function onEditClick(id: string) {
  const res = await getNotificationTemplateDetailApi(id);
  formDrawerApi.setData(res).open();
}

async function onDetailClick(id: string) {
  const res = await getNotificationTemplateDetailApi(id);
  formDrawerApi.setData({ ...res, readonly: true }).open();
}

function onTestSendClick(row: any) {
  testSendModalApi.setData(row).open();
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
    columns: useColumns(onEditClick, onDetailClick, onTestSendClick, () => template.onRefresh()),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getNotificationTemplateListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const template = useNotificationTemplate(gridApi);
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="template.onRefresh" />
    <TestSendModalComponent @success="template.onRefresh" />
    <Grid :table-title="$t('sys.notification-template.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="ml-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteNotificationTemplateApi(ids)"
          :get-ids="template.getSelectedIds"
          :on-success="template.onRefresh"
        >
          <template #default="{ onClick }">
            <Button danger @click="onClick">
              <IconifyIcon icon="lucide:trash-2" class="size-4" />
              {{ $t('common.batchDelete') }}
            </Button>
          </template>
        </BatchActionDropdown>

        <BatchActionDropdown
          v-if="canBatchUpdate"
          class="ml-2 mr-2"
          type="multi"
          :action="$t('common.batchUpdate')"
          :api-fn="batchUpdateNotificationTemplateApi"
          :get-ids="template.getSelectedIds"
          :on-success="template.onRefresh"
          :fields="[
            { fieldName: 'status', label: $t('sys.notification-template.fields.status'), options: [{ label: $t('common.enabled'), value: 1 }, { label: $t('common.disabled'), value: 2 }] },
          ]"
        />

        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('sys.notification-template.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
