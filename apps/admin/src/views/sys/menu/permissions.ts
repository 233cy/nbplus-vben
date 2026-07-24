import { useAccess } from '#/composables/use-access';

/**
 * 菜单管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/MenuController.php` 保持一致。
 */
export function useMenuAccessPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:menu:list']),
    canDetail: hasAccessByCodes(['adm:sys:menu:detail']),
    canCreate: hasAccessByCodes(['adm:sys:menu:create']),
    canUpdate: hasAccessByCodes(['adm:sys:menu:update']),
    canDelete: hasAccessByCodes(['adm:sys:menu:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:menu:delete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:menu:update']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:menu:update']),
    canBatchCreate: hasAccessByCodes(['adm:sys:menu:batchCreate']),
    // 后端 controller-methods/controller-prefixes 接口复用 list 权限码
    canControllerMethods: hasAccessByCodes(['adm:sys:menu:list']),
  };
}
