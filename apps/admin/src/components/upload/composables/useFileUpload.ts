import type { TusBody } from '@uppy/tus';

import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { message } from 'ant-design-vue';

import { getTusFileInfo, getTusUrl, uploadFileApi } from '#/api/core/upload';
import { useSiteStore } from '#/store/site';

/** 分片阈值/切片大小的兜底默认值（MB），系统参数缺失时使用 */
const DEFAULT_CHUNK_THRESHOLD_MB = 5;
const DEFAULT_CHUNK_SIZE_MB = 5;
/** 单文件最大体积兜底默认值（MB），系统参数缺失时使用 */
const DEFAULT_UPLOAD_MAX_SIZE_MB = 100;

/** 把系统参数字符串安全转为正数，非法则用兜底值 */
function toPositiveNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * 单文件最大允许体积（MB）。
 * 取自系统参数 storage.upload_max_size，缺失时兜底 {@link DEFAULT_UPLOAD_MAX_SIZE_MB}。
 */
export function getUploadMaxSizeMB(): number {
  return toPositiveNumber(useSiteStore().get('storage.upload_max_size'), DEFAULT_UPLOAD_MAX_SIZE_MB);
}

/**
 * 允许上传的扩展名白名单（小写，去重）。
 * 合并系统参数 storage.allowed_image_types、storage.allowed_file_types 与 storage.allowed_media_types（音视频）。
 * 三项均为空时返回空数组，表示不做前端类型限制（仍由后端兜底校验）。
 */
