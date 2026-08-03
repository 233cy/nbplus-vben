import { useAccess } from '#/composables/use-access';

/**
 * 部门管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/UserDeptController.php` 保持一致。
 */
export function useUserDeptPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:userDept:list']),
    canDetail: hasAccessByCodes(['adm:sys:userDept:detail']),
    canCreate: hasAccessByCodes(['adm:sys:userDept:create']),
    canUpdate: hasAccessByCodes(['adm:sys:userDept:update']),
    canDelete: hasAccessByCodes(['adm:sys:userDept:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:userDept:delete']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:userDept:update']),
  };
}
