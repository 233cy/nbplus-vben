import type { DeptApi } from '#/api/admin/sys/dept';

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
 * 将后端返回的部门树转换为 ant-design-vue Tree 所需节点格式
 */
export function buildTreeNodes(depts: DeptApi.DeptItem[]): DeptTreeNode[] {
  return depts.map(d => ({
    ...d,
    key: d.id,
    title: d.name,
    children: d.children ? buildTreeNodes(d.children) : undefined,
  }));
}

/**
 * 将部门树平铺为列表
 */
export function flattenDepts(depts: DeptApi.DeptItem[]): DeptApi.DeptItem[] {
  const result: DeptApi.DeptItem[] = [];
  for (const d of depts) {
    result.push(d);
    if (d.children?.length) {
      result.push(...flattenDepts(d.children));
    }
  }
  return result;
}

/**
 * 根据关键字过滤部门树
 */
export function filterDeptTree(depts: DeptApi.DeptItem[], keyword: string): DeptApi.DeptItem[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return depts;

  return depts
    .map(d => {
      const children = d.children?.length ? filterDeptTree(d.children, kw) : [];
      const matchSelf = d.name.toLowerCase().includes(kw) || (d.code ?? '').toLowerCase().includes(kw);
      if (matchSelf) {
        return { ...d, children: children.length > 0 ? children : d.children };
      }
      if (children.length > 0) {
        return { ...d, children };
      }
      return null;
    })
    .filter(Boolean) as DeptApi.DeptItem[];
}

/**
 * 在树中按 ID 查找节点
 */
export function findDeptNode(depts: DeptTreeNode[], id: string): DeptTreeNode | null {
  for (const d of depts) {
    if (d.id === id) return d;
    if (d.children?.length) {
      const found = findDeptNode(d.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 在树中按 ID 查找节点标题
 */
export function findDeptTitle(nodes: DeptApi.DeptItem[], id: string): string {
  const node = findNodeById(nodes, id);
  return node?.name ?? '';
}

function findNodeById(nodes: DeptApi.DeptItem[], id: string): DeptApi.DeptItem | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 查找指定节点的父节点 ID
 */
export function findParentId(nodes: DeptApi.DeptItem[], targetId: string, parentId: null | string = null): null | string {
  for (const node of nodes) {
    if (node.id === targetId) return parentId;
    if (node.children?.length) {
      const found = findParentId(node.children, targetId, node.id);
      if (found !== null) return found;
    }
  }
  return null;
}

/**
 * 收集树中所有节点 ID
 */
export function collectAllKeys(nodes: DeptApi.DeptItem[]): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    keys.push(node.id);
    if (node.children?.length) keys.push(...collectAllKeys(node.children));
  }
  return keys;
}

/**
 * 构建 TreeSelect 可用的父节点树数据
 */
export function buildParentTreeData(nodes: DeptApi.DeptItem[], excludeId?: string): { children: any[]; label: string; value: string }[] {
  const result: { children: any[]; label: string; value: string }[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    result.push({
      label: `${node.name}${node.code ? `（${node.code}）` : ''}`,
      value: node.id,
      children: node.children?.length ? buildParentTreeData(node.children, excludeId) : [],
    });
  }
  return result;
}

/**
 * 根据当前树结构生成全局排序项
 */
export function buildGlobalSortItems(nodes: DeptApi.DeptItem[]): { id: string; sort: number }[] {
  const items: { id: string; sort: number }[] = [];
  const walk = (list: DeptApi.DeptItem[]) => {
    list.forEach((node, index) => {
      items.push({ id: node.id, sort: (index + 1) * 10 });
      if (node.children?.length) walk(node.children);
    });
  };
  walk(nodes);
  return items;
}
