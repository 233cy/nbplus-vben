import { requestClient } from '#/api/request';

export namespace NotificationTemplateApi {
  export interface TemplateItem {
    id: string;
    templateId: string;
    channelType: string;
    remark: string;
    subject: string;
    summary: string;
    content: string;
    extra: Record<string, any>;
    status: number;
    createdAt: number;
    updatedAt: number;
  }

  export interface TemplateItemSave {
    channelType: string;
    remark?: string;
    subject?: string;
    summary?: string;
    content?: string;
    extra?: Record<string, any>;
    status?: number;
  }

  export interface Template {
    id: string;
    code: string;
    name: string;
    bizType: string;
    variables: Record<string, string>;
    remark: string;
    status: number;
    sort: number;
    createdAt: number;
    updatedAt: number;
    items: TemplateItem[];
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: number;
  }

  export interface SaveParams {
    code?: string;
    name: string;
    bizType?: string;
    variables?: Record<string, string>;
    remark?: string;
    status?: number;
    sort?: number;
    items?: TemplateItemSave[];
  }

  export interface TestSendParams {
    templateCode: string;
    userIds: string[];
    channelType?: string;
    variables?: Record<string, any>;
  }

  export interface TestSendResult {
    allSuccess: boolean;
    failureCount: number;
    skippedCount: number;
    results: Array<{
      errorMessage: string;
      messageId: string;
      rawResponse: Record<string, any>;
      skipped?: boolean;
      skipReason?: string;
      success: boolean;
    }>;
    skipped: string[];
  }
}

const BASE = '/admin/sys/notification-template';

export function getNotificationTemplateListApi(params: NotificationTemplateApi.PageParams) {
  return requestClient.get<{ items: NotificationTemplateApi.Template[]; meta: any }>(`${BASE}/list`, { params });
}

export function getNotificationTemplateOptionsApi() {
  return requestClient.get<NotificationTemplateApi.Template[]>(`${BASE}/options`);
}

export function getNotificationTemplateDetailApi(id: string) {
  return requestClient.get<NotificationTemplateApi.Template>(`${BASE}/detail`, { params: { id } });
}

export function createNotificationTemplateApi(data: NotificationTemplateApi.SaveParams) {
  return requestClient.post<NotificationTemplateApi.Template>(`${BASE}/create`, data);
}

export function updateNotificationTemplateApi(data: Partial<NotificationTemplateApi.SaveParams> & { id: string }) {
  return requestClient.put<NotificationTemplateApi.Template>(`${BASE}/update`, data);
}

export function deleteNotificationTemplateApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}

export function batchDeleteNotificationTemplateApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

export function batchUpdateNotificationTemplateApi(ids: string[], fieldName: string, value: any) {
  return requestClient.put(`${BASE}/batch-update`, { ids, [fieldName]: value });
}

export function testSendNotificationTemplateApi(data: NotificationTemplateApi.TestSendParams) {
  return requestClient.post<NotificationTemplateApi.TestSendResult>(`${BASE}/test-send`, data);
}
