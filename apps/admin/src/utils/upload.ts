import { pathToFullUrlApi } from '#/api/core/upload';

/**
 * 将单个逻辑路径（logicalPath）转换为完整访问 URL（fullUrl）。
 *
 * 使用场景：后端返回的 avatar、附件等字段存储的是 logicalPath（如 public://2025-03-21/xxx.jpg），
 * 需要转换为可直接用于 <img src> 的 HTTP URL 时调用此方法。
 *
 * @example
 * const url = await pathToFullUrl('public://2025-03-21/xxx.jpg')
 * // => 'https://cdn.example.com/public/2025-03-21/xxx.jpg'
 *
 * @param logicalPath 逻辑路径，为空时直接返回空字符串
 * @returns 完整访问 URL，转换失败时返回空字符串
 */
export async function pathToFullUrl(logicalPath: null | string | undefined): Promise<string> {
  if (!logicalPath) return '';
  try {
    const map = await pathToFullUrlApi(logicalPath);
    return map[logicalPath] ?? '';
  } catch {
    return '';
  }
}

/**
 * 批量将逻辑路径转换为完整访问 URL，返回 { logicalPath: fullUrl } 的 map。
 *
 * @example
 * const map = await pathsToFullUrlMap(['public://a.jpg', 'public://b.jpg'])
 * // => { 'public://a.jpg': 'https://...', 'public://b.jpg': 'https://...' }
 *
 * @param logicalPaths 逻辑路径数组，会自动过滤空值
 * @returns logicalPath → fullUrl 的映射表
 */
export async function pathsToFullUrlMap(logicalPaths: (null | string | undefined)[]): Promise<Record<string, string>> {
  const valid = logicalPaths.filter(Boolean) as string[];
  if (valid.length === 0) return {};
  try {
    return await pathToFullUrlApi(valid);
  } catch {
    return {};
  }
}
