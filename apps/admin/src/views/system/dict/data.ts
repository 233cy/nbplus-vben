/**
 * 字典管理模块共享常量、类型与工具函数
 */

import type { DictApi } from '#/api/admin/sys/dict';

/** 字典项颜色选项 */
export function createColorOptions(t: (key: string) => string) {
  return [
    { label: t('system.dict.color.default'), value: '' },
    { label: t('system.dict.color.success'), value: 'success' },
    { label: t('system.dict.color.processing'), value: 'processing' },
    { label: t('system.dict.color.error'), value: 'error' },
    { label: t('system.dict.color.warning'), value: 'warning' },
    { label: t('system.dict.color.magenta'), value: 'magenta' },
    { label: t('system.dict.color.red'), value: 'red' },
    { label: t('system.dict.color.volcano'), value: 'volcano' },
    { label: t('system.dict.color.orange'), value: 'orange' },
    { label: t('system.dict.color.gold'), value: 'gold' },
    { label: t('system.dict.color.lime'), value: 'lime' },
    { label: t('system.dict.color.green'), value: 'green' },
    { label: t('system.dict.color.cyan'), value: 'cyan' },
    { label: t('system.dict.color.blue'), value: 'blue' },
    { label: t('system.dict.color.geekblue'), value: 'geekblue' },
    { label: t('system.dict.color.purple'), value: 'purple' },
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
