import type { DeptApi } from '#/api/sys/userDept';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { getDeptTreeApi, updateDeptApi } from '#/api/sys/userDept';

import { buildParentTreeData, ROOT_PARENT } from '../data';

export interface UseDeptMoveOptions {
  onSuccess?: (payload: { originalParentId: string | null; newParentId: string | null }) => void | Promise<void>;
  t: (key: string) => string;
}

export function useDeptMove(options: UseDeptMoveOptions) {
  const { onSuccess, t } = options;

  const visible = ref(false);
  const loading = ref(false);
  const moveItem = ref<DeptApi.DeptItem | null>(null);
  const moveParentId = ref<string>(ROOT_PARENT);
  const treeData = ref<DeptApi.DeptItem[]>([]);

  const treeSelectData = computed(() => [{ label: t('sys.user-dept.rootLevel'), value: ROOT_PARENT, children: [] }, ...buildParentTreeData(treeData.value, moveItem.value?.id)]);

  async function loadTreeData() {
    const { items } = await getDeptTreeApi();
    treeData.value = items;
  }

  function openMove(item: DeptApi.DeptItem) {
    moveItem.value = item;
    moveParentId.value = item.parentId ?? ROOT_PARENT;
    loadTreeData();
    visible.value = true;
  }

  async function handleMove() {
    if (!moveItem.value) return;

    loading.value = true;
    try {
      const originalParentId = moveItem.value.parentId ?? null;
      const parentId = moveParentId.value === ROOT_PARENT ? null : moveParentId.value;
      await updateDeptApi({ ...moveItem.value, parentId } as DeptApi.SaveParams & { id: string });
      message.success(t('sys.user-dept.moveSuccess'));
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
