import type { RouteLocationRaw } from 'vue-router';

/**
 * 审批详情跳转注册表
 *
 * 各业务模块按 bizType 注册自己的详情页解析器，待办中心等公共页面
 * 点击单据标题时经 resolveApprovalRoute 跳转业务详情；
 * 未注册时返回 null，由调用方走快照详情兜底。
 */

export type ApprovalDetailResolver = (bizId: string) => RouteLocationRaw;

const resolvers = new Map<string, ApprovalDetailResolver>();

/** 注册业务单据的详情页路由解析器 */
export function registerApprovalDetailRoute(bizType: string, resolver: ApprovalDetailResolver) {
  resolvers.set(bizType, resolver);
}

/** 解析业务单据的详情页路由，未注册返回 null */
export function resolveApprovalRoute(bizType: string, bizId: string): null | RouteLocationRaw {
  return resolvers.get(bizType)?.(bizId) ?? null;
}
