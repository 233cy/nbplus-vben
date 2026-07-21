/**
 * 通用显示格式化工具
 *
 * 与后端原始值解耦：搜索/过滤仍使用原始值，仅在展示层做可读性处理。
 */

export interface FormatCodeOptions {
  /** 每组字符数 */
  groupSize?: number;
  /** 分隔符 */
  separator?: string;
  /** 空值回退 */
  fallback?: string;
}

/**
 * 将连续字符串按固定位数分组展示，提升可读性。
 *
 * @example
 * formatCode('NB7A3K9P')      // 'NB7A-3K9P'
 * formatCode('MSG217F5')      // 'MSG2-17F5'
 * formatCode('MSG217F5', { groupSize: 3 }) // 'MSG-217-F5'
 * formatCode('')              // '-'
 */
export function formatCode(
  value: null | number | string | undefined,
  options: FormatCodeOptions = {},
): string {
  const { groupSize = 4, separator = '-', fallback = '-' } = options;
  const str = String(value ?? '').trim();

  if (str === '') {
    return fallback;
  }

  const parts: string[] = [];
  for (let i = 0; i < str.length; i += groupSize) {
    parts.push(str.slice(i, i + groupSize));
  }

  return parts.join(separator);
}

/**
 * 去除业务编码中的展示分隔符，还原为原始值。
 *
 * 用于搜索框：用户可能复制格式化后的编码（如 NB7A-3K9P），
 * 提交查询前自动去掉 '-'、'_'、空格 等字符。
 *
 * @example
 * normalizeCodeInput('NB7A-3K9P') // 'NB7A3K9P'
 * normalizeCodeInput('MSG2 17F5') // 'MSG217F5'
 */
export function normalizeCodeInput(
  value: null | number | string | undefined,
): string {
  return String(value ?? '')
    .replace(/[-_\s]/g, '')
    .trim()
    .toUpperCase();
}
