import { useRouter } from 'vue-router';

import { resolveApprovalRoute } from '#/views/approval/registry';

/**
 * useApprovalJump - 审批单据标题跳转逻辑
 *
 * 优先走业务注册的详情路由（registry），未注册时调用方传入的兜底回调
 * 打开快照详情弹窗。
 */
export function useApprovalJump(onFallback: (bizType: string, bizId: string) => void) {
  const router = useRouter();

  function jumpToDetail(bizType: string, bizId: string) {
    const target = resolveApprovalRoute(bizType, bizId);
    if (target) {
      router.push(target);
      return;
    }
    onFallback(bizType, bizId);
  }

  return {
    jumpToDetail,
  };
}
