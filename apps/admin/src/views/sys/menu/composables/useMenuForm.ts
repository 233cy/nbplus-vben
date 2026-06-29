/**
 * useMenuForm - 菜单新增/编辑表单逻辑
 *
 * 负责：
 * 1. 控制新增/编辑弹窗状态
 * 2. 根据父节点自动计算默认可用类型
 * 3. 表单校验与提交
 * 4. 提交成功后刷新菜单树
 */

import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { createMenuApi, updateMenuApi } from '#/api/sys/menuAdmin';
import { $t } from '#/locales';

import { createDefaultForm, findNodeTitle, getAllowedTypes } from '../data';

export interface UseMenuFormOptions {
  treeData: { value: MenuAdminApi.MenuItem[] };
  reload: () => Promise<void>;
  t: (key: string) => string;
}

export function useMenuForm(options: UseMenuFormOptions) {
  const { treeData, reload, t } = options;

  const visible = ref(false);
  const loading = ref(false);
  const isEdit = ref(false);
  const form = ref<MenuAdminApi.SaveParams & { id?: string }>(createDefaultForm());

  const availableTypes = computed(() => getAllowedTypes(form.value.parentId ?? null, treeData.value, t));

  const title = computed(() => {
    if (isEdit.value) return t('dev.menu.edit');
    const parentId = form.value.parentId;
    const parentTitle = parentId ? findNodeTitle(treeData.value, parentId) : '';
    const actionKey = parentId ? 'dev.menu.addChild' : 'dev.menu.addRoot';
    return `${t(actionKey)}${parentTitle ? `「${parentTitle}」` : ''}`;
  });

  function openCreate(parentId: null | string = null) {
    isEdit.value = false;
    const allowed = getAllowedTypes(parentId, treeData.value, t);
    const defaultType = allowed[0]?.value ?? 1;
    form.value = { ...createDefaultForm(), parentId, type: defaultType };
    visible.value = true;
  }

  function openEdit(item: MenuAdminApi.MenuItem) {
    isEdit.value = true;
    form.value = { ...item };
    visible.value = true;
  }

  function validate(): boolean {
    if (!form.value.title?.trim()) {
      message.warning(t('dev.menu.validate.titleRequired'));
      return false;
    }
    if (form.value.type !== 3 && !form.value.name?.trim()) {
      message.warning(t('dev.menu.validate.nameRequired'));
      return false;
    }
    if ([1, 2, 4, 5].includes(form.value.type) && !form.value.path?.trim()) {
      message.warning(t('dev.menu.validate.pathRequired'));
      return false;
    }
    if (form.value.type === 2 && !form.value.component?.trim()) {
      message.warning(t('dev.menu.validate.componentRequired'));
      return false;
    }
    if ([4, 5].includes(form.value.type) && !form.value.linkSrc?.trim()) {
      message.warning(t('dev.menu.validate.linkRequired'));
      return false;
    }
    if (form.value.type === 3 && !form.value.permission?.trim()) {
      message.warning(t('dev.menu.validate.permissionRequired'));
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;

    loading.value = true;
    try {
      if (isEdit.value && form.value.id) {
        await updateMenuApi(form.value as MenuAdminApi.SaveParams & { id: string });
        message.success(t('dev.menu.updateSuccess'));
      } else {
        await createMenuApi(form.value);
        message.success(t('dev.menu.createSuccess'));
      }
      await reload();
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
