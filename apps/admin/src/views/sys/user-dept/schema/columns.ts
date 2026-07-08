import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DeptApi } from '#/api/sys/userDept';

import { inlineUpdateDeptApi } from '#/api/sys/userDept';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

import { useUserDeptPermission } from '../permissions';

/**
 * 部门树表格列定义
 */
export function useColumns(handlers: {
  onAddChild: (row: DeptApi.DeptItem) => void;
  onDelete: (row: DeptApi.DeptItem) => void;
  onDetail: (row: DeptApi.DeptItem) => void;
  onEdit: (row: DeptApi.DeptItem) => void;
  onMove: (row: DeptApi.DeptItem) => void;
  onRefreshNode: (row: DeptApi.DeptItem) => Promise<void>;
  onToggleStatus: (row: DeptApi.DeptItem, val: number) => Promise<void>;
}): VxeTableGridOptions['columns'] {
  const { canCreate, canDetail, canUpdate, canDelete } = useUserDeptPermission();

  return [
    {
      field: 'name',
      title: $t('sys.user-dept.fields.name'),
      minWidth: 240,
      align: 'left',
      treeNode: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: (row: DeptApi.DeptItem) => handlers.onDetail(row),
        },
      },
    },
    {
      field: 'code',
      title: $t('sys.user-dept.fields.code'),
    },
    {
      field: 'leaderId',
      title: $t('sys.user-dept.fields.leaderId'),
    },
    {
      field: 'phone',
      title: $t('sys.user-dept.fields.phone'),
    },
    {
      field: 'email',
      title: $t('sys.user-dept.fields.email'),
    },
    {
      field: 'status',
      title: $t('sys.user-dept.fields.status'),
      cellRender: {
        name: 'CellSwitch',
        attrs: {
          beforeChange: async (val: number, row: DeptApi.DeptItem) => {
            await handlers.onToggleStatus(row, val);
            return true;
          },
        },
      },
    },
    {
      field: 'sort',
      title: $t('sys.user-dept.fields.sort'),
      width: 100,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'number',
          apiFn: (id: string, field: string, value: any) => inlineUpdateDeptApi(id, field, value),
          afterSuccess: (row: DeptApi.DeptItem) => handlers.onRefreshNode(row),
        },
      },
    },
    {
      field: 'createdAt',
      title: $t('common.createdAt'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      title: $t('common.operation'),
      width: 200,
      showOverflow: false,
      cellRender: {
        name: 'TableActions',
        attrs: {
          actions: [
            {
              key: 'edit',
              label: $t('common.edit'),
              icon: 'lucide:pencil',
              hidden: !canUpdate,
              onClick: (row: DeptApi.DeptItem) => handlers.onEdit(row),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: DeptApi.DeptItem) => handlers.onDelete(row),
            },
            {
              key: 'addChild',
              label: $t('sys.user-dept.addChild'),
              icon: 'lucide:plus',
              hidden: !canCreate,
              onClick: (row: DeptApi.DeptItem) => handlers.onAddChild(row),
            },
            {
              key: 'move',
              label: $t('sys.user-dept.move'),
              icon: 'lucide:move',
              hidden: !canUpdate,
              onClick: (row: DeptApi.DeptItem) => handlers.onMove(row),
            },
          ],
        },
      },
    },
  ];
}
