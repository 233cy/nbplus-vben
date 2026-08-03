import type { NotificationChannelApi } from '#/api/sys/notificationChannel';

/**
 * 通知渠道页面表格操作逻辑
 */
export function useNotificationChannel(gridApi: { grid?: { getCheckboxRecords: () => any[] }; query: () => void }) {
  function onRefresh() {
    gridApi.query();
  }

  function getSelectedIds(): string[] {
    return (gridApi.grid?.getCheckboxRecords() as NotificationChannelApi.ChannelItem[])?.map(r => r.id) ?? [];
  }

  return {
    onRefresh,
    getSelectedIds,
  };
}
