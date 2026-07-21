import { useAppConfig } from '@vben/hooks';

import { requestClient } from '#/api/request';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

export namespace uploadType {
  /** 获取tus文件 */
  export interface getTusFileInfo {
    fileId?: string;
  }
  /** 删除OSS文件 */
  export interface deleteOssFile {
    logicalPath?: string;
  }
  /** 逻辑路径转访问URL */
  export interface resolveLogicalPath {
    fullUrl: string;
    logicalPath: string;
  }
  /** 秒传预检 */
  export interface rapidCheck {
    hash: string;
    sizeByte: number;
    originalName: string;
    accessType: string;
    accessPolicy?: string;
  }
  /** 秒传复制 */
  export interface rapidCopy {
    hash: string;
    sizeByte: number;
    originalName: string;
    accessType: string;
    accessPolicy?: string;
  }
}

/**
 * 返回 TUS 上传的完整 URL（含 API 前缀）。
 * 注意：此 URL 用于 Uppy Tus 插件直发请求，不走 requestClient，
 * 因此必须包含完整前缀。
 */
export function getTusUrl() {
  return `${apiURL}/admin/upload/tus`;
}

/**
 * 返回普通上传的完整 URL（含 API 前缀）。
 * 注意：此 URL 用于 Uppy XHRUpload 插件直发请求，不走 requestClient，
 * 因此必须包含完整前缀。
 * 如果是 requestClient 调用，请直接使用路径 '/admin/upload/file'。
 */
export function getUploadUrl() {
  return `${apiURL}/admin/upload/file`;
}

/**
 * 普通 POST 上传文件
 * @param file    文件对象
 * @param accessType  访问类型 (authorized|public|login)，默认 public
 * @param accessPolicy  访问策略 (owner|public|login)，可选
 * @param config  透传给请求客户端的配置（如 AbortSignal 取消、onUploadProgress 进度）
 */
export function uploadFileApi(file: Blob | File, accessType = 'public', accessPolicy?: string, config?: { onUploadProgress?: (e: any) => void; signal?: AbortSignal }) {
  return requestClient.upload<{
    accessType: string;
    extension: string;
    fullUrl: string;
    id: string;
    logicalPath: string;
    mimeType: string;
    originalName: string;
    sizeByte: string;
  }>('/admin/upload/file', { file, accessType, ...(accessPolicy ? { accessPolicy } : {}) }, config);
}

export function getTusFileInfo(data: uploadType.getTusFileInfo) {
  return requestClient.get(`/admin/upload/tus/${data.fileId}`);
}

export function deleteOssFile(data: uploadType.deleteOssFile) {
  return requestClient.delete(`/admin/upload/delete`, { params: data });
}

/**
 * 秒传预检：根据 hash + sizeByte 查询后端是否已有相同文件。
 */
export function rapidCheck(data: uploadType.rapidCheck) {
  return requestClient.post<{
    fullUrl?: string;
    hit: boolean;
    logicalPath?: string;
  }>('/admin/upload/rapid-check', data);
}

/**
 * 秒传复制：命中后调用后端复制生成独立的新文件记录。
 */
export function rapidCopy(data: uploadType.rapidCopy) {
  return requestClient.post<{
    fullUrl: string;
    logicalPath: string;
  }>('/admin/upload/rapid-copy', data);
}

/**
 * 将单个逻辑路径转换为完整访问 URL.
 *
 * @param logicalPath 逻辑路径，如 public://2026-03/abc.png，为空直接返回 ''
 * @returns 完整访问 URL
 */
export async function resolveLogicalPath(logicalPath: null | string | undefined): Promise<string> {
  if (!logicalPath) return '';
  try {
    const res = await requestClient.get<{ fullUrl: string }>('/admin/upload/resolve', {
      params: { logicalPath },
    });
    return res.fullUrl ?? '';
  } catch {
    return '';
  }
}

/**
 * 批量将逻辑路径转换为完整访问 URL，返回 { logicalPath: fullUrl } 的 map.
 *
 * 兼容三种入参格式：
 *   - 数组：['public://a.jpg', 'public://b.jpg']
 *   - 逗号分隔字符串：'public://a.jpg,public://b.jpg'
 *   - 单个路径字符串：'public://a.jpg'（自动转为单元素数组）
 *
 * @param logicalPaths 逻辑路径，为空直接返回 {}
 * @returns logicalPath → fullUrl 映射表
 */
export async function resolveLogicalPaths(logicalPaths: null | string | string[] | undefined): Promise<Record<string, string>> {
  // 统一归一化为数组
  const paths: string[] = (() => {
    if (!logicalPaths) return [];
    if (Array.isArray(logicalPaths)) {
      return logicalPaths.filter(Boolean) as string[];
    }
    return String(logicalPaths)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  })();

  if (paths.length === 0) return {};
  try {
    const res = await requestClient.post<Array<{ fullUrl: string; logicalPath: string }>>('/admin/upload/batch-resolve', {
      logicalPaths: paths,
    });
    const map: Record<string, string> = {};
    for (const item of res) {
      map[item.logicalPath] = item.fullUrl ?? '';
    }
    return map;
  } catch {
    return {};
  }
}
