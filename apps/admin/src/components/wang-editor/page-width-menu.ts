import type { IDomEditor, IDropPanelMenu } from '@wangeditor/editor';

import type { Ref } from 'vue';

import type { PageWidth } from '#/components/rich-text-view/preset';

import { $t } from '@vben/locales';

import { Boot } from '@wangeditor/editor';

import { PAGE_WIDTH_OPTIONS } from '#/components/rich-text-view/preset';

/** 每个 editor 实例对应自己的宽度 ref，解决多编辑器实例共存问题 */
const editorToWidthRef = new WeakMap<IDomEditor, Ref<PageWidth>>();

/** 编辑器创建后把实例和响应式宽度绑定起来 */
export function registerPageWidthEditor(editor: IDomEditor, widthRef: Ref<PageWidth>) {
  editorToWidthRef.set(editor, widthRef);
}

class PageWidthDropMenu implements IDropPanelMenu {
  readonly showDropPanel = true;
  readonly tag = 'button';
  readonly title = $t('components.wang-editor.pageWidthTitle');

  exec() {
    // 实际逻辑在面板点击中处理，这里不需要操作
  }

  getPanelContentElem(editor: IDomEditor): HTMLDivElement {
    const ref = editorToWidthRef.get(editor);
    const width = ref?.value ?? 'ipad';
    const current = typeof width === 'number' ? 'ipad' : width;

    const $container = document.createElement('div');
    $container.className = 'page-width-menu-panel';
    $container.style.padding = '6px 0';
    $container.style.minWidth = '100px';

    PAGE_WIDTH_OPTIONS.forEach(opt => {
      const $item = document.createElement('div');
      $item.style.display = 'flex';
      $item.style.alignItems = 'center';
      $item.style.padding = '6px 16px';
      $item.style.cursor = 'pointer';
      $item.style.whiteSpace = 'nowrap';
      $item.style.color = 'inherit';
      $item.style.backgroundColor = current === opt.value ? 'rgba(0,0,0,0.06)' : 'transparent';

      const $check = document.createElement('span');
      $check.style.display = 'inline-block';
      $check.style.width = '20px';
      $check.style.textAlign = 'center';
      $check.textContent = current === opt.value ? '✓' : '';

      const $text = document.createElement('span');
      $text.textContent = opt.label;

      $item.append($check);
      $item.append($text);

      $item.addEventListener('mouseenter', () => {
        if (current !== opt.value) {
          $item.style.backgroundColor = 'rgba(0,0,0,0.04)';
        }
      });
      $item.addEventListener('mouseleave', () => {
        $item.style.backgroundColor = current === opt.value ? 'rgba(0,0,0,0.06)' : 'transparent';
      });
      $item.addEventListener('click', () => {
        if (ref) {
          ref.value = opt.value;
        }
        editor.hidePanelOrModal();
      });
      $container.append($item);
    });

    return $container;
  }

  getValue(): boolean | string {
    return '';
  }

  isActive(): boolean {
    return false;
  }

  isDisabled(): boolean {
    return false;
  }
}

let registered = false;

/** 注册页面宽度下拉菜单（全局仅注册一次） */
export function registerPageWidthMenu() {
  if (registered) return;
  registered = true;
  Boot.registerMenu({
    key: 'pageWidth',
    factory() {
      return new PageWidthDropMenu();
    },
  });
}
