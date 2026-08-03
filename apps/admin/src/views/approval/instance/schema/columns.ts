import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ApprovalInstanceApi } from '#/api/sys/approvalInstance';

import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

import { useInstancePermission } from '../permissions';

/** 实例状态对应的 Tag 颜色 */
const statusColorMap: Record<number, string> = {
  1: 'processing',
  2: 'success',
  3: 'error',
  4: 'default',
};

/**
 * 审批实例列表列定义
 */
export function useColumns(
  onDetailClick: (row: ApprovalInstanceApi.InstanceItem) => void,
): VxeTableGridOptions['columns'] {
  const { canDetail } = useInstancePermission();

  return [
    { field: 'id', title: 'ID', visible: false },
    {
      field: 'bizType',
      title: $t('approval.instance.fields.bizType'),
      minWidth: 140,
    },
    {
      field: 'bizId',
      title: $t('approval.instance.fields.bizId'),
      minWidth: 140,
    },
    {
      field: 'title',
      title: $t('approval.instance.fields.title'),
      minWidth: 180,
      cellRender: {
        name: 'CellLink',
        attrs: {
          hasAccess: canDetail,
          onClick: (row: ApprovalInstanceApi.InstanceItem) => onDetailClick(row),
        },
      },
    },
    {
      field: 'applicantName',
      title: $t('approval.instance.fields.applicantName'),
      minWidth: 120,
      formatter: ({ row }: { row: ApprovalInstanceApi.InstanceItem }) => row.applicantName || '-',
    },
    {
      field: 'status',
      title: $t('common.status'),
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [1, 2, 3, 4].map(value => ({
          color: statusColorMap[value],
          label: $t(`approval.common.instanceStatus.${value}`),
          value,
        })),
      },
    },
    {
      field: 'createdAt',
      title: $t('approval.instance.fields.createdAt'),
      formatter: ({ cellValue }: { cellValue: number }) => formatUnixTime(cellValue),
      width: 160,
    },
  ];
}
