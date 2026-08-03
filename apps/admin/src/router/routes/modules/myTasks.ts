import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'MyTasks',
    path: '/my-tasks',
    component: () => import('#/views/my-tasks/index.vue'),
    meta: {
      hideInMenu: true,
      hideInTab: false,
      title: $t('sys.task.myTasks'),
    },
  },
];

export default routes;
