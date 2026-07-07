import type { DeptApi } from '#/api/sys/userDept';

import { deleteDeptApi, inlineUpdateDeptApi } from '#/api/sys/userDept';
import { useTableDelete } from '#/utils/table';

export interface UseDeptOptions {
  gridApi: any;
}

export function useDept(options: UseDeptOptions) {
  const { gridApi } = options;

  async function handleToggleStatus(row: DeptApi.DeptItem, val: number) {
    await inlineUpdateDeptApi(row.id, 'status', val);
  }

  /**
   * 刷新指定行的父节点子树，并显式恢复父节点的展开状态。
   *
   * vxe-table 在 transform + lazy 模式下，reloadTreeExpand 会先收起再重载子节点，
   * 重载后并不一定能保留父节点本身的展开态，因此这里在重载后用 setTreeExpand 显式恢复，
   * 确保「删除后已展开的节点保持展开」。
   */
  async function refreshParentOf(row: DeptApi.DeptItem) {
    const grid = gridApi.grid as any;
    if (!grid) return;

    const parentRow = grid.getTreeParentRow?.(row);
    if (!parentRow) {
      // 删除的是根节点：整表刷新并恢复已展开的根级节点
      await refreshRoot();
      return;
    }

    const parentWasExpanded = !!grid.isTreeExpandByRow?.(parentRow);

    // 重新加载父节点的子节点列表（移除已删除节点、刷新同级节点）
    await grid.reloadTreeExpand?.(parentRow);

    // reloadTreeExpand 已重新拉取子节点，直接读取已加载的子节点数量校正 hasChild
    const childCount = parentRow.children?.length ?? 0;
    parentRow.hasChild = childCount > 0;

    // 显式恢复父节点展开状态
    if (childCount > 0) {
      // 仍有子节点：若此前是展开的，确保继续保持展开
      if (parentWasExpanded && !grid.isTreeExpandByRow?.(parentRow)) {
        await grid.setTreeExpand?.([parentRow], true);
      }
    } else if (grid.isTreeExpandByRow?.(parentRow)) {
      // 已删除最后一个子节点：父节点不再具备展开折叠能力，折叠之
      await grid.setTreeExpand?.([parentRow], false);
    }
  }

  /**
   * 整表刷新并恢复刷新前已展开的根级节点。
   */
  async function refreshRoot() {
    const grid = gridApi.grid as any;
    if (!grid) return;

    const expandedIds = (grid.getTreeExpandRecords?.() ?? []).map((row: DeptApi.DeptItem) => row.id);
    await gridApi.query();
    if (expandedIds.length > 0) {
      const newRows = expandedIds.map((id: string) => grid.getRowById?.(id)).filter(Boolean);
      if (newRows.length > 0) {
        await grid.setTreeExpand?.(newRows, true);
      }
    }
  }

  function handleDelete(row: DeptApi.DeptItem) {
    useTableDelete(deleteDeptApi, row.id, row.name, () => refreshParentOf(row));
  }

  async function expandAll() {
    await (gridApi.grid as any)?.setAllTreeExpand?.(true);
  }

  async function collapseAll() {
    await (gridApi.grid as any)?.setAllTreeExpand?.(false);
  }

  return {
    handleDelete,
    handleRefreshNode: refreshParentOf,
    handleToggleStatus,
    expandAll,
    collapseAll,
  };
}
