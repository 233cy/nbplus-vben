import { requestClient } from '#/api/request';

export namespace ApprovalFlowApi {
  /**
   * 审批流表单字段定义（条件构建器的数据源）
   */
  export interface FlowField {
    name: string;
    label: string;
    type: 'enum' | 'number' | 'string';
    options?: string[];
    [key: string]: any;
  }

  /**
   * 审批流节点（递归结构：approver 审批人节点 / branch 条件分支节点 / cc 抄送节点，
   * 具体结构由流程设计器维护，列表页不消费内部细节）
   *
   * v2 契约要点：
   * - approver.param：users → { userIds }；duty → { dutyIds }；
   *   supervisor → {}；self_select → { multiple: boolean }；存量 role/post 仅回显
   * - cc：{ name, ccUserIds: string[], allowSelfSelect: boolean, childNode }
   */
  export interface FlowNode {
    type: 'approver' | 'branch' | 'cc';
    name: string;
    childNode?: FlowNode | null;
    [key: string]: any;
  }

  /**
   * 发起人范围：all 或全空 = 所有人，否则 人员/角色/职务/部门 取并集（部门含子部门）
   */
  export interface InitiatorScope {
    all: boolean;
    userIds: string[];
    /** 角色 code 数组 */
    roleCodes: string[];
    dutyIds: string[];
    deptIds: string[];
  }

  export interface FlowItem {
    id: string;
    /** 业务类型标识 */
    bizType: string;
    /** 流程名称 */
    name: string;
    /** 状态：1启用 2停用 */
    status: number;
    remark?: string;
    fields?: FlowField[];
    nodes?: FlowNode;
    /** 发起人范围 */
    initiatorScope?: InitiatorScope;
    /** 回调 RPC 服务名（Nacos 注册名，空=不回调） */
    callbackService?: string;
    createdAt?: number;
    updatedAt?: number;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: number | string;
  }

  export interface SaveParams {
    id?: string;
    bizType: string;
    name: string;
    fields: FlowField[];
    nodes: FlowNode;
    /** 发起人范围 */
    initiatorScope?: InitiatorScope;
    /** 回调 RPC 服务名（Nacos 注册名，空=不回调） */
    callbackService?: string;
    status: number;
    remark?: string;
  }
}

const BASE = '/admin/sys/approval-flow';

export function getApprovalFlowListApi(params: ApprovalFlowApi.PageParams) {
  return requestClient.get<{ items: ApprovalFlowApi.FlowItem[]; meta: { currentPage: number; perPage: number; total: number } }>(`${BASE}/list`, { params });
}

export function getApprovalFlowDetailApi(id: string) {
  return requestClient.get<ApprovalFlowApi.FlowItem>(`${BASE}/detail`, { params: { id } });
}

export function saveApprovalFlowApi(data: ApprovalFlowApi.SaveParams) {
  return requestClient.post<ApprovalFlowApi.FlowItem>(`${BASE}/save`, data);
}

/** 启用/停用流程：status 1启用 2停用 */
export function setApprovalFlowStatusApi(id: string, status: number) {
  return requestClient.put(`${BASE}/status`, { id, status });
}
