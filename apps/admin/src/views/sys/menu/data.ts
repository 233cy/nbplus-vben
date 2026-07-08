import type { DictApi } from '#/api/sys/dict';
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

export const ROOT_PARENT = '__root__';

export function createDefaultForm(): MenuAdminApi.SaveParams & { id?: string } {
  return {
    parentId: null,
    type: 1,
    title: '',
    name: '',
    path: '',
    activePath: '',
    linkSrc: '',
    component: '',
    icon: '',
    activeIcon: '',
    permission: '',
    sort: 0,
    badge: '',
    badgeType: '',
    badgeVariants: '',
    isHidden: false,
    isHideChildren: false,
    isHideBreadcrumb: false,
    isHideTab: false,
    isKeepAlive: false,
    isAffixTab: false,
    status: 1,
  };
}

export function findNodeById(nodes: MenuAdminApi.MenuItem[], id: string): MenuAdminApi.MenuItem | null {
  for (const node of nodes) {
    if (node.id === id) return node;
  }
  return null;
}

export function findNodeTitle(nodes: MenuAdminApi.MenuItem[], id: string): string {
  return findNodeById(nodes, id)?.title ?? '';
}

export function getAllowedTypes(parentId: null | string, treeData: MenuAdminApi.MenuItem[], typeItems: DictApi.DictItemData[]): { label: string; value: MenuAdminApi.MenuType }[] {
  const all = typeItems.map(i => ({ label: i.label, value: Number(i.value) as MenuAdminApi.MenuType }));
  if (!parentId || parentId === ROOT_PARENT) {
    return all.filter(i => i.value === 1);
  }
  const parent = findNodeById(treeData, parentId);
  if (!parent) return all;

  switch (parent.type) {
    case 1: {
      return all.filter(i => [1, 2, 4, 5].includes(i.value));
    }
    case 2:
    case 4:
    case 5: {
      return all.filter(i => i.value === 3);
    }
    default: {
      return all;
    }
  }
}

/**
 * 从平级菜单列表构建 TreeSelect 可用的父节点树数据
 *
 * @param nodes 平级菜单列表（后端 /tree 接口返回的 items）
 * @param excludeId 需要排除的节点 ID（通常用于编辑时排除自身及其子树）
 */
export function buildParentTreeData(
  nodes: MenuAdminApi.MenuItem[],
  excludeId?: string,
): { children: any[]; label: string; value: string }[] {
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

  // 2. 按钮节点不能作为父级菜单
  validNodes = validNodes.filter(node => node.type !== 3);

  // 3. 按 parentId 分组
  const childrenMap = new Map<null | string, MenuAdminApi.MenuItem[]>();
  for (const node of validNodes) {
    const key = node.parentId ?? null;
    if (!childrenMap.has(key)) {
      childrenMap.set(key, []);
    }
    childrenMap.get(key)!.push(node);
  }

  // 4. 递归构建树，按 sort 升序排列（与后端默认排序一致）
  const build = (parentId: null | string): { children: any[]; label: string; value: string }[] => {
    const children = childrenMap.get(parentId) ?? [];
    children.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    return children.map(node => ({
      label: node.title,
      value: node.id,
      children: build(node.id),
    }));
  };

  return build(null);
}
