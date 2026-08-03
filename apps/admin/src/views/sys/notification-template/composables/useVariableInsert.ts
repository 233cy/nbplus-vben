import type { Ref } from 'vue';

import { ref } from 'vue';

import { insertTextAtCursor } from '#/utils/dom';

type Field = 'content' | 'subject' | 'summary';

interface ModelValue {
  content?: string;
  subject?: string;
  summary?: string;
}

/**
 * 在渠道内容编辑中处理模板变量插入。
 *
 * 记录当前焦点的输入框/文本域，点击变量标签时把 {{变量名}} 插入到光标位置。
 */
export function useVariableInsert(modelValue: Ref<ModelValue>) {
  const activeField = ref<Field>('content');
  const activeEl = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

  function handleFocus(field: Field, event: FocusEvent) {
    activeField.value = field;
    activeEl.value = event.target as HTMLInputElement | HTMLTextAreaElement;
  }

  function insertVariable(variable: string) {
    const text = `{{${variable}}}`;
    const el = activeEl.value;

    if (el) {
      insertTextAtCursor(el, text);
      modelValue.value[activeField.value] = el.value;
      return;
    }

    // 未聚焦任何输入框时，默认追加到当前字段末尾
    const field = activeField.value;
    modelValue.value[field] = (modelValue.value[field] ?? '') + text;
  }

  return {
    activeField,
    activeEl,
    handleFocus,
    insertVariable,
  };
}
