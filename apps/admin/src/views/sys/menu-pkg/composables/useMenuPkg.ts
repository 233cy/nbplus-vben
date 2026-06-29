import type { MenuPkgApi } from '#/api/sys/menu-pkg';

/**
 * useMenuPkg - 权限包管理页面表格操作逻辑
 */
export function useMenuPkg(gridApi: { grid?: { getCheckboxRecords: () => any[] }; query: () => void }) {
  function onRefresh() {
    gridApi.query();
  }

  function getSelectedIds(): string[] {
    return (gridApi.grid?.getCheckboxRecords() as MenuPkgApi.MenuPkgItem[])?.map(r => r.id) ?? [];
  }

  return {
    onRefresh,
    getSelectedIds,
  };
}
