/**
 * 富文本「页面宽度」预设.
 *
 * 用设备类型表达固定宽度，便于编辑与展示对齐目标端；也可直接传具体像素值。
 * 宽度通过 CSS 变量 --rt-page-width 驱动，编辑器与展示组件共用同一套样式表。
 */
export const PAGE_WIDTH_PRESETS = {
  /** 手机：贴近移动端正文宽度 */
  iphone: 375,
  /** 平板 */
  ipad: 768,
  /** 通用阅读宽度（默认） */
  common: 1100,
} as const;

export type PageWidthPreset = keyof typeof PAGE_WIDTH_PRESETS;
/** 'full' 表示不限宽（满宽） */
export type PageWidth = 'full' | number | PageWidthPreset;

/** 解析页面宽度为 CSS 值（用于 --rt-page-width）：'full'→100%，数字→Npx，预设→预设px */
export function resolvePageWidthCss(width: PageWidth): string {
  if (width === 'full') {
    return '100%';
  }
  if (typeof width === 'number') {
    return `${width}px`;
  }
  return `${PAGE_WIDTH_PRESETS[width] ?? PAGE_WIDTH_PRESETS.common}px`;
}

/** 宽度切换工具的可选项（编辑器 toolbar 下拉菜单用） */
export const PAGE_WIDTH_OPTIONS: { label: string; value: PageWidth }[] = [
  { label: '手机', value: 'iphone' },
  { label: '平板', value: 'ipad' },
  { label: '通用', value: 'common' },
];
