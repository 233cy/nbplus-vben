import { requestClient } from '#/api/request';

export namespace uploadApi {
  /** 获取tus文件 */
  export interface getTusFileInfo {
    uploadKey?: string;
  }
  /** 删除OSS文件 */
  export interface deleteOssFile {
    logicalPath?: string;
  }
}

export function getTusUrl() {
  return `${import.meta.env.VITE_API_URL}/upload/tus`;
}

export function getUploadUrl() {
  return `${import.meta.env.VITE_API_URL}/upload/file`;
}

export function getTusFileInfo(data: uploadApi.getTusFileInfo) {
  return requestClient.get(`${import.meta.env.VITE_API_URL}/upload/tus/${data.uploadKey}`);
}

export function deleteOssFile(data: uploadApi.deleteOssFile) {
  return requestClient.delete(`${import.meta.env.VITE_API_URL}/upload/del`, { params: data });
}
