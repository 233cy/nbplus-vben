import { useAccess } from '#/composables/use-access';

/**
 * 文件管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/FileController.php` 保持一致。
 */
export function useFilePermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:file:list']),
    canDetail: hasAccessByCodes(['adm:sys:file:detail']),
    canDelete: hasAccessByCodes(['adm:sys:file:delete']),
    canBatchDelete: hasAccessByCodes(['adm:sys:file:delete']),
    canMove: hasAccessByCodes(['adm:sys:file:move']),
    canSaveConfig: hasAccessByCodes(['adm:sys:file:saveConfig']),
    canPreview: hasAccessByCodes(['adm:sys:file:preview']),
  };
}
