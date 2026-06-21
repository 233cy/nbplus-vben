/**
 * useDictTree - 字典树管理 composable
 *
 * 负责：
 * 1. 加载所有字典数据并按分组构建树结构
 * 2. 关键字搜索过滤
 * 3. 树节点选中状态管理
 * 4. 拖拽排序（分组排序、字典跨组移动、同组排序）
 */

import type { DictApi } from '#/api/system/dict';

import { computed, ref } from 'vue';

import { getAllDictsApi, sortDictApi, updateDictApi } from '#/api/system/dict';
import { $t } from '#/locales';

/** 分组节点类型 */
export interface GroupNode {
  key: string;
  title: string;
  isGroup: true;
  children: DictNode[];
  selectable: false;
}

/** 字典节点类型 */
export interface DictNode {
  key: string;
  title: string;
  isGroup: false;
  dict: DictApi.DictItem;
  selectable: true;
}

/** 树节点联合类型 */
export type TreeNode = DictNode | GroupNode;

export function useDictTree() {
  /** 树数据加载状态 */
  const loading = ref(false);
  /** 所有字典原始数据（平铺列表） */
  const allDicts = ref<DictApi.DictItem[]>([]);
  /** 搜索关键字 */
  const keyword = ref('');
  /** 当前选中的树节点 key */
  const selectedKeys = ref<string[]>([]);
  /** 当前展开的树节点 key */
  const expandedKeys = ref<string[]>([]);
  /** 当前选中的字典对象（用于右侧面板展示） */
  const activeDict = ref<DictApi.DictItem | null>(null);

  /** 获取默认分组名（国际化） */
  const defaultGroup = () => $t('system.dict.defaultGroup');

  /**
   * 计算属性：将平铺的字典数据按 groups 字段分组，构建 Tree 组件所需的树结构
   * 支持按关键字过滤（名称或编码匹配）
   */
  const treeData = computed<TreeNode[]>(() => {
    const kw = keyword.value.toLowerCase();

    // 根据关键字过滤字典
    const filtered = kw
      ? allDicts.value.filter((d) => d.name.toLowerCase().includes(kw) || d.code.toLowerCase().includes(kw))
      : allDicts.value;

    // 按分组归类
    const groupMap = new Map<string, DictApi.DictItem[]>();
    for (const d of filtered) {
      const g = d.groups || defaultGroup();
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(d);
    }

    // 转换为 ant-design Tree 所需的节点格式
    return [...groupMap.entries()].map(([groupName, dicts]) => ({
      key: `group::${groupName}`,
      title: groupName,
      isGroup: true as const,
      selectable: false as const,
      children: dicts.map((d) => ({
        key: d.id,
        title: d.name,
        isGroup: false as const,
        selectable: true as const,
        dict: d,
      })),
    }));
  });

  /**
   * 从后端加载所有字典数据，并自动展开所有分组
   */
  async function loadDicts() {
    loading.value = true;
    try {
      allDicts.value = await getAllDictsApi();
      // 自动展开所有分组节点
      expandedKeys.value = [
        ...new Set(allDicts.value.map((d) => `group::${d.groups || defaultGroup()}`)),
      ];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 树节点选中事件处理
   * 只有字典节点（非分组节点）可以被选中
   */
  function onSelect(keys: (number | string)[], info: any) {
    const node = info.node as TreeNode;
    if (node.isGroup) return; // 分组节点不可选中
    selectedKeys.value = keys as string[];
    activeDict.value = node.dict;
  }

  // ===========================
  // 拖拽处理
  // ===========================

  /**
   * Tree 拖拽放置事件的统一入口
   * 根据拖拽节点和放置节点的类型分发到不同处理函数：
   * - 分组 → 分组：分组排序
   * - 字典 → 分组（dropPosition=0 表示放入）：字典移动到目标分组
   * - 字典 → 字典：同组/跨组排序
   */
  async function onDrop(info: any) {
    const dragNode: TreeNode = info.dragNode;
    const dropNode: TreeNode = info.node;
    const dropPosition: number = info.dropPosition;

    if (dragNode.isGroup) {
      await handleGroupDrop(dragNode, dropNode, dropPosition);
    } else if (dropNode.isGroup && dropPosition === 0) {
      await handleDictToGroup(dragNode, dropNode);
    } else if (!dropNode.isGroup) {
      await handleDictReorder(dragNode, dropNode, dropPosition);
    }
  }

  /**
   * 处理分组节点之间的拖拽排序
   * 重新排列分组顺序，并计算全局 sort 值提交到后端
   */
  async function handleGroupDrop(dragNode: GroupNode, dropNode: TreeNode, dropPosition: number) {
    if (!dropNode.isGroup) return;

    const groupNames = treeData.value.map((n) => n.title);
    const dragIdx = groupNames.indexOf(dragNode.title);
    const dropIdx = groupNames.indexOf(dropNode.title);
    if (dragIdx === -1 || dropIdx === -1 || dragIdx === dropIdx) return;

    // 计算新的分组顺序
    const reordered = [...groupNames];
    const [moved] = reordered.splice(dragIdx, 1);
    const insertAt = dropPosition < 0 ? dropIdx : dropIdx + 1;
    reordered.splice(Math.max(0, insertAt > dragIdx ? insertAt - 1 : insertAt), 0, moved!);

    // 按新分组顺序构建全局排序值
    const sortItems = buildGlobalSort(reordered);
    // 乐观更新本地数据
    reorderAllDicts(reordered);
    // 异步提交，失败则回滚
    sortDictApi(sortItems).catch(() => loadDicts());
  }

  /**
   * 处理字典节点拖入分组节点
   * 更新字典的 groups 字段，并重新排序目标分组内的字典
   */
  async function handleDictToGroup(dragNode: DictNode, dropNode: GroupNode) {
    const targetGroup = dropNode.title === defaultGroup() ? '' : dropNode.title;
    // 如果已经在目标分组则不做处理
    if ((dragNode.dict.groups || '') === targetGroup) return;

    // 乐观更新本地数据
    allDicts.value = allDicts.value.map((d) =>
      d.id === dragNode.dict.id ? { ...d, groups: targetGroup } : d,
    );

    // 计算目标分组的排序值
    const targetDicts = allDicts.value.filter((d) => (d.groups || '') === targetGroup);
    const sortItems = targetDicts.map((d, i) => ({ id: d.id, sort: (i + 1) * 10 }));

    try {
      // 先更新分组归属，再更新排序
      await updateDictApi({ ...dragNode.dict, groups: targetGroup });
      await sortDictApi(sortItems);
    } catch {
      // 失败时从后端重新加载
      loadDicts();
    }
  }

  /**
   * 处理字典节点之间的拖拽排序
   * 支持同组排序和跨组移动两种场景
   */
  async function handleDictReorder(dragNode: DictNode, dropNode: DictNode, dropPosition: number) {
    const dragGroup = dragNode.dict.groups || defaultGroup();
    const dropGroup = dropNode.dict.groups || defaultGroup();

    if (dragGroup === dropGroup) {
      // ---- 同组排序 ----
      const groupDicts = allDicts.value.filter(
        (d) => (d.groups || defaultGroup()) === dragGroup,
      );
      const dragIdx = groupDicts.findIndex((d) => d.id === dragNode.key);
      const dropIdx = groupDicts.findIndex((d) => d.id === dropNode.key);
      if (dragIdx === -1 || dropIdx === -1) return;

      // 重新排列
      const reordered = [...groupDicts];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(dropPosition <= 0 ? dropIdx : dropIdx > dragIdx ? dropIdx : dropIdx + 1, 0, moved!);

      // 乐观更新
      const otherDicts = allDicts.value.filter(
        (d) => (d.groups || defaultGroup()) !== dragGroup,
      );
      allDicts.value = [...otherDicts, ...reordered];

      // 提交排序
      const sortItems = reordered.map((d, i) => ({ id: d.id, sort: (i + 1) * 10 }));
      sortDictApi(sortItems).catch(() => loadDicts());
    } else {
      // ---- 跨组移动 ----
      const targetGroup = dropNode.dict.groups || '';

      // 取目标分组的字典（排除被拖拽的）
      const targetDicts = allDicts.value.filter(
        (d) => (d.groups || '') === targetGroup && d.id !== dragNode.dict.id,
      );

      // 计算插入位置
      const dropIdx = targetDicts.findIndex((d) => d.id === dropNode.key);
      const insertAt = dropPosition <= 0 ? dropIdx : dropIdx + 1;
      targetDicts.splice(Math.max(0, insertAt), 0, { ...dragNode.dict, groups: targetGroup });

      // 乐观更新本地数据
      allDicts.value = allDicts.value.filter((d) => d.id !== dragNode.dict.id);
      allDicts.value = [
        ...allDicts.value.filter((d) => (d.groups || '') !== targetGroup),
        ...targetDicts,
      ];

      // 计算排序值
      const sortItems = targetDicts.map((d, i) => ({ id: d.id, sort: (i + 1) * 10 }));
      try {
        await updateDictApi({ ...dragNode.dict, groups: targetGroup });
        await sortDictApi(sortItems);
      } catch {
        loadDicts();
      }
    }
  }

  // ===========================
  // 工具方法
  // ===========================

  /**
   * 根据分组顺序，为所有字典生成全局 sort 值
   * 每个字典间隔 10，便于后续插入
   */
  function buildGlobalSort(orderedGroups: string[]): DictApi.SortItem[] {
    const groupMap = new Map<string, DictApi.DictItem[]>();
    for (const d of allDicts.value) {
      const g = d.groups || defaultGroup();
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(d);
    }

    const sortItems: DictApi.SortItem[] = [];
    let globalSort = 10;
    for (const g of orderedGroups) {
      for (const d of groupMap.get(g) ?? []) {
        sortItems.push({ id: d.id, sort: globalSort });
        globalSort += 10;
      }
    }
    return sortItems;
  }

  /**
   * 按分组顺序重排 allDicts 本地数据（乐观更新）
   */
  function reorderAllDicts(orderedGroups: string[]) {
    const groupMap = new Map<string, DictApi.DictItem[]>();
    for (const d of allDicts.value) {
      const g = d.groups || defaultGroup();
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(d);
    }
    const newAll: DictApi.DictItem[] = [];
    for (const g of orderedGroups) {
      newAll.push(...(groupMap.get(g) ?? []));
    }
    allDicts.value = newAll;
  }

  return {
    /** 加载状态 */
    loading,
    /** 所有字典原始数据 */
    allDicts,
    /** 搜索关键字 */
    keyword,
    /** 选中的节点 key 列表 */
    selectedKeys,
    /** 展开的节点 key 列表 */
    expandedKeys,
    /** 当前激活的字典（右侧面板展示用） */
    activeDict,
    /** 树形数据（计算属性） */
    treeData,
    /** 加载字典数据 */
    loadDicts,
    /** 节点选中处理 */
    onSelect,
    /** 拖拽放置处理 */
    onDrop,
  };
}