export function getAllowedExtensions(): string[] {
  const store = useSiteStore();
  const raw = `${store.get('storage.allowed_image_types')},${store.get('storage.allowed_file_types')},${store.get('storage.allowed_media_types')}`;
  const exts = raw
    .split(',')
    .map(ext => ext.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
  return [...new Set(exts)];
}

/**
 * 允许上传的文件扩展名白名单（小写，去重）。
 * 仅取系统参数 storage.allowed_file_types，供文件上传组件直接复用。
 * 为空时返回空数组，表示不做前端类型限制（仍由后端兜底校验）。
 */
export function getAllowedFileExtensions(): string[] {
  const raw = useSiteStore().get('storage.allowed_file_types') ?? '';
  const exts = raw
    .split(',')
    .map(ext => ext.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
  return [...new Set(exts)];
}

/** 提取文件扩展名（小写，不含点） */
export function getFileExt(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? '' : filename.slice(idx + 1).toLowerCase();
}

/**
 * 允许上传的音视频扩展名白名单（小写，去重）。
 * 仅取系统参数 storage.allowed_media_types，供媒体上传组件直接复用，无需手动维护。
 * 为空时返回空数组，表示不做前端类型限制（仍由后端兜底校验）。
 */
export function getAllowedMediaExtensions(): string[] {
  const raw = useSiteStore().get('storage.allowed_media_types') ?? '';
  const exts = raw
    .split(',')
    .map(ext => ext.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
  return [...new Set(exts)];
}

/**
 * 允许上传的图片扩展名白名单（小写，去重）。
 * 仅取系统参数 storage.allowed_image_types，供图片 / 头像上传组件直接复用。
 * 为空时返回空数组，表示不做前端类型限制（仍由后端兜底校验）。
 */
export function getAllowedImageExtensions(): string[] {
  const raw = useSiteStore().get('storage.allowed_image_types') ?? '';
  const exts = raw
    .split(',')
    .map(ext => ext.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
  return [...new Set(exts)];
}

/**
 * 基于系统参数的通用前端预校验：体积 + 扩展名白名单。
 * 与后端 storage.* 兜底校验保持一致，超限即时反馈、避免发起注定失败的上传。
 *
 * @param file        待校验文件
 * @param maxSizeMB   组件级更严格的体积上限（MB），与系统上限取较小值；不传则只用系统上限
 * @returns 失败原因（已本地化）；通过校验返回空字符串
 */
export function validateFileBySystem(file: File, maxSizeMB?: number): string {
  const systemMax = getUploadMaxSizeMB();
  const effectiveMax = maxSizeMB && maxSizeMB > 0 ? Math.min(maxSizeMB, systemMax) : systemMax;
  if (file.size > effectiveMax * 1024 * 1024) {
    return $t('upload.errFileTooLarge', { maxSize: effectiveMax });
  }

  const allowed = getAllowedExtensions();
  const ext = getFileExt(file.name);
  if (allowed.length > 0 && (!ext || !allowed.includes(ext))) {
    return $t('upload.errExtNotAllowed', { ext });
  }

  return '';
}

/** 从 TUS 错误信息里抠出 HTTP 状态码（TUS 响应体多为空，只能靠 message） */
function extractStatusFromError(error: any): number | undefined {
  const m = /response code:\s*(\d+)/i.exec(String(error?.message ?? ''));
  return m ? Number(m[1]) : undefined;
}

/** 尝试从字符串响应体里解析后端 JSON 的 message */
function safeJsonMessage(text: string): string {
  try {
    return JSON.parse(text)?.message ?? '';
  } catch {
    return '';
  }
}

/**
 * 把上传错误解析为用户可读的中文失败原因。
 * 优先后端 JSON message（XHR 直传），其次 HTTP 状态码映射（TUS 超限多为空响应体的 413），最后兜底。
 */
export function resolveUploadErrorMsg(error: any, response?: any): string {
  const body = response?.body;
  if (body) {
    const msg = typeof body === 'string' ? safeJsonMessage(body) : body?.message;
    if (msg) return msg;
  }

  const status = response?.status ?? extractStatusFromError(error);
  if (status === 413) {
    return $t('upload.errFileTooLarge', { maxSize: getUploadMaxSizeMB() });
  }
  if (status === 401 || status === 403) {
    return $t('upload.errNoPermission');
  }

  return error?.message || $t('upload.errUnknown');
}

/**
 * 分片上传阈值（MB）：文件超过该大小走 TUS 断点续传。
 * 取自系统参数 storage.chunk_threshold_mb，缺失时兜底 {@link DEFAULT_CHUNK_THRESHOLD_MB}。
 */
export function getChunkThresholdMB(): number {
  return toPositiveNumber(useSiteStore().get('storage.chunk_threshold_mb'), DEFAULT_CHUNK_THRESHOLD_MB);
}

/**
 * TUS 每个切片大小（MB）。
 * 取自系统参数 storage.chunk_size_mb，缺失时兜底 {@link DEFAULT_CHUNK_SIZE_MB}。
 */
export function getChunkSizeMB(): number {
  return toPositiveNumber(useSiteStore().get('storage.chunk_size_mb'), DEFAULT_CHUNK_SIZE_MB);
}

export interface UploadOptions {
  /** 访问类型：authorized | public | login，默认 public */
  accessType?: 'authorized' | 'login' | 'public';
  /** 访问策略：owner | public | login，为空时按 accessType 默认 */
  accessPolicy?: 'login' | 'owner' | 'public';
  /** 大小阈值（MB），超过则走 TUS 断点续传；不传则读系统参数 storage.chunk_threshold_mb */
  thresholdMB?: number;
}

/** 从 accessType 推算实际的访问类型 */
export function resolveAccessType(options: UploadOptions): string {
  return options.accessType ?? 'public';
}

/** 从 accessPolicy 推算实际的访问策略 */
export function resolveAccessPolicy(options: UploadOptions): string {
  return options.accessPolicy ?? 'public';
}

/** 动态获取认证头，解决 Uppy 绕过 requestClient 导致 401 的问题 */
function getAuthHeaders(): Record<string, string> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface UploadResult {
  fullUrl: string;
  logicalPath: string;
}

/** 普通 XHR 上传，适合小文件 */
async function uploadWithXhr(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const res = await uploadFileApi(file, resolveAccessType(options), resolveAccessPolicy(options));
  return {
    logicalPath: res.logicalPath,
    fullUrl: res.fullUrl,
  };
}

/** TUS 断点续传，适合大文件 */
function uploadWithTus(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uppy = new Uppy<Record<string, unknown>, TusBody>({
      autoProceed: true,
      allowMultipleUploadBatches: true,
    }).use(Tus, {
      endpoint: getTusUrl(),
      chunkSize: getChunkSizeMB() * 1024 * 1024,
      retryDelays: [1000, 3000],
      removeFingerprintOnSuccess: true,
      headers: getAuthHeaders,
    });

    uppy.addFile({
      name: file.name,
      type: file.type,
      data: file,
      meta: {
        accessType: resolveAccessType(options),
        accessPolicy: resolveAccessPolicy(options),
      },
    });

    uppy.on('upload-success', async (_file, response: any) => {
      try {
        const tusUrl = response?.uploadURL;
        if (!tusUrl) throw new Error('no uploadURL');
        const fileId = tusUrl.split('/').pop();
        if (!fileId) throw new Error('no fileId');
        const infoRes: any = await getTusFileInfo({ uploadKey: fileId });
        resolve({ logicalPath: infoRes.logicalPath, fullUrl: infoRes.fullUrl });
      } catch (error) {
        reject(error);
      } finally {
        uppy.destroy();
      }
    });

    uppy.on('upload-error', (_file, error, response) => {
      uppy.destroy();
      // TUS 绕过 requestClient，错误不会被全局拦截器弹出，这里统一解析原因并提示
      const reason = resolveUploadErrorMsg(error, response);
      message.error(reason);
      reject(new Error(reason));
    });
  });
}

/** 根据文件大小自动选择 XHR 或 TUS 上传 */
async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const thresholdMB = options.thresholdMB ?? getChunkThresholdMB();
  const isBig = file.size > thresholdMB * 1024 * 1024;
  return isBig ? uploadWithTus(file, options) : uploadWithXhr(file, options);
}

export function useFileUpload() {
  return {
    getAuthHeaders,
    resolveAccessPolicy,
    resolveAccessType,
    uploadFile,
    uploadWithTus,
    uploadWithXhr,
  };
}
