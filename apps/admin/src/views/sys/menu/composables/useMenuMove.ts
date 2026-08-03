/**
 * useMenuMove - 菜单移动逻辑
 */

import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { getMenuTreeApi, updateMenuApi } from '#/api/sys/menuAdmin';

import { buildParentTreeData, ROOT_PARENT } from '../data';

export interface UseMenuMoveOptions {
  onSuccess?: (payload: { originalParentId: string | null; newParentId: string | null }) => void | Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
}

export function useMenuMove(options: UseMenuMoveOptions) {
  const { onSuccess, t } = options;

  const visible = ref(false);
  const loading = ref(false);
  const moveItem = ref<MenuAdminApi.MenuItem | null>(null);
  const moveParentId = ref<string>(ROOT_PARENT);
  const treeData = ref<MenuAdminApi.MenuItem[]>([]);

  const treeSelectData = computed(() => [{ label: t('sys.menu.rootLevel'), value: ROOT_PARENT, children: [] }, ...buildParentTreeData(treeData.value, moveItem.value?.id)]);

  async function loadTreeData() {
    try {
      const result = await getMenuTreeApi();
      treeData.value = result.items ?? [];
    } catch {
      treeData.value = [];
    }
  }

  async function openMove(item: MenuAdminApi.MenuItem) {
    await loadTreeData();
    moveItem.value = item;
    moveParentId.value = item.parentId ?? ROOT_PARENT;
    visible.value = true;
  }

  async function handleMove() {
    if (!moveItem.value) return;

    loading.value = true;
    try {
      const originalParentId = moveItem.value.parentId ?? null;
      const parentId = moveParentId.value === ROOT_PARENT ? null : moveParentId.value;
      await updateMenuApi({ ...moveItem.value, parentId });
      message.success(t('sys.menu.moveSuccess'));
      visible.value = false;
      await onSuccess?.({ originalParentId, newParentId: parentId });
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
