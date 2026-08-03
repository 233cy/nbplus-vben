/**
 * useFlow - 审批流程管理页面表格操作逻辑
 *
 * 负责：
 * 1. 表格刷新
 */
export function useFlow(gridApi: { query: () => void }) {
  function onRefresh() {
    gridApi.query();
  }

  return {
    onRefresh,
  };
}
