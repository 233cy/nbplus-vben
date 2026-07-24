<script setup lang="ts">
import type { TaskApi } from '#/api/sys/task';

import { onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { cancelTaskApi, getTaskListApi, retryTaskApi } from '#/api/sys/task';
import { $t } from '#/locales';

import { useTaskPermission } from './permissions';
import { useColumns } from './schema/columns';
import { useGridFormSchema } from './schema/grid';

useTaskPermission();

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
    showCollapseButton: true,
    submitOnChange: false,
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(onCancel, onRetry),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        queryApi: getTaskListApi,
      } as any,
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: false, search: true, zoom: true },
  },
});

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
    <Grid :table-title="$t('sys.task.pageTitle')">
      <template #toolbar-tools>
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
