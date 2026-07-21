import { Boot } from '@wangeditor/editor';
import attachmentModule from '@wangeditor/plugin-upload-attachment';

import { registerPageWidthMenu } from './page-width-menu';

let initialized = false;

/**
 * 全局初始化 wangEditor 插件与自定义菜单。
 * 必须在首次创建编辑器之前调用，且整个应用生命周期内只执行一次。
 */
export function initWangEditor() {
  if (initialized) return;
  initialized = true;

  if (!(Boot as any).__attachmentRegistered) {
    // 插件为 UMD 产物，Vite 预构建后默认导出会多包一层 { default: module }，需解包兜底
    const attachment = (attachmentModule as any).default ?? attachmentModule;
    Boot.registerModule(attachment);
    (Boot as any).__attachmentRegistered = true;
  }

  if (!(Boot as any).__pageWidthMenuRegistered) {
    registerPageWidthMenu();
    (Boot as any).__pageWidthMenuRegistered = true;
  }
}
