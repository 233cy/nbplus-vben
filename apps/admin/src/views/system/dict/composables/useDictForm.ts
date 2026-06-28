/**
 * useDictForm - 字典类型新增/编辑/删除逻辑
 */

import type { DictApi } from '#/api/admin/sys/dict';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { createDictApi, deleteDictApi, updateDictApi } from '#/api/admin/sys/dict';
import { $t } from '#/locales';

import { createDefaultDictForm } from '../data';

export interface UseDictFormOptions {
  allDicts: { value: DictApi.DictItem[] };
  activeDict: { value: DictApi.DictItem | null };
  reload: () => Promise<void>;
  clearSelection: () => void;
}

export function useDictForm(options: UseDictFormOptions) {
  const { allDicts, activeDict, reload, clearSelection } = options;

  const visible = ref(false);
  const loading = ref(false);
  const editing = ref<DictApi.DictItem | null>(null);
  const form = ref(createDefaultDictForm());

  const groupOptions = computed(() =>
    [...new Set(allDicts.value.map((d) => d.groups).filter(Boolean))].map((g) => ({
      label: g,
      value: g,
    })),
  );

  function openCreate(groupName?: string) {
    editing.value = null;
    form.value = {
      ...createDefaultDictForm(),
      groups: groupName && groupName !== $t('system.dict.defaultGroup') ? groupName : '',
    };
    visible.value = true;
  }

  function openEdit(dict: DictApi.DictItem) {
    editing.value = dict;
    form.value = {
      name: dict.name,
      code: dict.code,
      groups: dict.groups ?? '',
      remark: dict.remark ?? '',
      status: dict.status,
    };
    visible.value = true;
  }

  async function handleSubmit() {
    loading.value = true;
    try {
      if (editing.value) {
        await updateDictApi({ id: editing.value.id, ...form.value });
        message.success($t('system.dict.updateSuccess'));
        if (activeDict.value?.id === editing.value.id) {
          activeDict.value = { ...activeDict.value, ...form.value };
        }
      } else {
        await createDictApi(form.value);
        message.success($t('system.dict.createSuccess'));
      }
      visible.value = false;
      await reload();
    } finally {
      loading.value = false;
    }
  }

  async function handleDelete(dict: DictApi.DictItem) {
    await deleteDictApi(dict.id);
    message.success($t('system.dict.deleteSuccess'));
    if (activeDict.value?.id === dict.id) {
      clearSelection();
    }
    await reload();
  }

  return {
    visible,
    loading,
    editing,
    form,
    groupOptions,
    openCreate,
    openEdit,
    handleSubmit,
    handleDelete,
  };
}
