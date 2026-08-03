import { useAccess } from '#/composables/use-access';

/**
 * 职务管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/UserDutyController.php` 保持一致。
 */
export function useUserDutyPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:userDuty:list']),
    canDetail: hasAccessByCodes(['adm:sys:userDuty:detail']),
    canCreate: hasAccessByCodes(['adm:sys:userDuty:create']),
    canUpdate: hasAccessByCodes(['adm:sys:userDuty:update']),
    canDelete: hasAccessByCodes(['adm:sys:userDuty:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:userDuty:delete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:userDuty:update']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:userDuty:update']),
  };
}
