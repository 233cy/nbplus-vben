import { requestClient } from '#/api/request';

export namespace ApprovalInstanceApi {
  export interface InstanceItem {
    id: string;
    /** 业务类型标识 */
    bizType: string;
    /** 业务单据 ID */
    bizId: string;
    /** 实例标题 */
    title: string;
    /** 申请人 ID */
    applicantId: string;
    /** 申请人姓名 */
    applicantName: string;
    /** 状态：1审批中 2通过 3驳回 4撤销 */
    status: number;
    createdAt: number;
    updatedAt?: number;
    finishedAt?: number;
  }

  export interface TaskItem {
    id: string;
    /** 节点序号 */
    seq: number;
    /** 节点名称 */
    nodeName: string;
    /** 审批人 ID */
    approverId: string;
    /** 审批人姓名 */
    approverName: string;
    /** 状态：1待审 2通过 3驳回 4跳过 */
    status: number;
    /** 审批意见 */
    comment?: string;
    createdAt?: number;
    finishedAt?: number;
  }

  /** 详情：实例 + 任务数组 */
  export interface InstanceDetail extends InstanceItem {
    /** 发起时的表单快照 */
    snapshot?: Record<string, any>;
    tasks: TaskItem[];
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    bizType?: string;
    status?: number | string;
    keyword?: string;
  }
}

const BASE = '/admin/sys/approval-instance';

export function getApprovalInstanceListApi(params: ApprovalInstanceApi.PageParams) {
  return requestClient.get<{ items: ApprovalInstanceApi.InstanceItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/list`, { params });
}

export function getApprovalInstanceDetailApi(id: string) {
  return requestClient.get<ApprovalInstanceApi.InstanceDetail>(`${BASE}/detail`, { params: { id } });
}
