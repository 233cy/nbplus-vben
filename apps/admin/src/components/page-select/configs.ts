import type { PageSelectConfig } from './types';

import type { OptionsType } from '#/api/core/options';

import { $t } from '@vben/locales';

import { getOptionsApi } from '#/api/core/options';

export { type OptionsType };

/**
 * 职务选择器配置.
 */
export function postPageSelectConfig(): PageSelectConfig {
  return {
    type: 'list',
    api: params => getOptionsApi('post', params),
    columns: [
      { field: 'code', title: $t('common.code'), sortable: true },
      { field: 'name', title: $t('common.name'), sortable: true },
    ],
    labelField: 'name',
    valueField: 'id',
    title: $t('common.selectData'),
  };
}

/**
 * 部门选择器配置（树形）.
 */
export function deptPageSelectConfig(): PageSelectConfig {
  return {
    type: 'tree',
    api: params => getOptionsApi('dept', params),
    columns: [{ field: 'name', title: $t('common.name') }],
    labelField: 'name',
    valueField: 'id',
    parentField: 'parentId',
    multiple: false,
    title: $t('common.selectData'),
    checkStrictly: true,
  };
}

/**
 * 用户选择器配置.
 */
export function userPageSelectConfig(): PageSelectConfig {
  return {
    type: 'list',
    api: params => getOptionsApi('user', params),
    columns: [
      { field: 'username', title: $t('common.username') },
      { field: 'nickname', title: $t('common.nickname') },
    ],
    labelField: 'label',
    valueField: 'id',
    title: $t('common.selectData'),
  };
}

/**
 * 角色选择器配置.
 */
export function rolePageSelectConfig(): PageSelectConfig {
  return {
    type: 'list',
    api: params => getOptionsApi('role', params),
    columns: [
      { field: 'code', title: $t('common.code') },
      { field: 'name', title: $t('common.name') },
    ],
    labelField: 'name',
    valueField: 'id',
    title: $t('common.selectData'),
  };
}

/**
 * 字典类型选择器配置.
 */
export function dictPageSelectConfig(): PageSelectConfig {
  return {
    type: 'list',
    api: params => getOptionsApi('dict', params),
    columns: [
      { field: 'code', title: $t('common.code') },
      { field: 'name', title: $t('common.name') },
    ],
    labelField: 'name',
    valueField: 'id',
    title: $t('common.selectData'),
  };
}

/**
 * 存储配置选择器配置.
 */
export function storagePageSelectConfig(): PageSelectConfig {
  return {
    type: 'list',
    api: params => getOptionsApi('storage', params),
    columns: [
      { field: 'name', title: $t('common.name') },
      { field: 'engine', title: $t('common.engine') },
    ],
    labelField: 'name',
    valueField: 'id',
    title: $t('common.selectData'),
  };
}

/**
 * page-select 预设配置映射表.
 */
export const pageSelectConfigMap: Record<OptionsType, () => PageSelectConfig> = {
  post: postPageSelectConfig,
  dept: deptPageSelectConfig,
  user: userPageSelectConfig,
  role: rolePageSelectConfig,
  dict: dictPageSelectConfig,
  storage: storagePageSelectConfig,
};

/**
 * 根据类型获取 page-select 预设配置.
 */
export function getPageSelectConfig(type: OptionsType): PageSelectConfig {
  return pageSelectConfigMap[type]();
}
