import { useAccess } from '#/composables/use-access';

/**
 * 用户管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/UserController.php` 保持一致。
 */
export function useUserPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:user:list']),
    canDetail: hasAccessByCodes(['adm:sys:user:detail']),
    canCreate: hasAccessByCodes(['adm:sys:user:create']),
    canUpdate: hasAccessByCodes(['adm:sys:user:update']),
    canDelete: hasAccessByCodes(['adm:sys:user:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:user:batchDelete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:user:batchUpdate']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:user:inlineUpdate']),
    canOnline: hasAccessByCodes(['adm:sys:user:online']),
    canKick: hasAccessByCodes(['adm:sys:user:kick']),
    canKickAll: hasAccessByCodes(['adm:sys:user:kickAll']),
  };
}
