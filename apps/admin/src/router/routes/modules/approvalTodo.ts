import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'ApprovalTodo',
    path: '/approval/todo',
    component: () => import('#/views/approval/todo/index.vue'),
    meta: {
      hideInMenu: true,
      hideInTab: false,
      title: $t('approval.todo.pageTitle'),
    },
  },
];

export default routes;
