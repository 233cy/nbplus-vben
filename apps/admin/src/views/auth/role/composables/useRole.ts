import type { RoleApi } from '#/api/system/role';

/**
 * useRole - 角色管理页面表格操作逻辑
 *
 * 负责：
 * 1. 表格刷新
 * 2. 获取选中行 ID
 */
export function useRole(gridApi: { grid?: { getCheckboxRecords: () => any[] }; query: () => void }) {
  function onRefresh() {
    gridApi.query();
  }

  function getSelectedIds(): string[] {
    return (gridApi.grid?.getCheckboxRecords() as RoleApi.RoleItem[])?.map((r) => r.id) ?? [];
  }

  return {
    onRefresh,
    getSelectedIds,
  };
}
