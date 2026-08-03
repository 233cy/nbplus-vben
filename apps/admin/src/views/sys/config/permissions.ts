import { useAccess } from '#/composables/use-access';

/**
 * 系统参数模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/ConfigController.php` 保持一致。
 */
export function useConfigPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:config:list']),
    canDetail: hasAccessByCodes(['adm:sys:config:detail']),
    canCreate: hasAccessByCodes(['adm:sys:config:create']),
    canUpdate: hasAccessByCodes(['adm:sys:config:update']),
    canDelete: hasAccessByCodes(['adm:sys:config:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:config:delete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:config:update']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:config:update']),
  };
}
