/**
 * 菜单管理模块共享常量、类型与工具函数
 *
 * 职责：集中管理菜单类型、状态、徽标、权限码等常量，以及树的查找/遍历工具函数。
 * 避免这些逻辑散落在页面和 composables 中。
 */

import type { ControllerMethodItem, MenuAdminApi } from '#/api/dev/menuAdmin';

/** 菜单类型选项 */
export const TYPE_OPTIONS: { label: string; value: MenuAdminApi.MenuType }[] = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 },
  { label: '内嵌', value: 4 },
  { label: '外链', value: 5 },
];

/** 菜单状态选项 */
export function createStatusOptions(t: (key: string) => string) {
  return [
    { label: t('dev.menu.status.enabled'), value: 1 },
    { label: t('dev.menu.status.disabled'), value: 2 },
  ];
}

/** 徽标类型选项 */
export function createBadgeTypeOptions(t: (key: string) => string) {
  return [
    { label: t('dev.menu.badgeType.none'), value: '' },
    { label: t('dev.menu.badgeType.dot'), value: 'dot' },
    { label: t('dev.menu.badgeType.normal'), value: 'normal' },
  ];
}

/** 徽标样式变体选项 */
export function createBadgeVariantOptions(t: (key: string) => string) {
  return [
    { label: t('dev.menu.badgeVariant.default'), value: 'default' },
    { label: t('dev.menu.badgeVariant.primary'), value: 'primary' },
    { label: t('dev.menu.badgeVariant.success'), value: 'success' },
    { label: t('dev.menu.badgeVariant.warning'), value: 'warning' },
    { label: t('dev.menu.badgeVariant.destructive'), value: 'destructive' },
  ];
}

/** 标准权限码选项 */
export function createPermissionOptions(t: (key: string) => string) {
  return [
    { label: t('dev.menu.permission.list'), value: 'list' },
    { label: t('dev.menu.permission.detail'), value: 'detail' },
    { label: t('dev.menu.permission.create'), value: 'create' },
    { label: t('dev.menu.permission.update'), value: 'update' },
    { label: t('dev.menu.permission.delete'), value: 'delete' },
    { label: t('dev.menu.permission.batchDelete'), value: 'batchDelete' },
    { label: t('dev.menu.permission.batchUpdate'), value: 'batchUpdate' },
  ];
}

/** 移动节点时的虚拟根节点值 */
export const ROOT_PARENT = '__root__';

/** 默认空表单 */
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

/** 根据菜单类型返回标签颜色与文本 */
export function getTypeTag(type: number, t: (key: string) => string): { color: string; text: string } {
  const map: Record<number, { color: string; textKey: string }> = {
    1: { color: 'blue', textKey: 'dev.menu.type.dir' },
    2: { color: 'green', textKey: 'dev.menu.type.menu' },
    3: { color: 'orange', textKey: 'dev.menu.type.button' },
    4: { color: 'purple', textKey: 'dev.menu.type.embedded' },
    5: { color: 'cyan', textKey: 'dev.menu.type.external' },
  };
  const item = map[type] ?? { color: 'default', textKey: 'common.unknown' };
  return { color: item.color, text: t(item.textKey) };
}

/** 根据父节点类型返回可选的子类型 */
export function getAllowedTypes(parentId: null | string, treeData: MenuAdminApi.MenuItem[], t: (key: string) => string): { label: string; value: MenuAdminApi.MenuType }[] {
  if (!parentId) {
    return [{ label: t('dev.menu.type.dir'), value: 1 }];
  }
  const parent = findNodeById(treeData, parentId);
  if (!parent) return TYPE_OPTIONS;

  switch (parent.type) {
    case 1: {
      return [
        { label: t('dev.menu.type.dir'), value: 1 },
        { label: t('dev.menu.type.menu'), value: 2 },
        { label: t('dev.menu.type.embedded'), value: 4 },
        { label: t('dev.menu.type.external'), value: 5 },
      ];
    }
    case 2:
    case 4:
    case 5: {
      return [{ label: t('dev.menu.type.button'), value: 3 }];
    }
    default: {
      return TYPE_OPTIONS;
    }
  }
}

/** 在树中按 ID 查找节点 */
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

/** 在树中按 ID 查找节点标题 */
export function findNodeTitle(nodes: MenuAdminApi.MenuItem[], id: string): string {
  const node = findNodeById(nodes, id);
  return node?.title ?? '';
}

/** 查找指定节点的父节点 ID */
export function findParentId(nodes: MenuAdminApi.MenuItem[], targetId: string, parentId: null | string = null): null | string {
  for (const node of nodes) {
    if (node.id === targetId) return parentId;
    if (node.children?.length) {
      const found = findParentId(node.children, targetId, node.id);
      if (found !== null) return found;
    }
  }
  return null;
}

/** 收集树中所有节点 ID */
export function collectAllKeys(nodes: MenuAdminApi.MenuItem[]): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    keys.push(node.id);
    if (node.children?.length) keys.push(...collectAllKeys(node.children));
  }
  return keys;
}

/** 构建 TreeSelect 可用的父节点树数据 */
export function buildParentTreeData(nodes: MenuAdminApi.MenuItem[], excludeId?: string): { children: any[]; label: string; value: string }[] {
  const result: { children: any[]; label: string; value: string }[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    result.push({
      label: node.title,
      value: node.id,
      children: node.children?.length ? buildParentTreeData(node.children, excludeId) : [],
    });
  }
  return result;
}

/** 根据当前树结构生成全局排序项 */
export function buildGlobalSortItems(nodes: MenuAdminApi.MenuItem[]): { id: string; sort: number }[] {
  const items: { id: string; sort: number }[] = [];
  const walk = (list: MenuAdminApi.MenuItem[]) => {
    list.forEach((node, index) => {
      items.push({ id: node.id, sort: (index + 1) * 10 });
      if (node.children?.length) walk(node.children);
    });
  };
  walk(nodes);
  return items;
}

/** 将接口 path 转换为权限码后缀（如 item/sort => itemSort） */
export function buildPermissionSuffix(path: string): string {
  return path
    .split('/')
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

/** 从接口列表中构建 Select 选项 */
export function buildMethodOptions(methods: ControllerMethodItem[]) {
  return methods.map(m => ({
    label: `[${m.method}] ${m.path} - ${m.title}`,
    value: m.path,
  }));
}
