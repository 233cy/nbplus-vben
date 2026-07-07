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
