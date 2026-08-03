import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

/**
 * 通知模板页面表格操作逻辑
 */
export function useNotificationTemplate(gridApi: { grid?: { getCheckboxRecords: () => any[] }; query: () => void }) {
  function onRefresh() {
    gridApi.query();
  }

  function getSelectedIds(): string[] {
    return (gridApi.grid?.getCheckboxRecords() as NotificationTemplateApi.Template[])?.map(r => r.id) ?? [];
  }

  return {
    onRefresh,
    getSelectedIds,
  };
}
