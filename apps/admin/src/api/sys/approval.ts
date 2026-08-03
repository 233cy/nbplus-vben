import type { ApprovalInstanceApi } from '#/api/sys/approvalInstance';

import { requestClient } from '#/api/request';

export namespace ApprovalApi {
  /** 待审任务（我的待办视角） */
  export interface TodoItem {
    taskId: string;
    instanceId: string;
    bizType: string;
    bizId: string;
    title: string;
    applicantId: string;
    applicantName: string;
    /** 当前节点序号 */
    seq: number;
    nodeName: string;
    createdAt: number;
  }

  /** 已办任务（我的操作视角） */
  export interface DoneItem {
    taskId: string;
    instanceId: string;
    bizType: string;
    bizId: string;
    title: string;
    applicantId: string;
    applicantName: string;
    seq: number;
    nodeName: string;
    /** 我的操作结果：2通过 3驳回 */
    status: number;
    /** 我的审批意见 */
    comment?: string;
    createdAt: number;
    finishedAt?: number;
  }

  /** 我发起的实例 */
  export interface MineItem {
    id: string;
    bizType: string;
    bizId: string;
    title: string;
    /** 状态：1审批中 2通过 3驳回 4撤销 */
    status: number;
    createdAt: number;
    finishedAt?: number;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
  }

  export interface MinePageParams extends PageParams {
    bizType?: string;
  }

  export interface SubmitParams {
    bizType: string;
    bizId: string;
    title: string;
    /** 表单快照（业务自定义键值） */
    snapshot: Record<string, any>;
    /** 自选审批人：key 为节点序号 seq，值为用户 ID 数组 */
    selectedApprovers?: Record<string, string[]>;
    /** 发起人自选抄送人：用户 ID 数组（仅抄送节点开启 allowSelfSelect 时生效） */
    selectedCc?: string[];
    /** 业务方回调 RPC 服务名（Nacos 注册名，空=不回调） */
    callbackService?: string;
  }
}

const BASE = '/admin/sys/approval';

export function getTodoListApi(params: ApprovalApi.PageParams) {
  return requestClient.get<{ items: ApprovalApi.TodoItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/todo`, { params });
}

export function getDoneListApi(params: ApprovalApi.PageParams) {
  return requestClient.get<{ items: ApprovalApi.DoneItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/done`, { params });
}

export function getMineListApi(params: ApprovalApi.MinePageParams) {
  return requestClient.get<{ items: ApprovalApi.MineItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/mine`, { params });
}

/** 发起审批 */
export function submitApprovalApi(data: ApprovalApi.SubmitParams) {
  return requestClient.post(`${BASE}/submit`, data);
}

/** 撤销审批（申请人本人，审批中才可撤销） */
export function cancelApprovalApi(bizType: string, bizId: string) {
  return requestClient.post(`${BASE}/cancel`, { bizType, bizId });
}

/** 通过任务 */
export function approveTaskApi(taskId: string, comment?: string) {
  return requestClient.post(`${BASE}/approve`, { taskId, comment });
}

/** 驳回任务（意见必填） */
export function rejectTaskApi(taskId: string, comment: string) {
  return requestClient.post(`${BASE}/reject`, { taskId, comment });
}

/** 按业务单据查询实例详情（实例 + tasks） */
export function getApprovalDetailByBizApi(bizType: string, bizId: string) {
  return requestClient.get<ApprovalInstanceApi.InstanceDetail>(`${BASE}/detail-by-biz`, { params: { bizType, bizId } });
}
