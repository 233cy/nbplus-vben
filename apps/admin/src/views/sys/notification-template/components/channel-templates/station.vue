<script setup lang="ts">
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { ref } from 'vue';

import { Input } from 'ant-design-vue';

import { $t } from '#/locales';
import VariableQuickPick from '../variable-quick-pick.vue';
import { useVariableInsert } from '../../composables/useVariableInsert';

const props = defineProps<{
  variables?: Record<string, string>;
}>();

const modelValue = defineModel<NotificationTemplateApi.TemplateItemSave>({ default: () => ({}) });

const editorRef = ref<null | { focus?: () => void; insertText?: (text: string) => boolean }>(null);

const { activeField, activeEl, handleFocus, insertVariable: insertIntoInput } = useVariableInsert(modelValue);

function handleEditorFocus() {
  activeField.value = 'content';
  activeEl.value = null;
}

function insertVariable(variable: string) {
  const text = `{{${variable}}}`;

  if (activeField.value === 'content') {
    if (editorRef.value?.insertText?.(text)) {
      return;
    }
    // 编辑器未就绪时回退到末尾追加
    modelValue.value.content = (modelValue.value.content ?? '') + text;
    return;
  }

  insertIntoInput(variable);
}
</script>

<template>
  <div class="space-y-4">
    <VariableQuickPick
      :variables="props.variables"
      :hint="$t('sys.notification-template.clickToInsertVariable')"
      @insert="insertVariable"
    />

    <div>
      <label class="mb-1 block text-sm">站内信标题</label>
      <Input
        v-model:value="modelValue.subject"
        placeholder="支持 {{变量名}} 占位符"
        @focus="handleFocus('subject', $event)"
      />
    </div>
    <div>
      <label class="mb-1 block text-sm">摘要</label>
      <Input
        v-model:value="modelValue.summary"
        placeholder="支持 {{变量名}} 占位符，用于铃铛下拉等列表场景，留空自动截取正文"
        @focus="handleFocus('summary', $event)"
      />
    </div>
    <div @focusin="handleEditorFocus">
      <label class="mb-1 block text-sm">站内信内容（富文本）</label>
      <wang-editor
        ref="editorRef"
        v-model="modelValue.content"
        access-type="public"
        access-policy="public"
        :height="380"
      />
    </div>
  </div>
</template>
