import type { NotificationMessageApi } from '#/api/sys/notificationMessage';

/**
 * 通知记录页面表格操作逻辑
 */
export function useNotificationMessage(gridApi: { grid?: { getCheckboxRecords: () => any[] }; query: () => void }) {
  function onRefresh() {
    gridApi.query();
  }

  function getSelectedIds(): string[] {
    return (gridApi.grid?.getCheckboxRecords() as NotificationMessageApi.MessageItem[])?.map(r => r.id) ?? [];
  }

  return {
    onRefresh,
    getSelectedIds,
  };
}
