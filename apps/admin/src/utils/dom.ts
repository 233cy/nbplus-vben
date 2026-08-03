/**
 * DOM 操作小工具
 */

/**
 * 在输入框/文本域当前光标位置插入文本，并触发 input 事件。
 *
 * @param el   HTMLInputElement 或 HTMLTextAreaElement
 * @param text 要插入的文本
 */
export function insertTextAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): void {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const value = el.value;

  el.value = value.slice(0, start) + text + value.slice(end);
  el.selectionStart = el.selectionEnd = start + text.length;
  el.focus();

  // 触发原生 input 事件，方便依赖 v-model 的组件感知变化
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
