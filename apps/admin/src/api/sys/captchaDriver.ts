import { requestClient } from '#/api/request';

export namespace CaptchaDriverApi {
  export interface SchemaField {
    key: string;
    label: string;
    component: 'Input' | 'InputNumber' | 'Select' | 'Switch';
    default: any;
    options?: { label: string; value: string }[];
  }

  export interface DriverItem {
    id: string;
    type: string;
    label: string;
    isEnabled: boolean;
    isValid: boolean;
    schema: SchemaField[];
    config: Record<string, any>;
    sort: number;
  }

  export interface UpdateParams {
    id: string;
    isEnabled?: boolean;
    config?: Record<string, any>;
    sort?: number;
  }

  export interface WatermarkConfig {
    fontsize: number;
    color: string;
    text: string;
  }
}

export function getCaptchaDriversApi() {
  return requestClient.get<CaptchaDriverApi.DriverItem[]>('/admin/sys/captcha-driver/list');
}

export function updateCaptchaDriverApi(data: CaptchaDriverApi.UpdateParams) {
  return requestClient.put('/admin/sys/captcha-driver/update', data);
}

export function getCaptchaWatermarkApi() {
  return requestClient.get<CaptchaDriverApi.WatermarkConfig>('/admin/sys/captcha-driver/watermark');
}

export function saveCaptchaWatermarkApi(data: Partial<CaptchaDriverApi.WatermarkConfig>) {
  return requestClient.post('/admin/sys/captcha-driver/watermark', data);
}

export function previewCaptchaDriverApi(type: string) {
  return requestClient.get<Record<string, any>>('/admin/sys/captcha-driver/preview', { params: { type } });
}
