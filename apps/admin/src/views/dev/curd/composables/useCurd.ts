import type { CurdAdminApi } from '#/api/admin/dev/curdAdmin';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { generateCurdApi } from '#/api/admin/dev/curdAdmin';
import { $t } from '#/locales';

/**
 * useCurd - CURD 管理主页面逻辑
 *
 * 负责：
 * 1. 维护 VxeGrid API 引用与刷新
 * 2. 代码生成 loading 状态
 */
export function useCurd() {
  const gridApi = ref<null | {
    grid?: { getCheckboxRecords: () => any[] };
    query: () => void;
  }>(null);
  const generateLoading = ref<Record<string, boolean>>({});

  function onRefresh() {
    gridApi.value?.query();
  }

  async function onGenerate(row: CurdAdminApi.CurdTable) {
    generateLoading.value[row.id] = true;
    try {
      const files = await generateCurdApi(row.id);
      message.success($t('dev.curd.generateSuccess', { count: files.length }));
    } finally {
      generateLoading.value[row.id] = false;
    }
  }

  return {
    gridApi,
    generateLoading,
    onRefresh,
    onGenerate,
  };
}
