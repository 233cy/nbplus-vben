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
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
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
