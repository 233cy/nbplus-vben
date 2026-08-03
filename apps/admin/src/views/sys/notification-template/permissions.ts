import { useAccess } from '#/composables/use-access';

/**
 * 通知模板模块权限码集中判断
 */
export function useNotificationTemplatePermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:notification-template:list']),
    canDetail: hasAccessByCodes(['adm:sys:notification-template:detail']),
    canCreate: hasAccessByCodes(['adm:sys:notification-template:create']),
    canUpdate: hasAccessByCodes(['adm:sys:notification-template:update']),
    canDelete: hasAccessByCodes(['adm:sys:notification-template:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:notification-template:delete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:notification-template:update']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:notification-template:update']),
    canTestSend: hasAccessByCodes(['adm:sys:notification-template:test-send']),
  };
}
