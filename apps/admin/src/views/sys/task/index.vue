<script setup lang="ts">
import type { TaskApi } from '#/api/sys/task';

import { onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteTaskApi, cancelTaskApi, deleteTaskApi, getTaskListApi, retryTaskApi } from '#/api/sys/task';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import DictSideFilter from '#/components/dict/dict-side-filter.vue';
import { $t } from '#/locales';

import { useTaskPermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

const { canBatchDelete } = useTaskPermission();

/** 当前选中的任务类型分组（查询层唯一数据源，与搜索表单解耦） */
const activeGroup = ref('');

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
    showCollapseButton: true,
    submitOnChange: false,
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(onCancel, onRetry, onDelete),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: (params: any) => getTaskListApi({ ...params, type: activeGroup.value || undefined }),
      } as any,
    },
    rowConfig: { keyField: 'id' },
    checkboxConfig: { reserve: true, highlight: true },
    toolbarConfig: { custom: true, export: false, refresh: false, search: true, zoom: true },
  },
});

function getSelectedIds(): string[] {
  return (gridApi.grid?.getCheckboxRecords() as { id: string }[])?.map(r => r.id) ?? [];
}

/** 左栏分组点选：更新类型条件并重新查询（右表搜索/重置不影响左栏选中态） */
function onGroupSelect(value: string) {
  activeGroup.value = value;
  gridApi.query();
}

async function onCancel(row: TaskApi.TaskItem) {
  await cancelTaskApi(row.id);
  message.success($t('sys.task.cancelSuccess'));
  reload();
}

async function onRetry(row: TaskApi.TaskItem) {
  await retryTaskApi(row.id);
  message.success($t('sys.task.retrySuccess'));
  reload();
}

async function onDelete(row: TaskApi.TaskItem) {
  await deleteTaskApi(row.id);
  message.success($t('sys.task.deleteSuccess'));
  reload();
}

// =====================================================================
// 倒计时提醒式刷新（不自动刷新：倒计时归零后高亮提醒，点击才重载）
// =====================================================================
const COUNTDOWN_SECONDS = 5;
const countdown = ref(COUNTDOWN_SECONDS);
const ready = ref(false);
let timer: null | ReturnType<typeof setInterval> = null;

function startCountdown() {
  if (timer) {
    clearInterval(timer);
  }
  countdown.value = COUNTDOWN_SECONDS;
  ready.value = false;
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0 && timer) {
      clearInterval(timer);
      timer = null;
      ready.value = true;
    }
  }, 1000);
}

function reload() {
  gridApi.query();
  startCountdown();
}

onMounted(startCountdown);
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full gap-3">
      <DictSideFilter code="sys_task_type" @update:value="onGroupSelect" />
      <div class="min-w-0 flex-1">
        <Grid :table-title="$t('sys.task.pageTitle')">
          <template #toolbar-tools>
        <BatchActionDropdown
          v-if="canBatchDelete"
          class="mr-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteTaskApi(ids)"
          :get-ids="getSelectedIds"
          :on-success="reload"
        >
          <template #default="{ onClick }">
            <Button danger @click="onClick">
              <IconifyIcon icon="lucide:trash-2" class="size-4" />
              {{ $t('common.batchDelete') }}
            </Button>
          </template>
        </BatchActionDropdown>

        <Button
          :type="ready ? 'primary' : 'text'"
          :class="{ 'animate-pulse': ready }"
          @click="reload"
        >
          <IconifyIcon :icon="ready ? 'lucide:bell-ring' : 'lucide:timer'" class="mr-1 size-4" />
          {{ ready ? $t('sys.task.refreshNow') : `${countdown}s` }}
        </Button>
      </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
