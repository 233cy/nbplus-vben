import type { PostApi } from '#/api/sys/userDuty';

/**
 * usePost - 职务管理页面表格操作逻辑
 *
 * 负责：
 * 1. 表格刷新
 * 2. 获取选中行 ID
 */
export function usePost(gridApi: { grid?: { getCheckboxRecords: () => any[] }; query: () => void }) {
  function onRefresh() {
    gridApi.query();
  }

  function getSelectedIds(): string[] {
    return (gridApi.grid?.getCheckboxRecords() as PostApi.PostItem[])?.map(r => r.id) ?? [];
  }

  return {
    onRefresh,
    getSelectedIds,
  };
}
