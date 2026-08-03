import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'NotificationInbox',
    path: '/inbox',
    component: () => import('#/views/_core/notification-inbox/index.vue'),
    meta: {
      hideInMenu: true,
      hideInTab: false,
      title: $t('core.notification-inbox.pageTitle'),
    },
  },
];

export default routes;
