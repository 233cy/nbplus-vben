/**
 * useDeptTree - 部门树数据管理
 *
 * 负责：
 * 1. 加载部门树数据
 * 2. 关键字搜索过滤
 * 3. 展开/折叠全部
 * 4. 同级拖拽排序
 * 5. 单条删除、批量删除
 * 6. 状态开关切换
 */

import type { DeptTreeNode } from '../data';

import type { DeptApi } from '#/api/sys/dept';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { batchDeleteDeptApi, deleteDeptApi, getDeptTreeApi, sortDeptApi, toggleDeptApi } from '#/api/sys/dept';
import { useTableBatchAction } from '#/utils/table';

import { buildGlobalSortItems, buildTreeNodes, collectAllKeys, filterDeptTree, findParentId } from '../data';

export interface UseDeptTreeOptions {
  t: (key: string) => string;
}

export function useDeptTree(options: UseDeptTreeOptions) {
  const { t } = options;

  const loading = ref(false);
  const treeData = ref<DeptApi.DeptItem[]>([]);
  const keyword = ref('');
  const expandedKeys = ref<string[]>([]);
  const checkedKeys = ref<string[]>([]);

  const filteredTreeData = computed<DeptTreeNode[]>(() => {
    const kw = keyword.value.trim().toLowerCase();
    if (!kw) return buildTreeNodes(treeData.value);
    return buildTreeNodes(filterDeptTree(treeData.value, kw));
  });

  async function loadDepts() {
    loading.value = true;
    try {
      treeData.value = await getDeptTreeApi();
    } finally {
      loading.value = false;
    }
  }

  function expandAll() {
    expandedKeys.value = collectAllKeys(treeData.value);
  }

  function collapseAll() {
    expandedKeys.value = [];
  }

  function toggleNode(id: string) {
    const idx = expandedKeys.value.indexOf(id);
    expandedKeys.value = idx === -1 ? [...expandedKeys.value, id] : expandedKeys.value.filter(k => k !== id);
  }

  function allowDrop(info: any): boolean {
    if (!info.dropNode) return false;
    const dragParentId = findParentId(treeData.value, info.dragNode.key);
    const dropParentId = findParentId(treeData.value, info.dropNode.key);
    return dragParentId === dropParentId;
  }

  function onDrop(info: any) {
    if (!info.dropToGap) return;
    const dragParentId = findParentId(treeData.value, info.dragNode.key);
    const dropParentId = findParentId(treeData.value, info.node.key);
    if (dragParentId !== dropParentId) return;

    const dropKey: string = info.node.key;
    const dragKey: string = info.dragNode.key;
    const dropPos: string[] = info.node.pos.split('-');
    const dropPosition: number = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const nextTree = JSON.parse(JSON.stringify(treeData.value)) as DeptApi.DeptItem[];
    let dragObj!: DeptApi.DeptItem;

    loop(nextTree, dragKey, (item, idx, arr) => {
      arr.splice(idx, 1);
      dragObj = item;
    });

    if (dropPosition === -1) {
      loop(nextTree, dropKey, (_item, idx, arr) => arr.splice(idx, 0, dragObj));
    } else {
      loop(nextTree, dropKey, (_item, idx, arr) => arr.splice(idx + 1, 0, dragObj));
    }

    treeData.value = nextTree;
    sortDeptApi(buildGlobalSortItems(nextTree)).catch(() => loadDepts());
  }

  async function handleDelete(id: string) {
    await deleteDeptApi(id);
    message.success(t('sys.dept.deleteSuccess'));
    await loadDepts();
  }

  function handleBatchDelete() {
    if (checkedKeys.value.length === 0) {
      message.warning(t('sys.dept.batchDeleteEmpty'));
      return;
    }

    useTableBatchAction(
      batchDeleteDeptApi,
      checkedKeys.value,
      t('common.delete'),
      async () => {
        checkedKeys.value = [];
        await loadDepts();
      },
    );
  }

  const toggleLoading = ref<Record<string, boolean>>({});

  async function handleToggleStatus(item: DeptApi.DeptItem) {
    const key = `${item.id}_status`;
    toggleLoading.value[key] = true;
    try {
      const nextStatus = item.status === 1 ? 2 : 1;
      await toggleDeptApi(item.id, nextStatus);
      item.status = nextStatus;
    } finally {
      toggleLoading.value[key] = false;
    }
  }

  return {
    loading,
    treeData,
    filteredTreeData,
    keyword,
    expandedKeys,
    checkedKeys,
    toggleLoading,
    loadDepts,
    expandAll,
    collapseAll,
    toggleNode,
    allowDrop,
    onDrop,
    handleDelete,
    handleBatchDelete,
    handleToggleStatus,
  };
}

function loop(data: DeptApi.DeptItem[], key: string, cb: (item: DeptApi.DeptItem, idx: number, arr: DeptApi.DeptItem[]) => void) {
  for (let i = 0; i < data.length; i++) {
    if (data[i]!.id === key) {
      cb(data[i]!, i, data);
      return;
    }
    if (data[i]!.children?.length) loop(data[i]!.children!, key, cb);
  }
}
