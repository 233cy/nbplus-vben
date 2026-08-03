import { registerApprovalDetailRoute } from '#/views/approval/registry';

/**
 * 请假演示模块的审批详情路由注册
 *
 * 在本模块路由组件（index.vue / detail.vue）加载时经模块副作用执行注册；
 * 注册前待办中心点击该 bizType 的单据标题会走快照详情兜底。
 */
registerApprovalDetailRoute('demo_leave', bizId => ({
  path: '/demos/approval/detail',
  query: { bizId },
}));
