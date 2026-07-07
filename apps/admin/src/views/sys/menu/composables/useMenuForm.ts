/**
 * useMenuForm - 菜单新增/编辑表单逻辑
 */

import type { DictApi } from '#/api/sys/dict';
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { createMenuApi, getMenuTreeApi, updateMenuApi } from '#/api/sys/menuAdmin';
import { getDictItems, useDict } from '#/utils/dict';

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
    badgeType: 'off',
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

function findNodeById(nodes: MenuAdminApi.MenuItem[], id: string): MenuAdminApi.MenuItem | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findNodeTitle(nodes: MenuAdminApi.MenuItem[], id: string): string {
  return findNodeById(nodes, id)?.title ?? '';
}

function getAllowedTypes(parentId: null | string, treeData: MenuAdminApi.MenuItem[], typeItems: DictApi.DictItemData[]): { label: string; value: number }[] {
  const all = typeItems.map(i => ({ label: i.label, value: Number(i.value) }));
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

export interface UseMenuFormOptions {
  gridApi: any;
  t: (key: string, params?: Record<string, any>) => string;
}

export function useMenuForm(options: UseMenuFormOptions) {
  const { gridApi, t } = options;

  const visible = ref(false);
  const loading = ref(false);
  const isEdit = ref(false);
  const form = ref<MenuAdminApi.SaveParams & { id?: string }>(createDefaultForm());
  const treeData = ref<MenuAdminApi.MenuItem[]>([]);
  const { items: typeItems } = useDict('sys_menu_type');

  const availableTypes = computed(() => {
    const parentId = form.value.parentId;
    const resolvedParentId = parentId === ROOT_PARENT || parentId === undefined ? null : parentId;
    return getAllowedTypes(resolvedParentId, treeData.value, typeItems.value);
  });

  const title = computed(() => {
    if (isEdit.value) return t('sys.menu.edit');
    const parentId = form.value.parentId;
    const isRoot = !parentId || parentId === ROOT_PARENT;
    const parentTitle = isRoot ? '' : findNodeTitle(treeData.value, parentId);
    const actionKey = isRoot ? 'sys.menu.addRoot' : 'sys.menu.addChild';
    return `${t(actionKey)}${parentTitle ? `「${parentTitle}」` : ''}`;
  });

  async function loadTreeData() {
    try {
      treeData.value = await getMenuTreeApi();
    } catch {
      treeData.value = [];
    }
  }

  async function openCreate(parentId: null | string = null) {
    await loadTreeData();
    // 确保字典项已加载，避免 allowedTypes 为空导致默认类型错误
    await getDictItems('sys_menu_type');
    isEdit.value = false;
    const allowed = getAllowedTypes(parentId, treeData.value, typeItems.value);
    const defaultType = allowed[0]?.value ?? 1;
    form.value = { ...createDefaultForm(), parentId: parentId ?? ROOT_PARENT, type: defaultType };
    visible.value = true;
  }

  async function openEdit(item: MenuAdminApi.MenuItem) {
    await loadTreeData();
    isEdit.value = true;
    form.value = {
      ...item,
      parentId: item.parentId ?? ROOT_PARENT,
      badgeType: item.badgeType || 'off',
      badgeVariants: item.badgeVariants || '',
    };
    visible.value = true;
  }

  function validate(): boolean {
    if (!form.value.title?.trim()) {
      message.warning(t('sys.menu.validate.titleRequired'));
      return false;
    }
    if (form.value.type !== 3 && !form.value.name?.trim()) {
      message.warning(t('sys.menu.validate.nameRequired'));
      return false;
    }
    if ([1, 2, 4, 5].includes(form.value.type) && !form.value.path?.trim()) {
      message.warning(t('sys.menu.validate.pathRequired'));
      return false;
    }
    if (form.value.type === 2 && !form.value.component?.trim()) {
      message.warning(t('sys.menu.validate.componentRequired'));
      return false;
    }
    if ([4, 5].includes(form.value.type) && !form.value.linkSrc?.trim()) {
      message.warning(t('sys.menu.validate.linkRequired'));
      return false;
    }
    if (form.value.type === 3 && !form.value.permission?.trim()) {
      message.warning(t('sys.menu.validate.permissionRequired'));
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;

    loading.value = true;
    try {
      const submitData = {
        ...form.value,
        parentId: form.value.parentId === ROOT_PARENT ? null : form.value.parentId,
      };
      if (isEdit.value && submitData.id) {
        await updateMenuApi(submitData as MenuAdminApi.SaveParams & { id: string });
        message.success(t('sys.menu.updateSuccess'));
      } else {
        await createMenuApi(submitData);
        message.success(t('sys.menu.createSuccess'));
      }
      await gridApi.query();
      visible.value = false;
    } finally {
      loading.value = false;
    }
  }

  return {
    visible,
    loading,
    isEdit,
    form,
    title,
    availableTypes,
    openCreate,
    openEdit,
    handleSubmit,
  };
}
