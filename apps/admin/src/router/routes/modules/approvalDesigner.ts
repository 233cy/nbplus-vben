import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'ApprovalFlowDesigner',
    path: '/approval/flow-designer',
    component: () => import('#/views/approval/flow/designer/index.vue'),
    meta: {
      hideInMenu: true,
      hideInTab: false,
      title: $t('approval.designer.pageTitle'),
    },
  },
];

export default routes;
