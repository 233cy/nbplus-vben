import { requestClient } from '#/api/request';
import { normalizeCodeInput } from '#/utils/format';

export namespace NotificationMessageApi {
  export interface MessageItem {
    id: string;
    bizType: string;
    channel: string;
    channelName: string;
    /** 渠道驱动类型（email/station/sms/dingtalk 等），用于详情按富文本/纯文本渲染 */
    driver?: string;
    sendType: 'user' | 'free';
    batchNo: string;
    target: string;
    contact: string;
    label: string;
    templateCode: string;
    subject: string;
    channelContentRemark?: string;
    content: string;
    variables: Record<string, any>;
    extra: Record<string, any>;
    status: number;
    response: string;
    errorMsg: string;
    ip: string;
    isResend: number;
    parentId: string;
    context: Record<string, any>;
    createdAt: number;
    updatedAt: number;
    deletedAt?: null | number;
  }

  export interface PageParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: number;
    channel?: string;
    sendType?: 'user' | 'free';
    batchNo?: string;
    /** 回收站：only=仅回收站，with=包含回收站，不传=仅正常数据 */
    trashed?: 'only' | 'with';
  }
}

const BASE = '/admin/sys/notification-message';

export function getNotificationMessageListApi(params: NotificationMessageApi.PageParams) {
  if (params.batchNo) {
    params.batchNo = normalizeCodeInput(params.batchNo);
  }
  return requestClient.get<{ items: NotificationMessageApi.MessageItem[]; meta: any }>(`${BASE}/list`, { params });
}

export function getNotificationMessageDetailApi(id: string) {
  return requestClient.get<NotificationMessageApi.MessageItem>(`${BASE}/detail`, { params: { id } });
}

export function resendNotificationMessageApi(id: string) {
  return requestClient.post<NotificationMessageApi.MessageItem>(`${BASE}/resend`, { id });
}
