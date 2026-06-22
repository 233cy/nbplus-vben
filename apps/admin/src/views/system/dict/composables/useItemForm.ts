/**
 * useItemForm - 字典项新增/编辑/删除逻辑
 */

import type { DictApi } from '#/api/system/dict';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { createDictItemApi, deleteDictItemApi, updateDictItemApi } from '#/api/system/dict';
import { $t } from '#/locales';

import { calcNextSort, createDefaultItemForm } from '../data';

export interface UseItemFormOptions {
  activeDict: { value: DictApi.DictItem | null };
  itemList: { value: DictApi.DictItemData[] };
  reloadItems: (dictId: string) => Promise<void>;
}

export function useItemForm(options: UseItemFormOptions) {
  const { activeDict, itemList, reloadItems } = options;

  const visible = ref(false);
  const loading = ref(false);
  const editing = ref<DictApi.DictItemData | null>(null);
  const form = ref(createDefaultItemForm());

  function openCreate() {
    if (!activeDict.value) return;
    editing.value = null;
    form.value = {
      ...createDefaultItemForm(),
      sort: calcNextSort(itemList.value),
    };
    visible.value = true;
  }

  function openEdit(item: DictApi.DictItemData) {
    editing.value = item;
    form.value = {
      label: item.label,
      value: item.value,
      color: item.color ?? '',
      remark: item.remark ?? '',
      sort: item.sort,
      status: item.status,
    };
    visible.value = true;
  }

  async function handleSubmit() {
    if (!activeDict.value) return;

    loading.value = true;
    try {
      if (editing.value) {
        await updateDictItemApi({ id: editing.value.id, dictId: activeDict.value.id, ...form.value });
        message.success($t('system.dict.itemUpdateSuccess'));
      } else {
        await createDictItemApi({ dictId: activeDict.value.id, ...form.value });
        message.success($t('system.dict.itemCreateSuccess'));
      }
      visible.value = false;
      await reloadItems(activeDict.value.id);
    } finally {
      loading.value = false;
    }
  }

  async function handleDelete(item: DictApi.DictItemData) {
    if (!activeDict.value) return;
    await deleteDictItemApi(item.id);
    message.success($t('system.dict.itemDeleteSuccess'));
    await reloadItems(activeDict.value.id);
  }

  return {
    visible,
    loading,
    editing,
    form,
    openCreate,
    openEdit,
    handleSubmit,
    handleDelete,
  };
}
