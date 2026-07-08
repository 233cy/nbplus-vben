import { useAccess } from '#/composables/use-access';

/**
 * 存储配置模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/StorageController.php` 保持一致。
 */
export function useStoragePermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:storage:list']),
    canDetail: hasAccessByCodes(['adm:sys:storage:detail']),
    canCreate: hasAccessByCodes(['adm:sys:storage:create']),
    canUpdate: hasAccessByCodes(['adm:sys:storage:update']),
    canDelete: hasAccessByCodes(['adm:sys:storage:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:storage:delete']),
    canBatchUpdate: hasAccessByCodes(['adm:sys:storage:update']),
    canSetDefault: hasAccessByCodes(['adm:sys:storage:update']),
  };
}
