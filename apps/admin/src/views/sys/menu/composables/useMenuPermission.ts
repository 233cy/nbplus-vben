/**
 * useMenuPermission - 菜单标准权限码生成逻辑
 *
 * 仅负责多选模式下的「快速生成标准权限」业务：
 * 打开弹窗、接收弹窗提交的方法列表、批量创建按钮子菜单。
 */

import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { batchCreateMenuApi } from '#/api/sys/menuAdmin';

export interface UseMenuPermissionOptions {
  onSuccess?: (item: MenuAdminApi.MenuItem) => void | Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
}

export function useMenuPermission(options: UseMenuPermissionOptions) {
  const { onSuccess, t } = options;

  const genVisible = ref(false);
  const genLoading = ref(false);
  const genItem = ref<MenuAdminApi.MenuItem | null>(null);

  function openGeneratePermission(item: MenuAdminApi.MenuItem) {
    genItem.value = item;
    genVisible.value = true;
  }

  async function handleGeneratePermission(items: MenuAdminApi.SaveParams[]) {
    if (!genItem.value || items.length === 0) return;

    genLoading.value = true;
    try {
      const result = await batchCreateMenuApi(items);
      message.open({
        type: 'success',
        content: t('sys.menu.permission.generateSuccess', {
          created: result.created.length,
          skipped: result.skipped.length,
        }),
      });
      genVisible.value = false;
      await onSuccess?.(genItem.value);
    } finally {
      genLoading.value = false;
    }
  }

  return {
    genVisible,
    genLoading,
    genItem,
    openGeneratePermission,
    handleGeneratePermission,
  };
}
