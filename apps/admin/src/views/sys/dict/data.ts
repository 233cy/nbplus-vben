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

/** 从字典列表中提取所有分组 */
export function getAllGroups(dicts: DictApi.DictItem[]): string[] {
  const set = new Set<string>();
  for (const d of dicts) {
    if (d.groups) set.add(d.groups);
  }
  return [...set];
}
