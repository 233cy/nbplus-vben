import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/workspace/index.vue'),
    meta: {
      icon: 'lucide:house',
      ignoreAccess: true,
      order: 0,
      affixTab: true,
      affixTabOrder: 0,
      title: $t('workspace.workspace'),
    },
    name: 'Workspace',
    path: '/workspace',
  },
];

export default routes;
