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
}

export function getTusUrl() {
  return `/upload/tus`;
}

export function getUploadUrl() {
  return `/upload/file`;
}

export function getTusFileInfo(data: uploadType.getTusFileInfo) {
  return requestClient.get(`/upload/tus/${data.uploadKey}`);
}

export function deleteOssFile(data: uploadType.deleteOssFile) {
  return requestClient.delete(`/upload/del`, { params: data });
}
