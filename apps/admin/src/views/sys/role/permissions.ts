import { useAccess } from '#/composables/use-access';

/**
 * 角色管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/RoleController.php` 保持一致。
 */
export function useRolePermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:role:list']),
    canDetail: hasAccessByCodes(['adm:sys:role:detail']),
    canCreate: hasAccessByCodes(['adm:sys:role:create']),
    canUpdate: hasAccessByCodes(['adm:sys:role:update']),
    canDelete: hasAccessByCodes(['adm:sys:role:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:role:delete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:role:update']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:role:update']),
    canAssignMenus: hasAccessByCodes(['adm:sys:role:assignMenus']),
    canAssignDataScope: hasAccessByCodes(['adm:sys:role:assignDataScope']),
  };
}
