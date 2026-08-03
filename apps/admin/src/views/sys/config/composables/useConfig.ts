import type { ConfigApi } from '#/api/sys/config';

/**
 * 系统参数页面表格操作逻辑
 *
 * 负责：
 * 1. 表格刷新
 * 2. 获取选中行 ID
 */
export function useConfig(gridApi: {
  grid?: { getCheckboxRecords: () => any[] };
  query: () => void;
}) {
  function onRefresh() {
    gridApi.query();
  }

  function getSelectedIds(): string[] {
    return (gridApi.grid?.getCheckboxRecords() as ConfigApi.ConfigItem[])?.map(r => r.id) ?? [];
  }

  return {
    onRefresh,
    getSelectedIds,
  };
}
