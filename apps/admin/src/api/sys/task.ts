import { requestClient } from '#/api/request';

const BASE = '/admin/sys/task';

/** 我的任务（个人域，Core/MyTaskController） */
const MY_BASE = '/admin/profile/tasks';

export namespace TaskApi {
  /** 任务状态：1待执行 2执行中 3已完成 4执行失败 5已取消 */
  export type Status = 1 | 2 | 3 | 4 | 5;

  export interface TaskItem {
    id: string;
    type: string;
    name: string;
    status: Status;
    totalCount: number;
    doneCount: number;
    failCount: number;
    retryCount: number;
    error: null | string;
    /** 任务结果（产物 attachments / 部分失败明细 failures，reason 为安全文案） */
    result?: null | {
      attachments?: { name: string; path: string; size?: number }[];
      failures?: { id: string; reason: string }[];
    };
    operatorId: string;
    /** 操作人昵称（后端反显） */
    operatorName?: string;
    startedAt: null | number;
    finishedAt: null | number;
    createdAt: number;
  }

  export interface ListParams {
    keyword?: string;
    page?: number;
    perPage?: number;
    status?: Status;
    type?: string;
  }

  export interface MyListParams {
    keyword?: string;
    page?: number;
    pageSize?: number;
    type?: string;
  }
}

export function getTaskListApi(params: TaskApi.ListParams) {
  return requestClient.get(`${BASE}/list`, { params });
}

export function cancelTaskApi(id: string) {
  return requestClient.post(`${BASE}/cancel`, { id });
}

export function retryTaskApi(id: string) {
  return requestClient.post(`${BASE}/retry`, { id });
}

export function deleteTaskApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}

export function batchDeleteTaskApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

/** 我的任务（进行中面板）：只返回当前用户 待执行+进行中 的任务 */
/** 我的任务（进行中面板）：当前用户 待执行+进行中（status 由调用方注入） */
export function getMyTaskListApi(params: TaskApi.MyListParams) {
  return requestClient.get<{ items: TaskApi.TaskItem[]; meta: { total: number } }>(`${MY_BASE}/list`, {
    params: { ...params, status: [1, 2] },
  });
}

/** 我的任务进行中数量（弹层角标） */
export function getMyTaskCountApi() {
  return requestClient.get<{ count: number }>(`${MY_BASE}/count`);
}

/** 取消自己的任务（仅校验属主） */
export function cancelMyTaskApi(id: string) {
  return requestClient.post(`${MY_BASE}/cancel`, { id });
}

/** 我的任务完整分页（全部状态，供"我的任务"页展示失败明细） */
export function getMyTaskPageApi(params: TaskApi.ListParams) {
  return requestClient.get(`${MY_BASE}/list`, { params });
}

/** 重试自己的任务（仅校验属主，状态机防重复） */
export function retryMyTaskApi(id: string) {
  return requestClient.post(`${MY_BASE}/retry`, { id });
}

/** 删除自己的任务（仅校验属主，仅终态可删） */
export function deleteMyTaskApi(id: string) {
  return requestClient.delete(`${MY_BASE}/delete`, { data: { id } });
}

/** 批量删除自己的任务（仅校验属主，严格模式） */
export function batchDeleteMyTaskApi(ids: string[]) {
  return requestClient.delete(`${MY_BASE}/batch-delete`, { data: { ids } });
}
