import { requestClient } from '#/api/request';

const BASE = '/admin/sys/task';

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
