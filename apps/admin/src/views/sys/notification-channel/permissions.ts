import { useAccess } from '#/composables/use-access';

/**
 * 通知渠道模块权限码集中判断
 */
export function useNotificationChannelPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:notification-channel:list']),
    canDetail: hasAccessByCodes(['adm:sys:notification-channel:detail']),
    canCreate: hasAccessByCodes(['adm:sys:notification-channel:create']),
    canUpdate: hasAccessByCodes(['adm:sys:notification-channel:update']),
    canDelete: hasAccessByCodes(['adm:sys:notification-channel:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:notification-channel:delete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:notification-channel:update']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:notification-channel:update']),
  };
}
