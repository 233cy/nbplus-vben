import type { CurdAdminApi } from '#/api/admin/dev/curdAdmin';

/**
 * CURD 管理模块共享常量、类型与工具函数
 *
 * 职责：集中管理组件选项、字典相关组件集合、批量修改组件集合、状态选项、
 * 表单默认值以及类名/路由转换工具函数，避免这些逻辑散落在页面和 composables 中。
 */

/** 可选的表单组件类型列表 */
export const COMPONENT_OPTIONS: { label: string; value: CurdAdminApi.ComponentType }[] = [
  { label: 'Input（单行文本）', value: 'Input' },
  { label: 'InputNumber（数字）', value: 'InputNumber' },
  { label: 'InputPassword（密码）', value: 'InputPassword' },
  { label: 'Textarea（多行文本）', value: 'Textarea' },
  { label: 'Select（下拉选择）', value: 'Select' },
  { label: 'ApiSelect（远程下拉）', value: 'ApiSelect' },
  { label: 'DictSelect（字典下拉）', value: 'DictSelect' },
  { label: 'DictRadio（字典单选）', value: 'DictRadio' },
  { label: 'Switch（开关）', value: 'Switch' },
  { label: 'Checkbox（复选框）', value: 'Checkbox' },
  { label: 'CheckboxGroup（复选组）', value: 'CheckboxGroup' },
  { label: 'Radio（单选）', value: 'Radio' },
  { label: 'RadioGroup（单选组）', value: 'RadioGroup' },
  { label: 'DatePicker（日期）', value: 'DatePicker' },
  { label: 'TimePicker（时间）', value: 'TimePicker' },
  { label: 'RangePicker（日期范围）', value: 'RangePicker' },
  { label: 'TreeSelect（树形选择）', value: 'TreeSelect' },
  { label: 'Upload（文件上传）', value: 'Upload' },
  { label: 'ImageUpload（图片上传）', value: 'ImageUpload' },
  { label: 'AvatarUpload（头像上传）', value: 'AvatarUpload' },
  { label: 'Edit（富文本）', value: 'Edit' },
  { label: 'IconPicker（图标选择）', value: 'IconPicker' },
  { label: 'Rate（评分）', value: 'Rate' },
  { label: 'Mentions（提及）', value: 'Mentions' },
  { label: 'AutoComplete（自动完成）', value: 'AutoComplete' },
  { label: 'CreatableSelect（可创建下拉）', value: 'CreatableSelect' },
];

/** 需要绑定字典 code 的组件类型 */
export const DICT_COMPONENTS = new Set<CurdAdminApi.ComponentType>(['DictRadio', 'DictSelect']);

/** 支持批量修改的组件类型 */
export const BATCH_UPDATE_COMPONENTS: CurdAdminApi.ComponentType[] = ['DictSelect', 'DictRadio', 'Select', 'RadioGroup'];

/** 创建状态下拉选项 */
export function createStatusOptions(t: (key: string) => string) {
  return [
    { label: t('dev.curd.status.enabled'), value: 1 },
    { label: t('dev.curd.status.disabled'), value: 2 },
  ];
}

/** 默认空表配置表单 */
export function createDefaultTableForm(): CurdAdminApi.TableSaveParams & { id?: string } {
  return {
    title: '',
    tableName: '',
    dbConnection: 'default',
    module: '',
    className: '',
    routePrefix: '',
    author: '',
    remark: '',
    status: 1,
  };
}

/** 创建默认空字段 */
export function createDefaultField(tableId: string, sort: number): CurdAdminApi.CurdField {
  return {
    tableId,
    columnName: '',
    component: 'Input',
    label: '',
    isList: true,
    isSearch: false,
    isForm: true,
    isRequired: false,
    isBatchUpdate: false,
    options: null,
    sort,
  };
}

/** 默认空菜单生成表单 */
export function createDefaultMenuForm(): {
  id: string;
  menuIcon: string;
  menuParentId: null | string;
  menuPath: string;
  menuSort: number;
} {
  return {
    id: '',
    menuParentId: null,
    menuPath: '',
    menuIcon: 'lucide:table-2',
    menuSort: 0,
  };
}

/**
 * 将大驼峰类名转换为短横线连接（kebab-case）
 * 例：UserRole → user-role
 */
export function toKebabCase(className: string): string {
  return className.replaceAll(/([A-Z])/g, (_, c: string, i: number) => (i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`));
}

/** 根据模块与类名构建默认菜单路径 */
export function buildMenuPath(moduleName: string, className: string, isAbsolute = true): string {
  const kebab = toKebabCase(className);
  return isAbsolute ? `/${moduleName}/${kebab}` : kebab;
}
