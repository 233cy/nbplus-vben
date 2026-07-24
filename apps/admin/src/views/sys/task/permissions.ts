import { useAccess } from '#/composables/use-access';

/**
 * 任务中心权限码集中判断
 */
export function useTaskPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:task:list']),
    canCancel: hasAccessByCodes(['adm:sys:task:cancel']),
    canRetry: hasAccessByCodes(['adm:sys:task:retry']),
  };
}
