import type { DeptApi } from '#/api/sys/dept';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { updateDeptApi } from '#/api/sys/dept';

import { buildParentTreeData, ROOT_PARENT } from '../data';

export interface UseDeptMoveOptions {
  treeData: { value: DeptApi.DeptItem[] };
  reload: () => Promise<void>;
  t: (key: string) => string;
}

export function useDeptMove(options: UseDeptMoveOptions) {
  const { treeData, reload, t } = options;

  const visible = ref(false);
  const loading = ref(false);
  const moveItem = ref<DeptApi.DeptItem | null>(null);
  const moveParentId = ref<string>(ROOT_PARENT);

  const treeSelectData = computed(() => [
    { label: t('system.dept.rootLevel'), value: ROOT_PARENT, children: [] },
    ...buildParentTreeData(treeData.value, moveItem.value?.id),
  ]);

  function openMove(item: DeptApi.DeptItem) {
    moveItem.value = item;
    moveParentId.value = item.parentId ?? ROOT_PARENT;
    visible.value = true;
  }

  async function handleMove() {
    if (!moveItem.value) return;

    loading.value = true;
    try {
      const parentId = moveParentId.value === ROOT_PARENT ? null : moveParentId.value;
      await updateDeptApi({ ...moveItem.value, parentId });
      message.success(t('system.dept.moveSuccess'));
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
