import { requestClient } from '#/api/request';

export type OptionsType = 'post' | 'dept' | 'user' | 'role' | 'dict' | 'storage';

export interface OptionsParams {
  keyword?: string;
  code?: string;
  ids?: string;
}

export interface OptionItem {
  id: string;
  value: string;
  label: string;
  [key: string]: any;
}

const BASE = '/admin/core/options';

/**
 * 获取通用选项数据.
 *
 * @param type 选项类型
 * @param params 查询参数：keyword 关键词、code 字典编码、ids 回显ID（逗号分隔）
 */
export function getOptionsApi(type: OptionsType, params?: OptionsParams) {
  return requestClient.get<OptionItem[]>(`${BASE}/${type}`, { params });
}
