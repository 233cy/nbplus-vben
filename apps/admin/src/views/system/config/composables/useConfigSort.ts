import type { ConfigApi } from '#/api/system/config';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { sortConfigApi } from '#/api/system/config';
import { $t } from '#/locales';

export interface SortTreeNode {
  key: string;
  title: string;
  isLeaf: true;
  _item: ConfigApi.ConfigItem;
}

interface UseConfigSortOptions {
  onSuccess: () => Promise<void>;
}

/**
 * 拖拽排序弹窗逻辑.
 */
export function useConfigSort(options: UseConfigSortOptions) {
  const { onSuccess } = options;

  const sortModalVisible = ref(false);
  const sortLoading = ref(false);
  const sortTreeData = ref<SortTreeNode[]>([]);

  function openSortModal(items: ConfigApi.ConfigItem[]) {
    sortTreeData.value = [...items]
      .toSorted((a, b) => a.sort - b.sort)
      .map(item => ({
        key: item.id,
        title: item.label,
        isLeaf: true as const,
        _item: item,
      }));
    sortModalVisible.value = true;
  }

  function onTreeDrop(info: any) {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const data = [...sortTreeData.value];

    const dragIdx = data.findIndex(n => n.key === dragKey);
    if (dragIdx === -1) return;
    const dragObj = data.splice(dragIdx, 1)[0];
    if (!dragObj) return;

    const targetIdx = data.findIndex(n => n.key === dropKey);
    if (targetIdx === -1) {
      data.splice(dragIdx, 0, dragObj);
      sortTreeData.value = data;
      return;
    }

    if (!info.dropToGap || dropPosition === -1) {
      data.splice(targetIdx, 0, dragObj);
    } else {
      data.splice(targetIdx + 1, 0, dragObj);
    }

    sortTreeData.value = data;
  }

  async function handleSortOk() {
    sortLoading.value = true;
    try {
      const items = sortTreeData.value.map((node, idx) => ({
        id: node.key,
        sort: (idx + 1) * 5,
      }));
      await sortConfigApi(items);
      message.success($t('system.config.sortSuccess'));
      sortModalVisible.value = false;
      await onSuccess();
    } finally {
      sortLoading.value = false;
    }
  }

  return {
    sortModalVisible,
    sortLoading,
    sortTreeData,
    openSortModal,
    onTreeDrop,
    handleSortOk,
  };
}
