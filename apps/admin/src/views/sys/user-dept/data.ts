import type { DeptApi } from '#/api/sys/userDept';

export interface DeptTreeNode extends DeptApi.DeptItem {
  key: string;
  title: string;
  children?: DeptTreeNode[];
}

/** 移动节点时的虚拟根节点值 */
export const ROOT_PARENT = '__root__';

/** 状态选项 */
export function createStatusOptions(t: (key: string) => string) {
  return [
    { label: t('common.enabled'), value: 1 },
    { label: t('common.disabled'), value: 2 },
  ];
}

/** 默认空表单 */
export function createDefaultForm(): DeptApi.SaveParams {
  return {
    parentId: undefined,
    name: '',
    code: '',
    leaderId: '',
    phone: '',
    email: '',
    status: 1,
  };
}

/**
 * 构建 TreeSelect 可用的父节点树数据
 *
 * @param nodes 平级部门列表（后端 /tree 接口返回的 items）
 * @param excludeId 需要排除的节点 ID（通常用于编辑时排除自身及其子树）
 */
export function buildParentTreeData(nodes: DeptApi.DeptItem[], excludeId?: string): { children: any[]; label: string; value: string }[] {
  // 1. 过滤掉 excludeId 及其所有后代
  let validNodes = nodes;
  if (excludeId) {
    const excludeSet = new Set<string>();
    const collectDescendants = (parentId: string) => {
      for (const node of nodes) {
        if (node.parentId === parentId && !excludeSet.has(node.id)) {
          excludeSet.add(node.id);
          collectDescendants(node.id);
        }
      }
    };
    excludeSet.add(excludeId);
    collectDescendants(excludeId);
    validNodes = nodes.filter(node => !excludeSet.has(node.id));
  }

  // 2. 按 parentId 分组
  const childrenMap = new Map<string | null, DeptApi.DeptItem[]>();
  for (const node of validNodes) {
    const key = node.parentId ?? null;
    if (!childrenMap.has(key)) {
      childrenMap.set(key, []);
    }
    childrenMap.get(key)!.push(node);
  }

  // 3. 递归构建树，按 sort 降序排列（与后端默认排序一致）
  const build = (parentId: string | null): { children: any[]; label: string; value: string }[] => {
    const children = childrenMap.get(parentId) ?? [];
    children.sort((a, b) => (b.sort ?? 0) - (a.sort ?? 0));
    return children.map(node => ({
      label: `${node.name}${node.code ? `（${node.code}）` : ''}`,
      value: node.id,
      children: build(node.id),
    }));
  };

  return build(null);
}

/**
 * 查找树中某个 value 对应节点的路径 key（包含自身）
 */
export function findTreePathKeys(nodes: { children: any[]; label: string; value: string }[], targetValue: string): string[] {
  for (const node of nodes) {
    if (node.value === targetValue) {
      return [node.value];
    }
    if (node.children?.length) {
      const found = findTreePathKeys(node.children, targetValue);
      if (found.length > 0) {
        return [node.value, ...found];
      }
    }
  }
  return [];
}
