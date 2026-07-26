<script setup lang="ts">
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { ref } from 'vue';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchDeleteConfigApi,
  batchUpdateConfigApi,
  getConfigDetailApi,
  getConfigListApi,
} from '#/api/sys/config';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import DictSideFilter from '#/components/dict/dict-side-filter.vue';
import { $t } from '#/locales';

import ConfigForm from './components/config-form.vue';
import { useConfigPermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { canCreate, canBatchDelete, canBatchUpdate } = useConfigPermission();

/** 当前选中的分组（查询层唯一数据源，与搜索表单解耦，重置/搜索不影响） */
const activeGroup = ref('');

const [ConfigFormDrawer, configFormDrawerApi] = useVbenDrawer({
  connectedComponent: ConfigForm,
  destroyOnClose: true,
});

async function onEditClick(id: string) {
  const res = await getConfigDetailApi(id);
  configFormDrawerApi.setData(res).open();
}

/** 点击配置键：只读详情 */
async function onDetailClick(id: string) {
  const res = await getConfigDetailApi(id);
  configFormDrawerApi.setData({ ...res, readonly: true }).open();
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
    columns: useColumns(onDetailClick, onEditClick, () => gridApi.query()),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: (params: any) => getConfigListApi({ ...params, groups: activeGroup.value || undefined }),
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

/** 左栏分组点选：更新分组条件并重新查询（条件在查询层持续生效，右表行为不影响左栏选中态） */
function onGroupSelect(value: string) {
  activeGroup.value = value;
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <ConfigFormDrawer @success="onRefresh" />
    <div class="flex h-full gap-3">
      <DictSideFilter code="sys_config_groups" @update:value="onGroupSelect" />
      <div class="min-w-0 flex-1">
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
      </div>
    </div>
  </Page>
</template>
