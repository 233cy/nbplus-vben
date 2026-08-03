import { useAccess } from '#/composables/use-access';

/**
 * 审批实例管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/ApprovalInstanceController.php` 保持一致。
 */
export function useInstancePermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:approval:instance:list']),
    canDetail: hasAccessByCodes(['adm:approval:instance:detail']),
  };
}
