import { useAccess } from '#/composables/use-access';

/**
 * 通知发送模块权限码集中判断
 */
export function useNotificationSendPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:notification-send:list']),
    canSend: hasAccessByCodes(['adm:sys:notification-send:send']),
  };
}
