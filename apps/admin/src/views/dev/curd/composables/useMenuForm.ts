import type { CurdAdminApi } from '#/api/dev/curdAdmin';
import type { MenuAdminApi } from '#/api/dev/menuAdmin';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { createCurdMenuApi } from '#/api/dev/curdAdmin';
import { getMenuListApi } from '#/api/dev/menuAdmin';
import { $t } from '#/locales';

import { buildMenuPath, createDefaultMenuForm } from '../data';

/** 递归平铺菜单树（只保留目录节点 type===1） */
function flattenDirTree(nodes: MenuAdminApi.MenuItem[]): MenuAdminApi.MenuItem[] {
  const result: MenuAdminApi.MenuItem[] = [];
  for (const node of nodes) {
    if (node.type === 1) {
      result.push(node);
      if (node.children?.length) {
        result.push(...flattenDirTree(node.children));
      }
    }
  }
  return result;
}

/** 递归过滤只保留目录节点的树 */
function filterDirTree(nodes: MenuAdminApi.MenuItem[]): MenuAdminApi.MenuItem[] {
  const result: MenuAdminApi.MenuItem[] = [];
  for (const node of nodes) {
    if (node.type !== 1) continue;
    const children = filterDirTree(node.children ?? []);
    result.push({ ...node, children });
  }
  return result;
}

/**
 * useMenuForm - 生成菜单弹窗逻辑
 *
 * 负责：
 * 1. 控制菜单生成弹窗状态
 * 2. 加载菜单树并构建父节点选择数据
 * 3. 根据父节点自动推导菜单路径
 * 4. 提交生成菜单
 */
export function useMenuForm() {
  const visible = ref(false);
  const loading = ref(false);
  const currentRow = ref<CurdAdminApi.CurdTable | null>(null);
  const form = ref(createDefaultMenuForm());
  const menuTreeData = ref<any[]>([]);
  const menuTreeFlat = ref<MenuAdminApi.MenuItem[]>([]);

  function findNode(id: null | string): MenuAdminApi.MenuItem | null {
    if (!id || id === '__root__') return null;
    return menuTreeFlat.value.find(n => n.id === id) ?? null;
  }

  function getFullPath(id: null | string): string {
    if (!id || id === '__root__') return '';
    const node = findNode(id);
    if (!node) return '';
    const selfPath = node.path ?? '';
    if (selfPath.startsWith('/')) return selfPath;
    const parentFull = getFullPath(node.parentId ?? null);
    return parentFull ? `${parentFull}/${selfPath}` : `/${selfPath}`;
  }

  const parentNodePath = computed(() => getFullPath(form.value.menuParentId));

  const menuPathPreview = computed(() => {
    const path = form.value.menuPath;
    if (!path) return '';
    if (path.startsWith('/')) return path;
    const parentFull = getFullPath(form.value.menuParentId);
    return parentFull ? `${parentFull}/${path}` : `/${path}`;
  });

  function onParentChange(parentId: null | string) {
    const row = currentRow.value;
    if (!row) return;
    form.value.menuPath = buildMenuPath(row.module, row.className, !parentId || parentId === '__root__');
  }

  async function open(row: CurdAdminApi.CurdTable) {
    currentRow.value = row;
    form.value = {
      id: row.id,
      menuParentId: null,
      menuPath: buildMenuPath(row.module, row.className),
      menuIcon: 'lucide:table-2',
      menuSort: 0,
    };
    const tree = await getMenuListApi();
    menuTreeFlat.value = flattenDirTree(tree);
    menuTreeData.value = [{ id: '__root__', title: $t('dev.curd.menu.root'), path: '', type: 1, children: filterDirTree(tree) }];
    visible.value = true;
  }

  async function handleSubmit() {
    if (!currentRow.value) return;
    loading.value = true;
    try {
      await createCurdMenuApi({
        ...form.value,
        menuParentId: form.value.menuParentId === '__root__' ? null : form.value.menuParentId,
      });
      message.success($t('dev.curd.menu.createSuccess'));
      visible.value = false;
    } finally {
      loading.value = false;
    }
  }

  return {
    visible,
    loading,
    currentRow,
    form,
    menuTreeData,
    parentNodePath,
    menuPathPreview,
    open,
    onParentChange,
    handleSubmit,
  };
}
