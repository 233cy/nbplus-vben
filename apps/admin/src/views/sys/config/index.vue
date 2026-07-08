<script setup lang="ts">
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button } from 'ant-design-vue';
import { ref } from 'vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchDeleteConfigApi,
  batchUpdateConfigApi,
  getConfigDetailApi,
  getConfigListApi,
  getConfigOptionsApi,
} from '#/api/sys/config';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { $t } from '#/locales';

import ConfigForm from './components/config-form.vue';
import { useConfigPermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { canCreate, canBatchDelete, canBatchUpdate } = useConfigPermission();

const groupsOptions = ref<{ label: string; value: string }[]>([]);
getConfigOptionsApi().then((options) => {
  groupsOptions.value = options;
});

const [ConfigFormDrawer, configFormDrawerApi] = useVbenDrawer({
  connectedComponent: ConfigForm,
  destroyOnClose: true,
});

async function onEditClick(id: string) {
  const res = await getConfigDetailApi(id);
  configFormDrawerApi.setData(res).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(groupsOptions),
    showCollapseButton: true,
    submitOnChange: false,
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(onEditClick, () => gridApi.query()),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getConfigListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  },
});

function onRefresh() {
  gridApi.query();
}

function getSelectedIds(): string[] {
  return (gridApi.grid?.getCheckboxRecords() as { id: string }[])?.map(r => r.id) ?? [];
}
</script>

<template>
  <Page auto-content-height>
    <ConfigFormDrawer @success="onRefresh" />
    <Grid :table-title="$t('sys.config.pageTitle')">
      <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="ml-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteConfigApi(ids)"
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

        <BatchActionDropdown
          v-if="canBatchUpdate"
          class="ml-2 mr-2"
          type="dict"
          :action="$t('common.batchUpdate')"
          :api-fn="batchUpdateConfigApi"
          :get-ids="getSelectedIds"
          :on-success="onRefresh"
          field-name="isPublic"
          dict-code="is_enable"
        />

        <Button v-if="canCreate" type="primary" @click="configFormDrawerApi.setData(undefined as any).open()">
          <Plus class="size-5" />
          {{ $t('sys.config.addItem') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
