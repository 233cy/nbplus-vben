import { useAccess } from '#/composables/use-access';

/**
 * 字典管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/DictController.php` 保持一致。
 * 查看字典项入口复用 `adm:sys:dict:list`。
 */
export function useDictPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:dict:list']),
    canDetail: hasAccessByCodes(['adm:sys:dict:detail']),
    canCreate: hasAccessByCodes(['adm:sys:dict:create']),
    canUpdate: hasAccessByCodes(['adm:sys:dict:update']),
    canDelete: hasAccessByCodes(['adm:sys:dict:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:dict:delete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:dict:update']),
    canInlineUpdate: hasAccessByCodes(['adm:sys:dict:update']),
    canItemsList: hasAccessByCodes(['adm:sys:dict:items:list']),
    canItemsDetail: hasAccessByCodes(['adm:sys:dict:items:detail']),
    canItemsCreate: hasAccessByCodes(['adm:sys:dict:items:create']),
    canItemsUpdate: hasAccessByCodes(['adm:sys:dict:items:update']),
    canItemsDelete: hasAccessByCodes(['adm:sys:dict:items:delete']),
  };
}
