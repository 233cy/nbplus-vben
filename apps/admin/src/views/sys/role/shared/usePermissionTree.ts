import type { Ref } from 'vue';

import { computed, ref, toValue, watch } from 'vue';

export interface PermissionNode {
  id: string;
  parentId?: null | string;
  type: number;
  title: string;
  subtitle?: string;
  status?: number;
  name?: string;
  path?: string;
  permission?: string;
  sort?: number;
  checked?: boolean;
  children?: PermissionNode[];
}

export type CheckState = 0 | 1 | 2;

export type MaybeRefOrGetter<T> = (() => T) | Ref<T> | T;

export interface UsePermissionTreeOptions {
  /** 初始树数据 */
  treeData: MaybeRefOrGetter<PermissionNode[]>;
  /** 初始已选 ID */
  checkedKeys?: MaybeRefOrGetter<string[]>;
  /** 是否只读（权限包模式下禁用直接勾选） */
  readonly?: MaybeRefOrGetter<boolean>;
}

export function usePermissionTree(options: UsePermissionTreeOptions) {
  const rawTree = ref<PermissionNode[]>(toValue(options.treeData));
  const checkedKeys = ref<Set<string>>(new Set(toValue(options.checkedKeys)));
  const expandedKeys = ref<Set<string>>(new Set<string>());
  const searchTerm = ref('');

  watch(
    () => toValue(options.treeData),
    val => {
      rawTree.value = sortNodes(val ?? []);
    },
    { immediate: true },
  );

  function setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  watch(
    () => toValue(options.checkedKeys),
    val => {
      const next = new Set(val);
      if (setsEqual(checkedKeys.value, next)) return;
      checkedKeys.value = next;
    },
    { immediate: true },
  );

  /** 节点映射表 */
  const nodeMap = computed(() => {
    const map = new Map<string, PermissionNode>();
    function walk(nodes: PermissionNode[]) {
      for (const node of nodes) {
        map.set(node.id, node);
        if (node.children?.length) walk(node.children);
      }
    }
    walk(rawTree.value);
    return map;
  });

  /** 父节点映射表 */
  const parentMap = computed(() => {
    const map = new Map<string, PermissionNode>();
    function walk(nodes: PermissionNode[], parent?: PermissionNode) {
      for (const node of nodes) {
        if (parent) map.set(node.id, parent);
        if (node.children?.length) walk(node.children, node);
      }
    }
    walk(rawTree.value);
    return map;
  });

  /** 获取所有后代 ID（不含自身） */
  function getDescendantIds(node: PermissionNode): string[] {
    const result: string[] = [];
    function walk(n: PermissionNode) {
      if (!n.children?.length) return;
      for (const child of n.children) {
        result.push(child.id);
        walk(child);
      }
    }
    walk(node);
    return result;
  }

  /** 获取所有节点 ID */
  function getAllIds(nodes: PermissionNode[] = rawTree.value): string[] {
    const result: string[] = [];
    function walk(list: PermissionNode[]) {
      for (const node of list) {
        result.push(node.id);
        if (node.children?.length) walk(node.children);
      }
    }
    walk(nodes);
    return result;
  }

  /** 判断节点是否被禁用（自身或任意祖先被禁用） */
  function isDisabled(node: PermissionNode): boolean {
    if (node.status === 2) return true;
    let current = parentMap.value.get(node.id);
    while (current) {
      if (current.status === 2) return true;
      current = parentMap.value.get(current.id);
    }
    return false;
  }

  /** 对节点排序：启用在前，禁用在后，同状态按 sort 升序 */
  function sortNodes(nodes: PermissionNode[]): PermissionNode[] {
    return nodes
      .toSorted((a, b) => {
        const statusA = a.status ?? 1;
        const statusB = b.status ?? 1;
        if (statusA !== statusB) return statusA - statusB;
        return (a.sort ?? 0) - (b.sort ?? 0);
      })
      .map(node => ({
        ...node,
        children: node.children?.length ? sortNodes(node.children) : [],
      }));
  }

  /** 向上重新计算父节点选中状态 */
  function recomputeAncestors(nodeId: string) {
    let current = parentMap.value.get(nodeId);
    while (current) {
      const children = current.children ?? [];
      const allChecked = children.every(child => checkedKeys.value.has(child.id));
      const someChecked = children.some(child => checkedKeys.value.has(child.id) || getNodeCheckState(child) === 1);

      if (allChecked) {
        checkedKeys.value.add(current.id);
      } else if (someChecked) {
        checkedKeys.value.delete(current.id);
      } else {
        checkedKeys.value.delete(current.id);
      }
      current = parentMap.value.get(current.id);
    }
  }

  /** 切换节点选中状态 */
  function toggleCheck(node: PermissionNode, checked: boolean) {
    if (toValue(options.readonly) || isDisabled(node)) return;

    const targetIds = [node.id, ...getDescendantIds(node)];

    if (checked) {
      for (const id of targetIds) checkedKeys.value.add(id);
      recomputeAncestors(node.id);
    } else {
      for (const id of targetIds) checkedKeys.value.delete(id);
      // 向上级联：移除无子选中的祖先
      let current = parentMap.value.get(node.id);
      while (current) {
        const children = current.children ?? [];
        const hasCheckedChild = children.some(child => checkedKeys.value.has(child.id) || getNodeCheckState(child) === 1);
        if (!hasCheckedChild) {
          checkedKeys.value.delete(current.id);
        }
        current = parentMap.value.get(current.id);
      }
    }
  }

  /** 获取节点选中状态：0=未选 1=半选 2=全选 */
  function getNodeCheckState(node: PermissionNode): CheckState {
    const descendants = getDescendantIds(node);

    if (checkedKeys.value.has(node.id)) {
      if (descendants.length === 0) return 2;
      return descendants.every(id => checkedKeys.value.has(id)) ? 2 : 1;
    }

    if (descendants.length === 0) return 0;

    const allChecked = descendants.every(id => checkedKeys.value.has(id));
    if (allChecked) return 2;

    const hasAny = descendants.some(id => {
      const childNode = nodeMap.value.get(id);
      return checkedKeys.value.has(id) || (childNode && getNodeCheckState(childNode) === 1);
    });
    return hasAny ? 1 : 0;
  }

  /** 展开全部 */
  function expandAll() {
    expandedKeys.value = new Set(getAllIds());
  }

  /** 折叠全部 */
  function collapseAll() {
    expandedKeys.value = new Set();
  }

  /** 全选 */
  function checkAll() {
    if (toValue(options.readonly)) return;
    function walk(nodes: PermissionNode[]) {
      for (const node of nodes) {
        if (!isDisabled(node)) checkedKeys.value.add(node.id);
        if (node.children?.length) walk(node.children);
      }
    }
    walk(rawTree.value);
  }

  /** 清空 */
  function uncheckAll() {
    if (toValue(options.readonly)) return;
    checkedKeys.value = new Set();
  }

  /** 按类型全选 */
  function checkByType(type: number) {
    if (toValue(options.readonly)) return;
    function walk(nodes: PermissionNode[]) {
      for (const node of nodes) {
        if (node.type === type && !isDisabled(node)) checkedKeys.value.add(node.id);
        if (node.children?.length) walk(node.children);
      }
    }
    walk(rawTree.value);
  }

  /** 批量勾选指定 ID（触发级联） */
  function checkByIds(ids: string[]) {
    if (toValue(options.readonly)) return;
    for (const id of ids) {
      const node = nodeMap.value.get(id);
      if (node && !isDisabled(node)) toggleCheck(node, true);
      else if (!node) checkedKeys.value.add(id);
    }
  }

  /** 批量取消勾选指定 ID（触发级联） */
  function uncheckByIds(ids: string[]) {
    if (toValue(options.readonly)) return;
    for (const id of ids) {
      const node = nodeMap.value.get(id);
      if (node) toggleCheck(node, false);
      else checkedKeys.value.delete(id);
    }
  }

  /** 过滤树 */
  const filteredTree = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();
    if (!term) return rawTree.value;

    function filter(nodes: PermissionNode[]): PermissionNode[] {
      const result: PermissionNode[] = [];
      for (const node of nodes) {
        const match = node.title.toLowerCase().includes(term) || (node.permission?.toLowerCase().includes(term) ?? false);
        const children = node.children?.length ? filter(node.children) : undefined;
        if (match || (children?.length ?? 0) > 0) {
          result.push({ ...node, children });
        }
      }
      return result;
    }

    return filter(rawTree.value);
  });

  /** 搜索时自动展开所有目录，方便查看命中结果 */
  watch(
    searchTerm,
    term => {
      if (!term.trim()) return;
      const keys = new Set(expandedKeys.value);

      function walk(nodes: PermissionNode[]) {
        for (const node of nodes) {
          if (node.type === 1) keys.add(node.id);
          if (node.children?.length) walk(node.children);
        }
      }

      walk(rawTree.value);
      expandedKeys.value = keys;
    },
    { flush: 'post' },
  );

  /** 选中数量 */
  const checkedCount = computed(() => checkedKeys.value.size);
  const totalCount = computed(() => getAllIds().length);

  /** 输出当前选中的 ID 数组 */
  const currentCheckedKeys = computed(() => [...checkedKeys.value]);

  return {
    checkedKeys,
    currentCheckedKeys,
    expandedKeys,
    searchTerm,
    filteredTree,
    checkedCount,
    totalCount,
    toggleCheck,
    getNodeCheckState,
    isDisabled,
    expandAll,
    collapseAll,
    checkAll,
    uncheckAll,
    checkByType,
    checkByIds,
    uncheckByIds,
    getAllIds,
  };
}
