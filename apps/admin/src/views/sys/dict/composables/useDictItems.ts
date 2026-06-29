/**
 * useDictItems - 字典项列表管理
 *
 * 负责：
 * 1. 根据选中的字典加载字典项
 * 2. 关键字搜索过滤
 * 3. 排序变更后同步到后端
 */

import type { DictApi } from '#/api/sys/dict';

import { ref } from 'vue';

import { getDictItemsApi } from '#/api/sys/dict';

export function useDictItems() {
  const loading = ref(false);
  const list = ref<DictApi.DictItemData[]>([]);
  const keyword = ref('');

  async function loadItems(dictId: string) {
    loading.value = true;
    try {
      list.value = await getDictItemsApi(dictId);
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    list,
    keyword,
    loadItems,
  };
}
