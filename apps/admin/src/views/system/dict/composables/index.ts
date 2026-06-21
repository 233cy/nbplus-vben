/**
 * 字典管理页面 composables 统一导出
 *
 * 将页面逻辑按职责拆分为 4 个 composable：
 * - useDictTree：树结构管理（加载、搜索、拖拽排序）
 * - useDictItems：字典项列表管理（加载、搜索、拖拽排序）
 * - useDictForm：字典新增/编辑/删除弹窗
 * - useItemForm：字典项新增/编辑/删除弹窗
 */
export { useDictForm } from './useDictForm';
export { useDictItems } from './useDictItems';
export { useDictTree } from './useDictTree';
export { useItemForm } from './useItemForm';

export type { DictNode, GroupNode, TreeNode } from './useDictTree';
