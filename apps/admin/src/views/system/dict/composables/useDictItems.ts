/**
 * useDictItems - 字典项列表管理 composable
 *
 * 负责：
 * 1. 根据选中的字典加载对应的字典项列表
 * 2. 关键字搜索过滤（按 label 或 value 匹配）
 * 3. 拖拽排序后同步排序结果到后端
 *
 * 注意：搜索时禁用拖拽，避免过滤状态下排序导致数据错乱
 */

import type { DictApi } from '#/api/system/dict';

import { computed, ref } from 'vue';

import { getDictItemsApi, sortDictItemApi } from '#/api/system/dict';

export function useDictItems() {
  /** 字典项加载状态 */
  const loading = ref(false);
  /** 字典项列表数据（vuedraggable 直接绑定此数组，拖拽会修改顺序） */
  const list = ref<DictApi.DictItemData[]>([]);
  /** 搜索关键字 */
  const keyword = ref('');

  /** 是否正在搜索（搜索时禁用拖拽） */
  const isSearching = computed(() => keyword.value.trim().length > 0);

  /**
   * 过滤后的字典项列表
   * 按 label 或 value 模糊匹配关键字
   * 搜索时展示过滤结果（只读），非搜索时返回原始列表
   */
  const filteredList = computed(() => {
    const kw = keyword.value.toLowerCase();
    return kw
      ? list.value.filter((i) => i.label.toLowerCase().includes(kw) || i.value.toLowerCase().includes(kw))
      : list.value;
  });

  /**
   * 从后端加载指定字典的所有字典项
   * @param dictId 字典 ID
   */
  async function loadItems(dictId: string) {
    loading.value = true;
    try {
      list.value = await getDictItemsApi(dictId);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 拖拽结束回调
   * vuedraggable 已自动更新 list 的顺序，这里只需将新顺序同步到后端
   * 采用乐观更新策略：失败时重新加载
   *
   * @param dictId 当前字典 ID（用于失败时回滚加载）
   */
  function onDragEnd(dictId: string) {
    const sortItems = list.value.map((item, i) => ({ id: item.id, sort: (i + 1) * 10 }));
    sortDictItemApi(sortItems).catch(() => loadItems(dictId));
  }

  return {
    /** 加载状态 */
    loading,
    /** 字典项列表（可拖拽排序） */
    list,
    /** 搜索关键字 */
    keyword,
    /** 是否正在搜索 */
    isSearching,
    /** 过滤后的列表（只读） */
    filteredList,
    /** 加载字典项 */
    loadItems,
    /** 拖拽排序完成后同步到后端 */
    onDragEnd,
  };
}
