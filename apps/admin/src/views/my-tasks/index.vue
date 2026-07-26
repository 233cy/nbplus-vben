<script setup lang="ts">
import type { TaskApi } from '#/api/sys/task';

import { onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteMyTaskApi, cancelMyTaskApi, deleteMyTaskApi, getMyTaskPageApi, retryMyTaskApi } from '#/api/sys/task';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { $t } from '#/locales';

import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

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
        queryApi: getMyTaskPageApi,
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

async function onCancel(row: TaskApi.TaskItem) {
  await cancelMyTaskApi(row.id);
  message.success($t('sys.task.cancelSuccess'));
  reload();
}

async function onRetry(row: TaskApi.TaskItem) {
  await retryMyTaskApi(row.id);
  message.success($t('sys.task.retrySuccess'));
  reload();
}

async function onDelete(row: TaskApi.TaskItem) {
  await deleteMyTaskApi(row.id);
  message.success($t('sys.task.deleteSuccess'));
  reload();
}

// 倒计时提醒式刷新（与任务中心一致：不自动刷新，归零后高亮提醒）
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
    <Grid :table-title="$t('sys.task.myTasks')">
      <template #toolbar-tools>
        <BatchActionDropdown
          class="mr-2"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteMyTaskApi(ids)"
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
  </Page>
</template>
