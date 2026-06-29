/**
 * useMenuTree - 菜单树数据管理
 *
 * 负责：
 * 1. 加载菜单树数据
 * 2. 关键字搜索过滤
 * 3. 展开/折叠全部
 * 4. 同级拖拽排序
 * 5. 单条删除、批量删除
 * 6. 状态/缓存开关切换
 */

import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { batchDeleteMenuApi, deleteMenuApi, getMenuListApi, sortMenuApi, toggleMenuApi } from '#/api/sys/menuAdmin';

import { buildGlobalSortItems, collectAllKeys, findParentId } from '../data';

export interface UseMenuTreeOptions {
  t: (key: string) => string;
}

export function useMenuTree(options: UseMenuTreeOptions) {
  const { t } = options;

  const loading = ref(false);
  const treeData = ref<MenuAdminApi.MenuItem[]>([]);
  const keyword = ref('');
  const expandedKeys = ref<string[]>([]);
  const checkedKeys = ref<string[]>([]);

  const filteredTreeData = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    if (!kw) return treeData.value;
    return filterTree(treeData.value, kw);
  });

  async function loadMenus() {
    loading.value = true;
    try {
      treeData.value = await getMenuListApi();
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

  function getNodeKey(node: any): string | undefined {
    if (!node) return undefined;
    return node.key ?? node.eventKey ?? node.dataRef?.id ?? node.dataRef?.key ?? node.data?.id ?? node.data?.key ?? node.id;
  }

  function allowDrop(info: any): boolean {
    if (!info?.dropNode || !info?.dragNode) return false;
    const dragKey = getNodeKey(info.dragNode);
    const dropKey = getNodeKey(info.dropNode);
    if (!dragKey || !dropKey) return false;
    const dragParentId = findParentId(treeData.value, dragKey);
    const dropParentId = findParentId(treeData.value, dropKey);
    return dragParentId === dropParentId;
  }

  function onDrop(info: any) {
    const dragKey: string | undefined = getNodeKey(info.dragNode);
    const dropKey: string | undefined = getNodeKey(info.node);
    if (!dragKey || !dropKey || !info.node?.pos) return;
    // Ant Design Vue 的 dropPosition 已经是相对位置：-1 上方、0 内部、1 下方
    const dropPosition: number = info.dropPosition;
    if (dropPosition === 0) return;

    const dragParentId = findParentId(treeData.value, dragKey);
    const dropParentId = findParentId(treeData.value, dropKey);
    if (dragParentId !== dropParentId) return;

    // eslint-disable-next-line unicorn/prefer-structured-clone
    const nextTree = JSON.parse(JSON.stringify(treeData.value)) as MenuAdminApi.MenuItem[];
    let dragObj!: MenuAdminApi.MenuItem;

    loop(nextTree, dragKey, (item, idx, arr) => {
      arr.splice(idx, 1);
      dragObj = item;
    });

    if (!info.dropToGap) return;

    loop(nextTree, dropKey, (_item, idx, arr) => {
      if (dropPosition === -1) {
        arr.splice(idx, 0, dragObj);
      } else {
        arr.splice(idx + 1, 0, dragObj);
      }
    });

    treeData.value = nextTree;
    sortMenuApi(buildGlobalSortItems(nextTree)).catch(() => loadMenus());
  }

  async function handleDelete(id: string) {
    await deleteMenuApi(id);
    message.success(t('dev.menu.deleteSuccess'));
    await loadMenus();
  }

  async function handleBatchDelete() {
    if (checkedKeys.value.length === 0) {
      message.warning(t('dev.menu.batchDeleteEmpty'));
      return;
    }
    const result = await batchDeleteMenuApi(checkedKeys.value);
    const deletedCount = result.deleted.length;
    const skippedCount = result.skipped.length;

    if (deletedCount === 0) {
      message.warning(t('dev.menu.batchDeleteWarning', { count: skippedCount }));
    } else if (skippedCount === 0) {
      message.success(t('dev.menu.batchDeleteSuccess', { count: deletedCount }));
    } else {
      message.success(t('dev.menu.batchDeletePartial', { deleted: deletedCount, skipped: skippedCount }));
    }

    checkedKeys.value = [];
    await loadMenus();
  }

  const toggleLoading = ref<Record<string, boolean>>({});

  async function handleToggleStatus(item: MenuAdminApi.MenuItem) {
    const key = `${item.id}_status`;
    toggleLoading.value[key] = true;
    try {
      const nextStatus = item.status === 1 ? 2 : 1;
      await toggleMenuApi(item.id, 'status', nextStatus);
      item.status = nextStatus;
    } finally {
      toggleLoading.value[key] = false;
    }
  }

  async function handleToggleKeepAlive(item: MenuAdminApi.MenuItem) {
    const key = `${item.id}_keepAlive`;
    toggleLoading.value[key] = true;
    try {
      const nextValue = !item.isKeepAlive;
      await toggleMenuApi(item.id, 'isKeepAlive', nextValue);
      item.isKeepAlive = nextValue;
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
    loadMenus,
    expandAll,
    collapseAll,
    toggleNode,
    allowDrop,
    onDrop,
    handleDelete,
    handleBatchDelete,
    handleToggleStatus,
    handleToggleKeepAlive,
  };
}

function filterTree(nodes: MenuAdminApi.MenuItem[], keyword: string): MenuAdminApi.MenuItem[] {
  return nodes
    .map(node => {
      const children = node.children?.length ? filterTree(node.children, keyword) : [];
      const matchSelf = node.title.toLowerCase().includes(keyword) || node.name?.toLowerCase().includes(keyword);
      if (matchSelf) {
        return { ...node, children: children.length > 0 ? children : node.children };
      }
      if (children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean) as MenuAdminApi.MenuItem[];
}

function loop(data: MenuAdminApi.MenuItem[], key: string, cb: (item: MenuAdminApi.MenuItem, idx: number, arr: MenuAdminApi.MenuItem[]) => void) {
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item) continue;
    if (item.id === key) {
      cb(item, i, data);
      return;
    }
    if (item.children?.length) loop(item.children, key, cb);
  }
}
