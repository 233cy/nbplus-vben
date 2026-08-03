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
   */
  async function refreshParentOf(row: DeptApi.DeptItem) {
    const grid = gridApi.grid as any;
    if (!grid) return;

    const parentRow = grid.getTreeParentRow?.(row);
    if (!parentRow) {
      await refreshRoot();
      return;
    }

    const parentWasExpanded = !!grid.isTreeExpandByRow?.(parentRow);

    await grid.reloadTreeExpand?.(parentRow);

    const childCount = parentRow.children?.length ?? 0;
    parentRow.hasChild = childCount > 0;

    if (childCount > 0) {
      if (parentWasExpanded && !grid.isTreeExpandByRow?.(parentRow)) {
        await grid.setTreeExpand?.([parentRow], true);
      }
    } else if (grid.isTreeExpandByRow?.(parentRow)) {
      await grid.setTreeExpand?.([parentRow], false);
    }
  }

  /**
   * 根据父级 ID 刷新对应子树。
   * parentId 为 null 时刷新根级列表。
   */
  async function refreshByParentId(parentId: string | null) {
    const grid = gridApi.grid as any;
    if (!grid) return;

    if (!parentId) {
      await refreshRoot();
      return;
    }

    const parentRow = grid.getRowById?.(parentId);
    if (!parentRow) {
      await refreshRoot();
      return;
    }

    const parentWasExpanded = !!grid.isTreeExpandByRow?.(parentRow);
    await grid.reloadTreeExpand?.(parentRow);

    const childCount = parentRow.children?.length ?? 0;
    parentRow.hasChild = childCount > 0;

    if (childCount > 0) {
      if (parentWasExpanded && !grid.isTreeExpandByRow?.(parentRow)) {
        await grid.setTreeExpand?.([parentRow], true);
      }
    } else if (grid.isTreeExpandByRow?.(parentRow)) {
      await grid.setTreeExpand?.([parentRow], false);
    }
  }

  /**
   * 批量刷新多个父节点子树。
   */
  async function refreshByParentIds(parentIds: (string | null)[]) {
    const uniqueIds = Array.from(new Set(parentIds));
    for (const parentId of uniqueIds) {
      await refreshByParentId(parentId);
    }
  }

  /**
   * 整表刷新并恢复刷新前已展开的根级节点。
   */
  async function refreshRoot() {
    const grid = gridApi.grid as any;
    if (!grid) return;

    const expandedIds = (grid.getTreeExpandRecords?.() ?? []).map((r: DeptApi.DeptItem) => r.id);
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
    refreshByParentId,
    refreshByParentIds,
    handleToggleStatus,
    expandAll,
    collapseAll,
  };
}
