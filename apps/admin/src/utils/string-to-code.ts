import { pinyin } from 'pinyin-pro';

export type CodeMode = 'full' | 'simple';

export interface StringToCodeOptions {
  /** 转换模式：full 全拼，simple 简拼（首字母） */
  mode?: CodeMode;
  /** 是否转换为小写 */
  lowerCase?: boolean;
  /** 非中文/字母/数字字符的替换符 */
  separator?: string;
}

/**
 * 将中文字符串转换为编码字符串。
 *
 * 默认行为：
 * - 中文转全拼小写，如「研发中心」→ `yanfazhongxin`
 * - 英文/数字保持原样
 * - 其他符号被移除
 */
export function stringToCode(value: string, options: StringToCodeOptions = {}): string {
  const { mode = 'full', lowerCase = true, separator = '' } = options;

  if (!value || !value.trim()) {
    return '';
  }

  const text =
    mode === 'simple'
      ? pinyin(value, {
          pattern: 'first',
          separator: '',
          toneType: 'none',
          type: 'string',
        })
      : pinyin(value, {
          separator: '',
          toneType: 'none',
          type: 'string',
        });

  let code = text.replaceAll(/[^a-z0-9\p{Unified_Ideograph}]+/giu, separator);
  if (separator) {
    code = code.replaceAll(new RegExp(`${separator}+`, 'g'), separator);
  }

  if (lowerCase) {
    code = code.toLowerCase();
  }

  return code;
}

/**
 * 判断字符串是否主要由中文组成。
 */
export function isMainlyChinese(value: string): boolean {
  if (!value) return false;
  const chineseCount = (value.match(/\p{Unified_Ideograph}/gu) || []).length;
  return chineseCount / value.length > 0.5;
}
