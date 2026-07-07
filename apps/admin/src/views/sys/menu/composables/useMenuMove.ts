/**
 * useMenuMove - 菜单移动逻辑
 */

import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { getMenuTreeApi, updateMenuApi } from '#/api/sys/menuAdmin';

import { ROOT_PARENT } from './useMenuForm';

function buildParentTreeData(nodes: MenuAdminApi.MenuItem[], excludeId?: string): { children: any[]; label: string; value: string }[] {
  const result: { children: any[]; label: string; value: string }[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    result.push({
      label: node.title,
      value: node.id,
      children: node.children?.length ? buildParentTreeData(node.children, excludeId) : [],
    });
  }
  return result;
}

export interface UseMenuMoveOptions {
  gridApi: any;
  t: (key: string, params?: Record<string, any>) => string;
}

export function useMenuMove(options: UseMenuMoveOptions) {
  const { gridApi, t } = options;

  const visible = ref(false);
  const loading = ref(false);
  const moveItem = ref<MenuAdminApi.MenuItem | null>(null);
  const moveParentId = ref<string>(ROOT_PARENT);
  const treeData = ref<MenuAdminApi.MenuItem[]>([]);

  const treeSelectData = computed(() => [{ label: t('sys.menu.rootLevel'), value: ROOT_PARENT, children: [] }, ...buildParentTreeData(treeData.value, moveItem.value?.id)]);

  async function loadTreeData() {
    try {
      treeData.value = await getMenuTreeApi();
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
      const parentId = moveParentId.value === ROOT_PARENT ? null : moveParentId.value;
      await updateMenuApi({ ...moveItem.value, parentId });
      message.success(t('sys.menu.moveSuccess'));
      visible.value = false;
      await gridApi.query();
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
