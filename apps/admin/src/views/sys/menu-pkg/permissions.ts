import { useAccess } from '#/composables/use-access';

/**
 * 权限包管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/MenuPkgController.php` 保持一致。
 */
export function useMenuPkgPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:menuPkg:list']),
    canDetail: hasAccessByCodes(['adm:sys:menuPkg:detail']),
    canCreate: hasAccessByCodes(['adm:sys:menuPkg:create']),
    canUpdate: hasAccessByCodes(['adm:sys:menuPkg:update']),
    canDelete: hasAccessByCodes(['adm:sys:menuPkg:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:menuPkg:delete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:menuPkg:update']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:menuPkg:update']),
    canAssignMenus: hasAccessByCodes(['adm:sys:menuPkg:assignMenus']),
  };
}
