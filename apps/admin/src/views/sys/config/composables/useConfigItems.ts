import type { Ref } from 'vue';

import type { ConfigApi } from '#/api/sys/config';

import { ref, watch } from 'vue';

import { message } from 'ant-design-vue';

import { deleteConfigApi, getConfigListApi, saveConfigApi, updateConfigApi } from '#/api/sys/config';
import { $t } from '#/locales';

/**
 * 配置项列表、编辑态值、批量保存与单个操作.
 */
export function useConfigItems(activeGroup: Ref<string>) {
  const configItems = ref<ConfigApi.ConfigItem[]>([]);
  const editValues = ref<Record<string, string>>({});
  const loading = ref(false);
  const saving = ref(false);

  async function loadConfig() {
    if (!activeGroup.value) return;

    loading.value = true;
    try {
      configItems.value = await getConfigListApi(activeGroup.value);
      const vals: Record<string, string> = {};
      for (const item of configItems.value) {
        vals[item.key] = item.value ?? '';
      }
      editValues.value = vals;
    } finally {
      loading.value = false;
    }
  }

  watch(activeGroup, loadConfig);

  async function handleSave() {
    saving.value = true;
    try {
      const items = configItems.value.map(item => ({
        key: item.key,
        value: editValues.value[item.key] ?? '',
      }));
      await saveConfigApi(items);
      message.success($t('sys.config.saveSuccess'));
      await loadConfig();
    } finally {
      saving.value = false;
    }
  }

  async function handleMarkAsSys(item: ConfigApi.ConfigItem) {
    await updateConfigApi({ id: item.id, isSys: true });
    message.success($t('sys.config.markAsSysSuccess'));
    await loadConfig();
  }

  async function handleTogglePublic(item: ConfigApi.ConfigItem) {
    await updateConfigApi({ id: item.id, isPublic: !item.isPublic, label: item.label });
    await loadConfig();
  }

  async function handleDelete(item: ConfigApi.ConfigItem) {
    await deleteConfigApi(item.id);
    message.success($t('sys.config.deleteSuccess'));
    await loadConfig();
  }

  function updateEditValue(key: string, value: string) {
    editValues.value[key] = value;
  }

  return {
    configItems,
    editValues,
    loading,
    saving,
    loadConfig,
    handleSave,
    handleMarkAsSys,
    handleTogglePublic,
    handleDelete,
    updateEditValue,
  };
}
