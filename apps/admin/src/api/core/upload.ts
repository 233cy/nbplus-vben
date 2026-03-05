import { requestClient } from '#/api/request';

export namespace uploadApi {
  /** 获取tus文件 */
  export interface getTusFileInfo {
    fileId?: string;
  }
}

export function getTusUrl() {
  return `${import.meta.env.VITE_API_URL}/upload/tus`;
}

export function getUploadUrl() {
  return `${import.meta.env.VITE_API_URL}/upload/tus`;
}

export function getTusFileInfo(data: uploadApi.getTusFileInfo){
  return requestClient.get(`${import.meta.env.VITE_API_URL}/upload/tus/getInfo`, { params: data });
}
