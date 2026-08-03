import type { TaskApi } from '#/api/sys/task';

import { onBeforeUnmount, onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { cancelMyTaskApi, getMyTaskCountApi, getMyTaskListApi } from '#/api/sys/task';
import { $t } from '#/locales';

/** 进行中数轮询间隔（与未读数同节奏） */
const POLL_INTERVAL = 30_000;
/** 弹窗列表条数 */
const LIST_SIZE = 10;

/**
 * 铃铛弹层「我的任务」（进行中面板）
 *
 * 采用轮询模式：每 30s 刷新进行中数量（轻量接口，作 Tab 角标）；
 * 列表只在 Tab 激活时由调用方触发 `loadList()` 加载（前 10 条），
 * 后端只返回当前用户 待执行+进行中 的任务，完成/失败/取消后自动从面板消失。
 */
export function useMyTasks() {
  const tasks = ref<TaskApi.TaskItem[]>([]);
  const runningCount = ref(0);
  const listLoading = ref(false);

  let timer: ReturnType<typeof setInterval> | undefined;

  async function refreshCount() {
    try {
      const res = await getMyTaskCountApi();
      runningCount.value = res.count;
    } catch {
      // 静默失败（如网络异常），下一轮再试
    }
  }

  async function loadList() {
    listLoading.value = true;
    try {
      const res = await getMyTaskListApi({ page: 1, pageSize: LIST_SIZE });
      tasks.value = res.items ?? [];
    } catch {
      // 静默失败，保留旧列表
    } finally {
      listLoading.value = false;
    }
  }

  /** 取消任务：成功后刷新列表与角标 */
  async function cancel(id: string) {
    await cancelMyTaskApi(id);
    message.success($t('sys.task.cancelSuccess'));
    await Promise.all([loadList(), refreshCount()]);
  }

  onMounted(() => {
    refreshCount();
    timer = setInterval(refreshCount, POLL_INTERVAL);
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
  });

  return {
    tasks,
    runningCount,
    listLoading,
    loadList,
    refreshCount,
    cancel,
  };
}
