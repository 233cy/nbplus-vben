/**
 * useDictItems - 字典项列表管理
 *
 * 负责：
 * 1. 根据选中的字典加载字典项
 * 2. 关键字搜索过滤
 * 3. 排序变更后同步到后端
 */

import type { DictApi } from '#/api/system/dict';

import { computed, ref } from 'vue';

import { getDictItemsApi, sortDictItemApi } from '#/api/system/dict';

export function useDictItems() {
  const loading = ref(false);
  const list = ref<DictApi.DictItemData[]>([]);
  const keyword = ref('');

  const isSearching = computed(() => keyword.value.trim().length > 0);

  const filteredList = computed(() => {
    const kw = keyword.value.toLowerCase();
    return kw ? list.value.filter(i => i.label.toLowerCase().includes(kw) || i.value.toLowerCase().includes(kw)) : list.value;
  });

  async function loadItems(dictId: string) {
    loading.value = true;
    try {
      list.value = await getDictItemsApi(dictId);
    } finally {
      loading.value = false;
    }
  }

  async function saveOrder() {
    const items = list.value.map((item, index) => ({
      id: item.id,
      sort: (index + 1) * 10,
    }));
    await sortDictItemApi(items);
  }

  return {
    loading,
    list,
    keyword,
    isSearching,
    filteredList,
    loadItems,
    saveOrder,
  };
}
