/**
 * 字典管理模块共享常量、类型与工具函数
 */

import type { DictApi } from '#/api/sys/dict';

/** 字典项颜色选项 */
export function createColorOptions(t: (key: string) => string) {
  return [
    { label: t('sys.dict.color.default'), value: '' },
    { label: t('sys.dict.color.success'), value: 'success' },
    { label: t('sys.dict.color.processing'), value: 'processing' },
    { label: t('sys.dict.color.error'), value: 'error' },
    { label: t('sys.dict.color.warning'), value: 'warning' },
    { label: t('sys.dict.color.magenta'), value: 'magenta' },
    { label: t('sys.dict.color.red'), value: 'red' },
    { label: t('sys.dict.color.volcano'), value: 'volcano' },
    { label: t('sys.dict.color.orange'), value: 'orange' },
    { label: t('sys.dict.color.gold'), value: 'gold' },
    { label: t('sys.dict.color.lime'), value: 'lime' },
    { label: t('sys.dict.color.green'), value: 'green' },
    { label: t('sys.dict.color.cyan'), value: 'cyan' },
    { label: t('sys.dict.color.blue'), value: 'blue' },
    { label: t('sys.dict.color.geekblue'), value: 'geekblue' },
    { label: t('sys.dict.color.purple'), value: 'purple' },
  ];
}

/** 从所有字典中提取分组列表 */
export function extractGroups(dicts: DictApi.DictItem[], defaultGroup: string): string[] {
  const set = new Set(dicts.map(d => d.groups || defaultGroup));
  return [...set];
}

/** 按分组归类字典 */
export function groupByGroups(dicts: DictApi.DictItem[], defaultGroup: string): Map<string, DictApi.DictItem[]> {
  const map = new Map<string, DictApi.DictItem[]>();
  for (const d of dicts) {
    const g = d.groups || defaultGroup;
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(d);
  }
  return map;
}

/** 字典项默认表单 */
export function createDefaultItemForm(): {
  color: string;
  label: string;
  remark: string;
  sort: number;
  status: number;
  value: string;
} {
  return { label: '', value: '', color: '', remark: '', sort: 0, status: 1 };
}

/** 字典类型默认表单 */
export function createDefaultDictForm(): {
  code: string;
  groups: string;
  name: string;
  remark: string;
  status: number;
} {
  return { name: '', code: '', groups: '', remark: '', status: 1 };
}

/** 计算新建字典项的默认排序 */
export function calcNextSort(items: DictApi.DictItemData[]): number {
  if (items.length === 0) return 10;
  return Math.max(...items.map(i => i.sort)) + 10;
}
