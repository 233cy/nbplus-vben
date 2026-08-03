import SparkMD5 from 'spark-md5';

import { rapidCheck, rapidCopy } from '#/api/core/upload';
import { useSiteStore } from '#/store/site';

export interface HashJob {
  abort: () => void;
  promise: Promise<string>;
}

export interface FastCheckResult {
  fullUrl?: string;
  hit: boolean;
  logicalPath?: string;
}

/**
 * 在主线程中增量计算文件完整 MD5。
 * 每处理完一个 2MB 分片通过 setTimeout 让出主线程，避免长时间阻塞 UI。
 * @param file 待计算文件
 * @param onProgress 进度回调（0-100）
 */
export function computeHash(file: File, onProgress?: (percent: number) => void): HashJob {
  let aborted = false;
  const CHUNK_SIZE = 2 * 1024 * 1024;

  const promise = new Promise<string>((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    let cursor = 0;

    const readNext = () => {
      if (aborted) {
        reject(new Error('cancelled'));
        return;
      }

      if (cursor >= file.size) {
        resolve(spark.end());
        return;
      }

      const end = Math.min(cursor + CHUNK_SIZE, file.size);
      const chunk = file.slice(cursor, end);
      const reader = new FileReader();

      reader.addEventListener('load', event => {
        if (aborted) {
          reject(new Error('cancelled'));
          return;
        }

        const buffer = event.target?.result;
        if (!(buffer instanceof ArrayBuffer)) {
          reject(new Error('读取文件片段失败'));
          return;
        }

        spark.append(buffer);
        cursor = end;
        onProgress?.(Math.floor((cursor / file.size) * 100));

        // 让出主线程，避免大文件校验时 UI 卡顿
        setTimeout(readNext, 0);
      });

      reader.onerror = () => {
        reject(new Error(reader.error?.message || '文件读取失败'));
      };

      reader.readAsArrayBuffer(chunk);
    };

    readNext();
  });

  const abort = () => {
    aborted = true;
  };

  return { abort, promise };
}

/**
 * 秒传预检：根据 hash + sizeByte 查询后端是否已有相同文件。
 */
export async function fastCheck(params: { accessPolicy?: string; accessType: string; hash: string; originalName: string; sizeByte: number }): Promise<FastCheckResult> {
  return rapidCheck({
    ...params,
    sizeByte: Math.floor(params.sizeByte),
  });
}

/**
 * 秒传复制：命中后调用后端复制生成独立的新文件记录。
 */
export async function fastCopy(params: {
  accessPolicy?: string;
  accessType: string;
  hash: string;
  originalName: string;
  sizeByte: number;
}): Promise<{ fullUrl: string; logicalPath: string }> {
  return rapidCopy({
    ...params,
    sizeByte: Math.floor(params.sizeByte),
  });
}

/**
 * 秒传触发阈值（MB）。
 * 读取系统参数 storage.upload_sec，非法或缺失时默认 10；
 * 返回 0 表示秒传被关闭。
 */
export function getUploadSecMB(): number {
  const raw = useSiteStore().get('storage.upload_sec', '10');
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 10;
}

/**
 * 是否达到秒传大小阈值。
 */
export function isFastUploadSizeMatch(sizeByte: number): boolean {
  return sizeByte >= getUploadSecMB() * 1024 * 1024;
}
