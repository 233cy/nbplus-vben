import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'DemosApproval',
    path: '/demos/approval',
    component: () => import('#/views/demos/approval/index.vue'),
    meta: {
      icon: 'lucide:stamp',
      title: $t('demos.approval.pageTitle'),
    },
  },
  {
    name: 'DemosApprovalDetail',
    path: '/demos/approval/detail',
    component: () => import('#/views/demos/approval/detail.vue'),
    meta: {
      hideInMenu: true,
      hideInTab: false,
      title: $t('demos.approval.detailTitle'),
    },
  },
];

export default routes;
