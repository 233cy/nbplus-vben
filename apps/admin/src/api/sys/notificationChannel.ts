import { requestClient } from '#/api/request';

export namespace NotificationChannelApi {
  export interface SchemaField {
    key: string;
    label: string;
    component: 'Input' | 'InputPassword' | 'InputNumber' | 'Select' | 'Switch' | 'Textarea' | 'SmsGatewayConfigForm';
    default?: any;
    placeholder?: string;
    options?: { label: string; value: string }[];
    description?: string;
    required?: boolean;
    gatewaySchemas?: Record<string, SchemaField[]>;
  }

  export interface DriverSchema {
    code: string;
    label: string;
    schema: SchemaField[];
  }

  export interface ChannelItem {
    id: string;
    code: string;
    name: string;
    driver: string;
    config: Record<string, any>;
    status: number;
    sort: number;
    isDefault: number;
    createdAt: number;
    updatedAt: number;
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
    driver: string;
    config?: Record<string, any>;
    status?: number;
    sort?: number;
    isDefault?: number;
  }

}

const BASE = '/admin/sys/notification-channel';

export function getNotificationChannelListApi(params: NotificationChannelApi.PageParams) {
  return requestClient.get<{ items: NotificationChannelApi.ChannelItem[]; meta: any }>(`${BASE}/list`, { params });
}

export function getNotificationChannelOptionsApi() {
  return requestClient.get<NotificationChannelApi.ChannelItem[]>(`${BASE}/options`);
}

export function getNotificationChannelDriverSchemasApi() {
  return requestClient.get<NotificationChannelApi.DriverSchema[]>(`${BASE}/driver-schemas`);
}

export function getNotificationChannelDetailApi(id: string) {
  return requestClient.get<NotificationChannelApi.ChannelItem>(`${BASE}/detail`, { params: { id } });
}

export function createNotificationChannelApi(data: NotificationChannelApi.SaveParams) {
  return requestClient.post<NotificationChannelApi.ChannelItem>(`${BASE}/create`, data);
}

export function updateNotificationChannelApi(data: Partial<NotificationChannelApi.SaveParams> & { id: string }) {
  return requestClient.put<NotificationChannelApi.ChannelItem>(`${BASE}/update`, data);
}

export function deleteNotificationChannelApi(id: string) {
  return requestClient.delete(`${BASE}/delete`, { data: { id } });
}

export function batchDeleteNotificationChannelApi(ids: string[]) {
  return requestClient.delete(`${BASE}/batch-delete`, { data: { ids } });
}

export function batchUpdateNotificationChannelApi(ids: string[], fieldName: string, value: any) {
  return requestClient.put(`${BASE}/batch-update`, { ids, [fieldName]: value });
}
