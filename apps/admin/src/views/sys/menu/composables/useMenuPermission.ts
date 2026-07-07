/**
 * useMenuPermission - 菜单权限码生成逻辑
 *
 * 负责：
 * 1. 控制生成标准权限码弹窗
 * 2. 从控制器接口扫描并选择权限码
 * 3. 批量创建按钮权限菜单
 */

import type { ControllerMethodItem, MenuAdminApi } from '#/api/sys/menuAdmin';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { batchCreateMenuApi, getControllerMethodsApi } from '#/api/sys/menuAdmin';

function createPermissionOptions(t: (key: string, params?: Record<string, any>) => string) {
  return [
    { label: t('sys.menu.permission.list'), value: 'list' },
    { label: t('sys.menu.permission.detail'), value: 'detail' },
    { label: t('sys.menu.permission.create'), value: 'create' },
    { label: t('sys.menu.permission.update'), value: 'update' },
    { label: t('sys.menu.permission.delete'), value: 'delete' },
    { label: t('sys.menu.permission.batchDelete'), value: 'batchDelete' },
    { label: t('sys.menu.permission.batchUpdate'), value: 'batchUpdate' },
  ];
}

function buildPermissionSuffix(path: string): string {
  return path
    .split('/')
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

function buildMethodOptions(methods: ControllerMethodItem[]) {
  return methods.map(m => ({
    label: `[${m.method}] ${m.path} - ${m.title}`,
    value: m.path,
  }));
}

export interface UseMenuPermissionOptions {
  reload: () => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
}

export function useMenuPermission(options: UseMenuPermissionOptions) {
  const { reload, t } = options;

  const genVisible = ref(false);
  const genLoading = ref(false);
  const genItem = ref<MenuAdminApi.MenuItem | null>(null);
  const genPrefix = ref('');
  const genSelected = ref<string[]>(['list', 'create', 'update', 'delete']);

  const pickVisible = ref(false);
  const pickLoading = ref(false);
  const pickControllerPrefix = ref('');
  const pickPermissionPrefix = ref('');
  const pickMethods = ref<ControllerMethodItem[]>([]);
  const pickSelected = ref<string>('');

  const permissionOptions = createPermissionOptions(t);

  function openGeneratePermission(item: MenuAdminApi.MenuItem) {
    genItem.value = item;
    genPrefix.value = '';
    genSelected.value = ['list', 'create', 'update', 'delete'];
    genVisible.value = true;
  }

  async function handleGeneratePermission() {
    if (!genItem.value) return;

    const prefix = genPrefix.value.trim();
    if (!prefix) {
      message.warning(t('sys.menu.permission.prefixRequired'));
      return;
    }
    if (genSelected.value.length === 0) {
      message.warning(t('sys.menu.permission.selectRequired'));
      return;
    }

    genLoading.value = true;
    try {
      const items: MenuAdminApi.SaveParams[] = genSelected.value
        .map((code, index) => {
          const option = permissionOptions.find(o => o.value === code);
          const itemId = genItem.value?.id;
          if (!option || !itemId) {
            return null;
          }
          return {
            parentId: itemId,
            type: 3 as MenuAdminApi.MenuType,
            title: option.label,
            permission: `${prefix}${code}`,
            sort: (index + 1) * 10,
            status: 1,
          };
        })
        .filter(Boolean) as MenuAdminApi.SaveParams[];

      const result = await batchCreateMenuApi(items);
      message.open({
        type: 'success',
        content: t('sys.menu.permission.generateSuccess', {
          created: result.created.length,
          skipped: result.skipped.length,
        }),
      });
      genVisible.value = false;
      await reload();
    } finally {
      genLoading.value = false;
    }
  }

  function openPickMethod() {
    pickVisible.value = true;
  }

  function resetPickState() {
    pickControllerPrefix.value = '';
    pickPermissionPrefix.value = '';
    pickMethods.value = [];
    pickSelected.value = '';
  }

  async function handleScanMethods() {
    const prefix = pickControllerPrefix.value.trim();
    if (!prefix) {
      message.warning(t('sys.menu.permission.controllerPrefixRequired'));
      return;
    }
    pickLoading.value = true;
    try {
      pickMethods.value = await getControllerMethodsApi(prefix);
      if (pickMethods.value.length === 0) {
        message.info(t('sys.menu.permission.noMethods'));
      }
    } finally {
      pickLoading.value = false;
    }
  }

  function handlePickMethod(onPicked?: (permission: string, title?: string) => void) {
    const selected = pickMethods.value.find(m => m.path === pickSelected.value);
    if (!selected) return;

    const prefix = pickPermissionPrefix.value.trim();
    const suffix = buildPermissionSuffix(selected.path);
    const permission = prefix ? `${prefix}${suffix}` : suffix;

    onPicked?.(permission, selected.title);
    pickVisible.value = false;
    message.open({ type: 'success', content: t('sys.menu.permission.picked', { permission }) });
  }

  return {
    genVisible,
    genLoading,
    genItem,
    genPrefix,
    genSelected,
    permissionOptions,
    pickVisible,
    pickLoading,
    pickControllerPrefix,
    pickPermissionPrefix,
    pickMethods,
    pickSelected,
    methodOptions: () => buildMethodOptions(pickMethods.value),
    openGeneratePermission,
    handleGeneratePermission,
    openPickMethod,
    resetPickState,
    handleScanMethods,
    handlePickMethod,
  };
}
