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

  /** 树形平级数据转树时的父节点字段，默认 parentId */
  parentField?: string;

  /** 树形模式下是否默认展开全部节点，默认 true */
  treeDefaultExpandAll?: boolean;

  /** 树形模式下父子节点是否独立勾选，默认 false（父子联动） */
  checkStrictly?: boolean;
}

/**
 * PageSelect 组件（index.vue）props 契约说明.
 *
 * 组件内联定义 props，此处同步一份对外类型，新增 prop 时两处一起维护。
 */
export interface PageSelectProps {
  /** 树形模式下父子节点是否独立勾选，默认读取 config.checkStrictly */
  checkStrictly?: boolean;
  /** 选择器配置：预设 key 或完整配置对象 */
  config: PageSelectConfig | string;
  /** 页面回显区域最多展示的 Tag 数量，默认 20 */
  maxEchoCount?: number;
  /** 绑定值：逗号分隔字符串或字符串数组 */
  modelValue?: string | string[];
  /** 是否多选，默认读取 config.multiple */
  multiple?: boolean;
  /** 透传给 config.api 的固定查询参数（如 { deptId } 过滤），变化时防抖重载 */
  params?: Record<string, any>;
  /** 是否展示页面回显区域（slot 区域），默认 true */
  showEchoSlot?: boolean;
  /** 响应的数据格式：string=逗号分隔字符串（默认），array=字符串数组 */
  valueType?: 'array' | 'string';
}
