/**
 * 字典管理页面 composables 统一导出
 *
 * 将页面逻辑按职责拆分为 4 个 composable：
 * - useDict：字典数据与选中状态
 * - useDictItems：字典项列表管理（加载、搜索、排序）
 * - useDictForm：字典新增/编辑/删除弹窗
 * - useItemForm：字典项新增/编辑/删除弹窗
 */
export { useDict } from './useDict';
export { useDictForm } from './useDictForm';
export { useDictItems } from './useDictItems';
export { useItemForm } from './useItemForm';
export type { DictGroup } from './useDict';
