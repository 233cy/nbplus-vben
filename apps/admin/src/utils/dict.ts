/**
 * 字典数据获取 composable
 *
 * 全局缓存：同一个 code 只请求一次，所有调用方共享同一份数据。
 *
 * 用法：
 *   const { items, loading } = useDict('gender')
 *   const label = useDictLabel('gender', 1)        // computed string
 *   const color = useDictColor('gender', 1)        // computed string
 *   const items = await getDictItems('gender')     // 非响应式，直接拿数组
 */

import type { DictApi } from '#/api/sys/dict';

import { computed, ref } from 'vue';

import { getDictItemListApi, getDictOptionsApi } from '#/api/sys/dict';

// =========================================================================
// 全局缓存
// =========================================================================

/** code → 字典项数组 */
const dictCache = new Map<string, DictApi.DictItemData[]>();
/** code → 正在进行中的 Promise（防并发重复请求） */
const pendingMap = new Map<string, Promise<DictApi.DictItemData[]>>();
/** code → dictId（通过 options 接口拿到的映射） */
const codeToIdMap = new Map<string, string>();

let optionsLoaded = false;

async function ensureCodeMap() {
  if (optionsLoaded) return;
  const dicts = await getDictOptionsApi();
  for (const d of dicts) {
    codeToIdMap.set(d.code, d.id);
  }
  optionsLoaded = true;
}

async function fetchByCode(code: string): Promise<DictApi.DictItemData[]> {
  if (dictCache.has(code)) return dictCache.get(code)!;

  if (pendingMap.has(code)) return pendingMap.get(code)!;

  const promise = (async () => {
    await ensureCodeMap();
    const dictId = codeToIdMap.get(code);
    if (!dictId) return [];
    const items = await getDictItemListApi(dictId);
    dictCache.set(code, items);
    pendingMap.delete(code);
    return items;
  })();

  pendingMap.set(code, promise);
  return promise;
}

/** 主动清除某个 code 的缓存（字典数据更新后调用） */
export function clearDictCache(code?: string) {
  if (code) {
    dictCache.delete(code);
    pendingMap.delete(code);
  } else {
    dictCache.clear();
    pendingMap.clear();
    codeToIdMap.clear();
    optionsLoaded = false;
  }
}

// =========================================================================
// 响应式 composable
// =========================================================================

/**
 * 获取字典项列表（响应式）
 * @example const { items, loading } = useDict('gender')
 */
export function useDict(code: string) {
  // 缓存命中时同步初始化，避免 Select 初始渲染时 options 为空导致反显失败
  const items = ref<DictApi.DictItemData[]>(dictCache.get(code) ?? []);
  const loading = ref(!dictCache.has(code));

  if (!dictCache.has(code)) {
    fetchByCode(code).then(data => {
      items.value = data;
      loading.value = false;
    });
  }

  return { items, loading };
}

/**
 * 根据 value 获取 label（响应式 computed）
 * @example const label = useDictLabel('gender', row.gender)
 */
export function useDictLabel(code: string, value: null | number | string | undefined) {
  const { items } = useDict(code);
  return computed(() => {
    if (value === null || value === undefined) return '-';
    const item = items.value.find(i => String(i.value) === String(value));
    return item?.label ?? String(value);
  });
}

/**
 * 根据 value 获取 color（响应式 computed）
 * @example const color = useDictColor('gender', 1)
 */
export function useDictColor(code: string, value: null | number | string | undefined) {
  const { items } = useDict(code);
  return computed(() => {
    if (value === null || value === undefined) return undefined;
    const item = items.value.find(i => String(i.value) === String(value));
    return item?.color ?? undefined;
  });
}

/**
 * 非响应式：直接 await 拿字典项数组（用于表单初始化、逻辑判断等）
 * @example const items = await getDictItems('gender')
 */
export function getDictItems(code: string): Promise<DictApi.DictItemData[]> {
  return fetchByCode(code);
}

/**
 * 非响应式：直接 await 拿某个 value 对应的 label
 * @example const label = await getDictLabel('gender', 1)
 */
export async function getDictLabel(code: string, value: null | number | string | undefined): Promise<string> {
  if (value === null || value === undefined) return '-';
  const items = await fetchByCode(code);
  const item = items.find(i => String(i.value) === String(value));
  return item?.label ?? String(value);
}

/**
 * 将字典项转换为 Select options 格式
 * @example const options = await getDictOptions('gender')
 */
export async function getDictOptions(code: string): Promise<{ color?: null | string; label: string; value: string }[]> {
  const items = await fetchByCode(code);
  return items.filter(i => i.status === 1).map(i => ({ label: i.label, value: i.value, color: i.color }));
}
