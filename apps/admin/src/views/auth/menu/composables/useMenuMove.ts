/**
 * useMenuMove - 菜单移动逻辑
 *
 * 负责：
 * 1. 控制移动弹窗
 * 2. 选择目标父节点
 * 3. 提交移动并刷新
 */

import type { MenuAdminApi } from '#/api/auth/menuAdmin';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { updateMenuApi } from '#/api/auth/menuAdmin';

import { buildParentTreeData, ROOT_PARENT } from '../data';

export interface UseMenuMoveOptions {
  treeData: { value: MenuAdminApi.MenuItem[] };
  reload: () => Promise<void>;
  t: (key: string) => string;
}

export function useMenuMove(options: UseMenuMoveOptions) {
  const { treeData, reload, t } = options;

  const visible = ref(false);
  const loading = ref(false);
  const moveItem = ref<MenuAdminApi.MenuItem | null>(null);
  const moveParentId = ref<string>(ROOT_PARENT);

  const treeSelectData = computed(() => [
    { label: t('dev.menu.rootLevel'), value: ROOT_PARENT, children: [] },
    ...buildParentTreeData(treeData.value, moveItem.value?.id),
  ]);

  function openMove(item: MenuAdminApi.MenuItem) {
    moveItem.value = item;
    moveParentId.value = item.parentId ?? ROOT_PARENT;
    visible.value = true;
  }

  async function handleMove() {
    if (!moveItem.value) return;

    loading.value = true;
    try {
      const parentId = moveParentId.value === ROOT_PARENT ? null : moveParentId.value;
      await updateMenuApi({ ...moveItem.value, parentId });
      message.success(t('dev.menu.moveSuccess'));
      visible.value = false;
      await reload();
    } finally {
      loading.value = false;
    }
  }

  return {
    visible,
    loading,
    moveItem,
    moveParentId,
    treeSelectData,
    openMove,
    handleMove,
  };
}
