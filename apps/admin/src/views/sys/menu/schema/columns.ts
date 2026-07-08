import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { inlineUpdateMenuApi } from '#/api/sys/menuAdmin';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

import { useMenuAccessPermission } from '../permissions';

/**
 * 菜单树表格列定义
 *
 * 设计原则：
 * 1. 标题列作为详情入口，使用 CellLink 渲染，与标准列表模块保持一致。
 * 2. 行内编辑仅开放路由路径、权限码、排序、状态等低风险字段；
 *    标题、组件路径等核心字段走表单编辑。
 * 3. 详情入口集中在列表第一列（标题），操作列不再重复放置「详情」按钮。
 */
export function useColumns(handlers: {
  onAddChild: (row: MenuAdminApi.MenuItem) => void;
  onDelete: (row: MenuAdminApi.MenuItem) => void;
  onDetail: (row: MenuAdminApi.MenuItem) => void;
  onEdit: (row: MenuAdminApi.MenuItem) => void;
  onGeneratePermission: (row: MenuAdminApi.MenuItem) => void;
  onMove: (row: MenuAdminApi.MenuItem) => void;
  onRefreshNode: (row: MenuAdminApi.MenuItem) => Promise<void>;
}): VxeTableGridOptions['columns'] {
  const { canCreate, canUpdate, canDelete, canDetail, canBatchCreate } = useMenuAccessPermission();

  const inlineApi = (id: string, field: string, value: any) => inlineUpdateMenuApi(id, field, value);

  return [
    {
      type: 'checkbox',
      width: 50,
      align: 'center',
    },
    {
      field: 'title',
      title: $t('sys.menu.fields.title'),
      minWidth: 200,
      align: 'left',
      treeNode: true,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: (row: MenuAdminApi.MenuItem) => handlers.onDetail(row),
        },
      },
    },
    {
      field: 'type',
      title: $t('sys.menu.fields.type'),
      width: 100,
      formatter: ({ cellValue }: { cellValue: number }) => {
        const map: Record<number, string> = {
          1: $t('sys.menu.type.dir'),
          2: $t('sys.menu.type.menu'),
          3: $t('sys.menu.type.button'),
          4: $t('sys.menu.type.embedded'),
          5: $t('sys.menu.type.external'),
        };
        return map[cellValue] ?? '';
      },
    },
    {
      field: 'name',
      title: $t('sys.menu.fields.name'),
      minWidth: 140,
    },
    {
      field: 'path',
      title: $t('sys.menu.fields.path'),
      minWidth: 160,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'input',
          disabled: (row: MenuAdminApi.MenuItem) => row.type !== 3 || !canUpdate,
          apiFn: inlineApi,
        },
      },
    },
    {
      field: 'component',
      title: $t('sys.menu.fields.component'),
      minWidth: 180,
    },
    {
      field: 'permission',
      title: $t('sys.menu.fields.permission'),
      minWidth: 180,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'input',
          disabled: !canUpdate,
          apiFn: inlineApi,
        },
      },
    },
    {
      field: 'sort',
      title: $t('sys.menu.fields.sort'),
      width: 100,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'number',
          disabled: !canUpdate,
          apiFn: inlineApi,
          afterSuccess: (row: MenuAdminApi.MenuItem) => handlers.onRefreshNode(row),
        },
      },
    },
    {
      field: 'status',
      title: $t('sys.menu.fields.status'),
      width: 100,
      cellRender: {
        name: 'CellSwitch',
        attrs: {
          disabled: !canUpdate,
          beforeChange: async (val: number, row: MenuAdminApi.MenuItem) => {
            await inlineUpdateMenuApi(row.id, 'status', val);
            return true;
          },
        },
      },
    },
    {
      field: 'createdAt',
      title: $t('common.createdAt'),
      width: 160,
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      title: $t('common.operation'),
      width: 220,
      showOverflow: false,
      cellRender: {
        name: 'TableActions',
        attrs: {
          maxVisible: 2,
          actions: [
            {
              key: 'edit',
              label: $t('common.edit'),
              icon: 'lucide:pencil',
              hidden: !canUpdate,
              onClick: (row: MenuAdminApi.MenuItem) => handlers.onEdit(row),
            },
            {
              key: 'delete',
              label: $t('common.delete'),
              icon: 'lucide:trash-2',
              danger: true,
              confirmTitle: $t('common.confirmDelete'),
              hidden: !canDelete,
              onClick: (row: MenuAdminApi.MenuItem) => handlers.onDelete(row),
            },
            {
              key: 'addChild',
              label: $t('sys.menu.addChild'),
              icon: 'lucide:plus',
              hidden: ({ type }: MenuAdminApi.MenuItem) => !canCreate || type === 3,
              onClick: (row: MenuAdminApi.MenuItem) => handlers.onAddChild(row),
            },
            {
              key: 'generatePermission',
              label: $t('sys.menu.generatePermission'),
              icon: 'lucide:lock',
              hidden: ({ type }: MenuAdminApi.MenuItem) => type !== 2 || !canBatchCreate,
              onClick: (row: MenuAdminApi.MenuItem) => handlers.onGeneratePermission(row),
            },
            {
              key: 'move',
              label: $t('sys.menu.move'),
              icon: 'lucide:move',
              hidden: !canUpdate,
              onClick: (row: MenuAdminApi.MenuItem) => handlers.onMove(row),
            },
          ],
        },
      },
    },
  ];
}
