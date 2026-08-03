import { requestClient } from '#/api/request';

export namespace NotificationInboxApi {
  /** 消息附件（任务产物引用，path 为存储逻辑路径，下载需经预览接口解析） */
  export interface Attachment {
    name: string;
    path: string;
    size?: number;
  }

  export interface MessageExtra {
    attachments?: Attachment[];
  }

  export interface MessageItem {
    id: string;
    userId: string;
    title: string;
    summary: string;
    content: string;
    extra?: MessageExtra;
    isRead: number;
    readAt: number;
    status: number;
    createdAt: number;
    updatedAt: number;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    isRead?: number;
  }
}

const BASE = '/admin/sys/notification-inbox';

export function getNotificationInboxListApi(params: NotificationInboxApi.PageParams) {
  return requestClient.get<{ items: NotificationInboxApi.MessageItem[]; meta: any }>(`${BASE}/list`, { params });
}

export function getNotificationInboxDetailApi(id: string) {
  return requestClient.get<NotificationInboxApi.MessageItem>(`${BASE}/detail`, { params: { id } });
}

export function getNotificationInboxUnreadCountApi() {
  return requestClient.get<{ count: number }>(`${BASE}/unread-count`);
}

export function markNotificationInboxReadApi(id: string) {
  return requestClient.post(`${BASE}/mark-read`, { id });
}

export function markAllNotificationInboxReadApi() {
  return requestClient.post(`${BASE}/mark-all-read`);
}

export function deleteNotificationInboxApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}

export function batchDeleteNotificationInboxApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

export function clearNotificationInboxApi() {
  return requestClient.delete(`${BASE}/clear`);
}
