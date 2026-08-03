import { requestClient } from '#/api/request';

export namespace NotificationSendApi {
  /** 联系方式类型：手机号 / 邮箱 / 站内用户 */
  export type ContactType = 'email' | 'mobile' | 'user';

  /** 可发送渠道选项 */
  export interface ChannelOption {
    channelCode: string;
    channelName: string;
    driver: string;
    driverLabel: string;
    contactType: ContactType;
  }

  /** 手动指定的接收目标 */
  export interface SendContact {
    target: string;
    recipientName?: string;
  }

  export interface SendParams {
    channelCode: string;
    /** contactType 为 mobile/email 时使用 */
    contacts?: SendContact[];
    /** contactType 为 user 时使用 */
    userIds?: string[];
    subject?: string;
    content?: string;
    /** 短信渠道必填：服务商报备的模板号 */
    templateCode?: string;
    /** 短信渠道：模板变量键值对 */
    variables?: Record<string, string>;
  }

  /** 单个目标的投递结果 */
  export interface SendResultItem {
    success: boolean;
    skipped?: boolean;
    skipReason?: string;
    messageId?: string;
    errorMessage?: string;
    rawResponse?: unknown;
  }

  export interface SendResult {
    batchNo: string;
    allSuccess: boolean;
    failureCount: number;
    skippedCount: number;
    results: SendResultItem[];
  }
}

const BASE = '/admin/sys/notification-send';

export function getNotificationSendOptionsApi() {
  return requestClient.get<NotificationSendApi.ChannelOption[]>(`${BASE}/options`);
}

export function sendNotificationSendApi(data: NotificationSendApi.SendParams) {
  return requestClient.post<NotificationSendApi.SendResult>(`${BASE}/send`, data);
}
