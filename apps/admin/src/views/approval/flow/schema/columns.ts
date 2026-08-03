import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ApprovalFlowApi } from '#/api/sys/approvalFlow';

import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

import { useFlowPermission } from '../permissions';

/**
 * 审批流程列表列定义
 */
export function useColumns(
  onDetailClick: (row: ApprovalFlowApi.FlowItem) => void,
  onDesignClick: (row: ApprovalFlowApi.FlowItem) => void,
  onStatusClick: (row: ApprovalFlowApi.FlowItem) => void,
): VxeTableGridOptions['columns'] {
  const { canDetail, canDesign, canStatus } = useFlowPermission();

  return [
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'bizType',
      title: $t('approval.flow.fields.bizType'),
      minWidth: 160,
    },
    {
      field: 'name',
      title: $t('approval.flow.fields.name'),
      minWidth: 160,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: (row: ApprovalFlowApi.FlowItem) => onDetailClick(row),
        },
      },
    },
    {
      field: 'status',
      title: $t('common.status'),
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.enabled'), value: 1 },
          { color: 'error', label: $t('common.disabled'), value: 2 },
        ],
      },
    },
    {
      field: 'updatedAt',
      title: $t('common.updatedAt'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
      width: 160,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      title: $t('common.operation'),
      width: 170,
      showOverflow: false,
      cellRender: {
        name: 'TableActions',
        attrs: {
          actions: [
            {
              key: 'design',
              label: $t('approval.flow.design'),
              icon: 'lucide:pen-tool',
              hidden: !canDesign,
              onClick: (row: ApprovalFlowApi.FlowItem) => onDesignClick(row),
            },
            {
              key: 'enable',
              label: $t('approval.flow.enable'),
              icon: 'lucide:power',
              confirmTitle: $t('approval.flow.confirmEnable'),
              hidden: (row: ApprovalFlowApi.FlowItem) => !canStatus || row.status === 1,
              onClick: (row: ApprovalFlowApi.FlowItem) => onStatusClick(row),
            },
            {
              key: 'disable',
              label: $t('approval.flow.disable'),
              icon: 'lucide:power-off',
              danger: true,
              confirmTitle: $t('approval.flow.confirmDisable'),
              hidden: (row: ApprovalFlowApi.FlowItem) => !canStatus || row.status !== 1,
              onClick: (row: ApprovalFlowApi.FlowItem) => onStatusClick(row),
            },
          ],
        },
      },
    },
  ];
}
