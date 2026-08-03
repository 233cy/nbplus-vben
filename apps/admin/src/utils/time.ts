/**
 * 时间格式化工具
 *
 * ─── 架构约定 ────────────────────────────────────────────────────────────────
 * 1. 后端统一返回「秒级 Unix 时间戳」（BIGINT，number 或 string 均可）
 * 2. 前端时区跟随用户在右上角时区切换器的选择（useTimezoneStore 持久化）
 *    默认为 auto，即浏览器设备时区（dayjs.tz.guess()）
 * 3. 所有时间格式化必须经过本文件，禁止在业务代码中直接裸用 dayjs()
 *
 * ─── 为什么在这里 extend 插件 ────────────────────────────────────────────────
 * dayjs 是全局单例，extend 是幂等的（重复调用无副作用）。
 * vben 内部的 @vben-core/shared/utils/date.ts 已在运行时 extend 过，
 * 但 TypeScript 是静态分析，不执行代码，不知道其他文件 extend 了什么。
 * 在这里显式 import 插件类型，触发 dayjs 的模块扩充（module augmentation）声明。
 * 该声明是项目级生效的：只要 tsconfig 范围内任意一个文件 import 了插件，
 * 整个项目所有文件都能使用 dayjs.tz 而不报类型错误，无需每个文件单独 import。
 *
 * ─── 使用方式 ────────────────────────────────────────────────────────────────
 *
 * 1. 格式化后端时间戳（最常用）：
 *    import { formatUnixTime } from '#/utils/time';
 *    formatUnixTime(data.createdAt)              // '2025-03-21 14:30:00'
 *    formatUnixTime(data.createdAt, 'YYYY-MM-DD') // '2025-03-21'
 *    formatUnixTime(null)                         // '-'
 *
 * 2. 格式化任意时间（Date / dayjs 对象 / 毫秒时间戳 / 字符串）：
 *    import { formatDate, formatDateTime } from '#/utils/time';
 *    formatDate(new Date())                       // '2025-03-21'
 *    formatDateTime(new Date())                   // '2025-03-21 14:30:00'
 *
 * 3. 需要直接操作 dayjs 对象时（如计算时间差、加减）：
 *    import dayjs from 'dayjs';
 *    import timezone from 'dayjs/plugin/timezone';
 *    import utc from 'dayjs/plugin/utc';
 *    dayjs.extend(utc);
 *    dayjs.extend(timezone);
 *    dayjs.unix(ts).tz().format('YYYY-MM-DD HH:mm:ss')  // ✅ 跟随时区
 *    dayjs.unix(ts).format('YYYY-MM-DD HH:mm:ss')        // ❌ 不跟随时区
 */

import { formatDate, formatDateTime } from '@vben/utils';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// 加载 timezone 插件类型声明（运行时幂等，TS 类型必须）
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 将后端返回的秒级 Unix 时间戳格式化为可读时间字符串
 *
 * 时区自动跟随 useTimezoneStore 的设置（右上角时区切换器）。
 *
 * @param ts     秒级时间戳，支持 number / string / null / undefined
 * @param format dayjs 格式字符串，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns      格式化后的字符串；ts 为空或无效时返回 '-'
 *
 * @example
 * formatUnixTime(1742558400)           // '2025-03-21 14:00:00'
 * formatUnixTime('1742558400')         // '2025-03-21 14:00:00'（string 也支持）
 * formatUnixTime(1742558400, 'MM-DD')  // '03-21'
 * formatUnixTime(null)                 // '-'
 */
export function formatUnixTime(ts: null | number | string | undefined, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!ts) return '-';
  const num = typeof ts === 'string' ? Number(ts) : ts;
  if (!Number.isFinite(num) || num <= 0) return '-';
  // 秒 → 毫秒，交给 formatDate（内部调用 dayjs.tz()，跟随全局时区）
  return formatDate(num * 1000, format);
}

// 直接 re-export vben 的通用格式化函数，统一从本文件引入即可
export { formatDate, formatDateTime };
