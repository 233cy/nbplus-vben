import type { UserApi } from '#/api/system/user';

import { ref } from 'vue';

/**
 * useUser - 用户管理页面表格操作逻辑
 *
 * 负责：
 * 1. 表格刷新
 * 2. 获取选中行 ID
 * 3. 在线设备弹窗引用
 */
export function useUser(gridApi: { grid?: { getCheckboxRecords: () => any[] }; query: () => void }) {
  const onlineRef = ref<null | { open: (id: string) => void }>(null);

  function onRefresh() {
    gridApi.query();
  }

  function getSelectedIds(): string[] {
    return (gridApi.grid?.getCheckboxRecords() as UserApi.UserItem[])?.map(r => r.id) ?? [];
  }

  return {
    onlineRef,
    onRefresh,
    getSelectedIds,
  };
}
