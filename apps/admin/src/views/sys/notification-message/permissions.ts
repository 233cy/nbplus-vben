import { useAccess } from '#/composables/use-access';

/**
 * 通知记录模块权限码集中判断
 */
export function useNotificationMessagePermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:notification-message:list']),
    canDetail: hasAccessByCodes(['adm:sys:notification-message:detail']),
    canResend: hasAccessByCodes(['adm:sys:notification-message:resend']),
  };
}
