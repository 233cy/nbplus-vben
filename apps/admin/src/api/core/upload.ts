import { requestClient } from '#/api/request';

export namespace uploadType {
  /** 获取tus文件 */
  export interface getTusFileInfo {
    uploadKey?: string;
  }
  /** 删除OSS文件 */
  export interface deleteOssFile {
    logicalPath?: string;
  }
  /** 逻辑路径转访问URL */
  export interface pathToFullUrl {
    logicalPath: string;
  }
}

export function getTusUrl() {
  return `/admin/upload/tus`;
}

export function getUploadUrl() {
  return `/admin/upload/file`;
}

export function getTusFileInfo(data: uploadType.getTusFileInfo) {
  return requestClient.get(`/admin/upload/tus/${data.uploadKey}`);
}

export function deleteOssFile(data: uploadType.deleteOssFile) {
  return requestClient.delete(`/admin/upload/del`, { params: data });
}

/**
 * 将逻辑路径转换为完整访问 URL
 * 支持逗号分隔的多个路径，返回 { logicalPath: fullUrl } 的 map
 */
export function pathToFullUrlApi(logicalPath: string | string[]) {
  const paths = Array.isArray(logicalPath) ? logicalPath.join(',') : logicalPath;
  return requestClient.get<Record<string, string>>('/admin/upload/pathToFullUrl', {
    params: { logicalPath: paths },
  });
}
