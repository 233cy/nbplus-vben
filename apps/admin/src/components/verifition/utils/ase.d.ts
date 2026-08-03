/**
 * AES 加密工具类型声明
 */

/**
 * AES 加密函数
 * @param word 要加密的内容
 * @param keyWord 服务器随机返回的关键字，默认为 'XwKsGlMcdPMEhR1B'
 * @returns 加密后的字符串
 */
export function aesEncrypt(word: string, keyWord?: string): string;
