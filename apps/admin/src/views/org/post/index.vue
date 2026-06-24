<script setup lang="ts">
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeletePostApi, batchUpdatePostApi, getPostDetailApi, getPostListApi } from '#/api/org/post';
import BatchActionDropdown from '#/components/table/BatchActionDropdown.vue';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import Form from './components/form.vue';
import { usePost } from './composables/usePost';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['org:post:create']);
const canBatchDelete = hasAccessByCodes(['org:post:batchDelete']);
const canBatchUpdate = hasAccessByCodes(['org:post:batchUpdate']);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

async function onEditClick(id: string) {
  const res = await getPostDetailApi(id);
  formDrawerApi.setData(res).open();
}

async function onDetailClick(id: string) {
  const res = await getPostDetailApi(id);
  formDrawerApi.setData({ ...res, readonly: true }).open();
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
    columns: useColumns(onEditClick, onDetailClick, () => post.onRefresh()),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getPostListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

const post = usePost(gridApi);
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="post.onRefresh" />
    <Grid :table-title="$t('system.post.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="ml-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeletePostApi(ids)"
          :get-ids="post.getSelectedIds"
          :on-success="post.onRefresh"
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
          :api-fn="batchUpdatePostApi"
          :get-ids="post.getSelectedIds"
          :on-success="post.onRefresh"
          :fields="[{ fieldName: 'status', label: $t('system.post.fields.status'), dictCode: 'sys_post_status' }]"
        />

        <Button v-if="canCreate" type="primary" @click="formDrawerApi.setData({}).open()">
          <Plus class="size-5" />
          {{ $t('system.post.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
