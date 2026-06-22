/**
 * useDict - 字典类型数据管理
 *
 * 负责：
 * 1. 加载所有字典数据
 * 2. 按 groups 分组展示（groups 仅作为分类，不参与拖拽）
 * 3. 关键字搜索过滤
 * 4. 当前选中的字典管理
 */

import type { DictApi } from '#/api/system/dict';

import { computed, ref } from 'vue';

import { getAllDictsApi } from '#/api/system/dict';

import { extractGroups, groupByGroups } from '../data';

export interface DictGroup {
  key: string;
  title: string;
  children: DictApi.DictItem[];
}

export interface UseDictOptions {
  defaultGroupLabel: string;
}

export function useDict(options: UseDictOptions) {
  const { defaultGroupLabel } = options;

  const loading = ref(false);
  const allDicts = ref<DictApi.DictItem[]>([]);
  const keyword = ref('');
  const activeDict = ref<DictApi.DictItem | null>(null);
  const expandedKeys = ref<string[]>([]);

  const groups = computed(() => extractGroups(allDicts.value, defaultGroupLabel));

  const filteredDicts = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    if (!kw) return allDicts.value;
    return allDicts.value.filter(d => d.name.toLowerCase().includes(kw) || d.code.toLowerCase().includes(kw));
  });

  const treeData = computed<DictGroup[]>(() => {
    const map = groupByGroups(filteredDicts.value, defaultGroupLabel);
    return [...map.entries()].map(([groupName, dicts]) => ({
      key: `group::${groupName}`,
      title: groupName,
      children: dicts,
    }));
  });

  async function loadDicts() {
    loading.value = true;
    try {
      allDicts.value = await getAllDictsApi();
      expandedKeys.value = groups.value.map(g => `group::${g}`);
    } finally {
      loading.value = false;
    }
  }

  function onSelect(selectedKeys: (number | string)[], info: any) {
    const node = info.node as DictApi.DictItem | DictGroup;
    if ('children' in node) {
      activeDict.value = null;
      return;
    }
    activeDict.value = node;
  }

  function clearSelection() {
    activeDict.value = null;
  }

  return {
    loading,
    allDicts,
    keyword,
    activeDict,
    expandedKeys,
    groups,
    filteredDicts,
    treeData,
    loadDicts,
    onSelect,
    clearSelection,
  };
}
