import { useAccess } from '#/composables/use-access';

/**
 * 审批流程管理模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/ApprovalFlowController.php` 保持一致。
 */
export function useFlowPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:approval:flow:list']),
    canDetail: hasAccessByCodes(['adm:approval:flow:detail']),
    canDesign: hasAccessByCodes(['adm:approval:flow:design']),
    canStatus: hasAccessByCodes(['adm:approval:flow:status']),
  };
}
