import type { Ref } from 'vue';

import type { ConfigApi } from '#/api/admin/sys/config';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { createConfigApi, updateConfigApi } from '#/api/admin/sys/config';
import { $t } from '#/locales';

export const COMPONENT_KEYS = ['Input', 'InputPassword', 'Textarea', 'InputNumber', 'Switch', 'UpImg', 'Edit'] as const;

export type ComponentKey = (typeof COMPONENT_KEYS)[number];

interface UseConfigFormOptions {
  activeGroup: Ref<string>;
  groups: Ref<ConfigApi.GroupItem[]>;
  onSuccess: () => Promise<void>;
  onGroupsChange: () => Promise<void>;
}

/**
 * 新增 / 编辑配置项弹窗逻辑.
 */
export function useConfigForm(options: UseConfigFormOptions) {
  const { activeGroup, groups, onSuccess, onGroupsChange } = options;

  const modalVisible = ref(false);
  const modalMode = ref<'create' | 'edit'>('create');
  const modalLoading = ref(false);
  const editingItem = ref<ConfigApi.ConfigItem | null>(null);

  const formState = ref<ConfigApi.CreateParams>({
    groups: '',
    key: '',
    label: '',
    component: 'Input',
    isEncrypted: false,
    isPublic: true,
    sort: 0,
    remark: '',
  });

  const editingIsSys = computed(() => modalMode.value === 'edit' && !!editingItem.value?.isSys);

  const componentOptions = computed(() =>
    COMPONENT_KEYS.map(key => ({
      label: `${$t(`system.config.components.${key}` as any)} (${key})`,
      value: key,
    })),
  );

  const groupOptions = computed(() =>
    groups.value.map(g => ({
      value: g.groups,
      label: `${g.groups} (${g.groupsLabel})`,
    })),
  );

  function openCreate() {
    modalMode.value = 'create';
    formState.value = {
      groups: activeGroup.value,
      key: '',
      label: '',
      component: 'Input',
      isEncrypted: false,
      isPublic: true,
      sort: 0,
      remark: '',
    };
    editingItem.value = null;
    modalVisible.value = true;
  }

  function openEdit(item: ConfigApi.ConfigItem) {
    modalMode.value = 'edit';
    editingItem.value = item;
    formState.value = {
      groups: item.groups,
      key: item.key,
      label: item.label,
      component: item.component,
      isEncrypted: item.isEncrypted,
      isPublic: item.isPublic,
      sort: item.sort,
      remark: item.remark ?? '',
    };
    modalVisible.value = true;
  }

  async function handleSubmit() {
    modalLoading.value = true;
    try {
      if (modalMode.value === 'create') {
        await createConfigApi(formState.value);
        message.success($t('system.config.createSuccess'));
      } else {
        if (!editingItem.value) return;
        await updateConfigApi({ id: editingItem.value.id, ...formState.value });
        message.success($t('system.config.updateSuccess'));
      }
      modalVisible.value = false;
      await onSuccess();
      await onGroupsChange();
    } finally {
      modalLoading.value = false;
    }
  }

  return {
    modalVisible,
    modalMode,
    modalLoading,
    editingItem,
    formState,
    editingIsSys,
    componentOptions,
    groupOptions,
    openCreate,
    openEdit,
    handleSubmit,
  };
}
