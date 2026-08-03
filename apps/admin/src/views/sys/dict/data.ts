import type { DictApi } from '#/api/sys/dict';

/** 从字典列表中提取所有分组 */
export function getAllGroups(dicts: DictApi.DictItem[]): string[] {
  const set = new Set<string>();
  for (const d of dicts) {
    if (d.groups) set.add(d.groups);
  }
  return [...set];
}
