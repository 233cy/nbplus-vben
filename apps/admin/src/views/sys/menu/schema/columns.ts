import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { inlineUpdateMenuApi } from '#/api/sys/menuAdmin';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

/**
 * 菜单树表格列定义
 */
export function useColumns(handlers: {
  onAddChild: (row: MenuAdminApi.MenuItem) => void;
  onDelete: (row: MenuAdminApi.MenuItem) => void;
  onEdit: (row: MenuAdminApi.MenuItem) => void;
  onGeneratePermission: (row: MenuAdminApi.MenuItem) => void;
  onMove: (row: MenuAdminApi.MenuItem) => void;
  onRefreshNode: (row: MenuAdminApi.MenuItem) => Promise<void>;
}): VxeTableGridOptions['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canCreate = hasAccessByCodes(['adm:sys:menu:create']);
  const canUpdate = hasAccessByCodes(['adm:sys:menu:update']);
  const canDelete = hasAccessByCodes(['adm:sys:menu:delete']);

  const inlineApi = (id: string, field: string, value: any) => inlineUpdateMenuApi(id, field, value);

  return [
    {
      field: 'title',
      title: $t('sys.menu.fields.title'),
      minWidth: 260,
      align: 'left',
      treeNode: true,
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
      field: 'type',
      title: $t('sys.menu.fields.type'),
      width: 100,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'select',
          dictCode: 'sys_menu_type',
          disabled: !canUpdate,
          apiFn: inlineApi,
          afterSuccess: (row: MenuAdminApi.MenuItem) => handlers.onRefreshNode(row),
        },
      },
    },
    {
      field: 'name',
      title: $t('sys.menu.fields.name'),
      minWidth: 140,
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
      field: 'path',
      title: $t('sys.menu.fields.path'),
      minWidth: 160,
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
      field: 'component',
      title: $t('sys.menu.fields.component'),
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
      field: 'isHidden',
      title: $t('sys.menu.fields.isHidden'),
      width: 100,
      cellRender: {
        name: 'CellSwitch',
        attrs: {
          disabled: !canUpdate,
          beforeChange: async (val: number, row: MenuAdminApi.MenuItem) => {
            await inlineUpdateMenuApi(row.id, 'isHidden', val);
            return true;
          },
        },
      },
    },
    {
      field: 'isKeepAlive',
      title: $t('sys.menu.fields.isKeepAlive'),
      width: 100,
      cellRender: {
        name: 'CellSwitch',
        attrs: {
          disabled: !canUpdate,
          beforeChange: async (val: number, row: MenuAdminApi.MenuItem) => {
            await inlineUpdateMenuApi(row.id, 'isKeepAlive', val);
            return true;
          },
        },
      },
    },
    {
      field: 'isHideChildren',
      title: $t('sys.menu.fields.isHideChildren'),
      width: 120,
      cellRender: {
        name: 'CellSwitch',
        attrs: {
          disabled: !canUpdate,
          beforeChange: async (val: number, row: MenuAdminApi.MenuItem) => {
            await inlineUpdateMenuApi(row.id, 'isHideChildren', val);
            return true;
          },
        },
      },
    },
    {
      field: 'isHideBreadcrumb',
      title: $t('sys.menu.fields.isHideBreadcrumb'),
      width: 120,
      cellRender: {
        name: 'CellSwitch',
        attrs: {
          disabled: !canUpdate,
          beforeChange: async (val: number, row: MenuAdminApi.MenuItem) => {
            await inlineUpdateMenuApi(row.id, 'isHideBreadcrumb', val);
            return true;
          },
        },
      },
    },
    {
      field: 'isHideTab',
      title: $t('sys.menu.fields.isHideTab'),
      width: 120,
      cellRender: {
        name: 'CellSwitch',
        attrs: {
          disabled: !canUpdate,
          beforeChange: async (val: number, row: MenuAdminApi.MenuItem) => {
            await inlineUpdateMenuApi(row.id, 'isHideTab', val);
            return true;
          },
        },
      },
    },
    {
      field: 'isAffixTab',
      title: $t('sys.menu.fields.isAffixTab'),
      width: 100,
      cellRender: {
        name: 'CellSwitch',
        attrs: {
          disabled: !canUpdate,
          beforeChange: async (val: number, row: MenuAdminApi.MenuItem) => {
            await inlineUpdateMenuApi(row.id, 'isAffixTab', val);
            return true;
          },
        },
      },
    },
    {
      field: 'badgeType',
      title: $t('sys.menu.fields.badgeType'),
      width: 110,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'select',
          dictCode: 'sys_badge_type',
          disabled: !canUpdate,
          apiFn: inlineApi,
        },
      },
    },
    {
      field: 'badgeVariants',
      title: $t('sys.menu.fields.badgeVariants'),
      width: 110,
      cellRender: {
        name: 'CellInlineEdit',
        attrs: {
          type: 'select',
          dictCode: 'sys_badge_variant',
          disabled: !canUpdate,
          apiFn: inlineApi,
        },
      },
    },
    {
      field: 'badge',
      title: $t('sys.menu.fields.badge'),
      width: 120,
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
              hidden: !canCreate,
              onClick: (row: MenuAdminApi.MenuItem) => handlers.onAddChild(row),
            },
            {
              key: 'generatePermission',
              label: $t('sys.menu.generatePermission'),
              icon: 'lucide:lock',
              hidden: ({ type }: MenuAdminApi.MenuItem) => type !== 2,
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
