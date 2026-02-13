/**
 * 工具函数类型声明
 */

interface SizeResult {
  imgWidth: string;
  imgHeight: string;
  barWidth: string;
  barHeight: string;
}

interface VmInstance {
  $el: HTMLElement;
  imgSize: {
    height: string;
    width: string;
  };
  barSize: {
    height: string;
    width: string;
  };
}

/**
 * 重置组件尺寸
 * @param vm Vue 组件实例
 * @returns 计算后的尺寸对象
 */
export function resetSize(vm: VmInstance): SizeResult;

/**
 * 验证码字符集
 */
export const _code_chars: Array<number | string>;

/**
 * 验证码颜色集 1
 */
export const _code_color1: string[];

/**
 * 验证码颜色集 2
 */
export const _code_color2: string[];
