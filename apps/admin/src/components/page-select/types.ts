import type { VxeGridProps } from '#/adapter/vxe-table';

/**
 * page-select 统一配置项.
 *
 * 把选择器的「数据接口、表格列、字段映射、交互模式」集中到一个对象里，
 * 避免在模板里分散传 props。
 */
export interface PageSelectConfig<T = any> {
  /** 选择器交互模式：list=表格分页选择，tree=树形选择 */
  type: 'list' | 'tree';

  /** 数据接口，支持分页对象或纯数组 */
  api: (params: any) => Promise<T[] | { items: T[]; total: number }>;

  /** vxe-grid 列配置 */
  columns: VxeGridProps<T>['columns'];

  /** 显示标签字段 */
  labelField: keyof T | string;

  /** 值字段 */
  valueField: keyof T | string;

  /** 弹窗标题，默认走 $t('common.selectData') */
  title?: string;

  /** 是否多选，默认 true */
  multiple?: boolean;

  /** 分页大小，list 模式下生效 */
  pageSize?: number;

  /** 树形模式下父子节点是否独立勾选，默认 false（父子联动） */
  checkStrictly?: boolean;
}
