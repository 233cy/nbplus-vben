<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useI18n } from '@vben/locales'; // ⭐ vben-admin 官方 i18n hook

import { i18nChangeLanguage } from '@wangeditor/editor'; // ⭐ wangEditor 语言切换 API
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { Modal } from 'ant-design-vue';

import '@wangeditor/editor/dist/css/style.css';

/* -----------------------
   Props（包含 inline / modal）
------------------------- */
const props = defineProps({
  modelValue: { type: String, default: '' },
  height: { type: Number, default: 380 },
  toolbarConfig: { type: Object, default: () => ({}) },
  editorConfig: { type: Object, default: () => ({}) },

  mode: {
    type: String,
    default: 'inline', // inline | modal
  },

  previewLength: {
    type: Number,
    default: 30,
  },
});

const emit = defineEmits(['update:modelValue']);

/* -----------------------
   ⭐ vben-admin i18n → wangEditor i18n
------------------------- */
const { locale, t } = useI18n();

const langMap: Record<string, string> = {
  'zh-CN': 'zh-CN',
  'en-US': 'en',
  'zh-TW': 'zh-TW',
};

watch(
  () => locale.value,
  (lang) => {
    const targetLang = langMap[lang] || 'en';
    i18nChangeLanguage(targetLang);
  },
  { immediate: true },
);

/* -----------------------
   富文本基础逻辑（你的原逻辑）
------------------------- */
const editorRef = shallowRef();
const valueHtml = ref('');

watch(
  () => props.modelValue,
  (v) => {
    if (v !== valueHtml.value) valueHtml.value = v;
  },
);

watch(valueHtml, (v) => emit('update:modelValue', v));

function handleCreated(editor: any) {
  editorRef.value = editor;
}

onBeforeUnmount(() => {
  editorRef.value?.destroy();
});

/* -----------------------
   Modal 模式逻辑
------------------------- */
const showModal = ref(false);

function openModal() {
  showModal.value = true;
}

function handleOk() {
  emit('update:modelValue', valueHtml.value);
  showModal.value = false;
}

const textLen = computed(() => {
  const plain = valueHtml.value.replaceAll(/<[^>]+>/g, '');
  return plain.length;
});
</script>

<template>
  <!-- /////////////////////////////////////////////////////
       INLINE 模式：直接渲染富文本
  ///////////////////////////////////////////////////// -->
  <div v-if="props.mode === 'inline'" class="vben-wangeditor rounded-md border border-border">
    <Toolbar :editor="editorRef" :default-config="props.toolbarConfig" class="vben-wangeditor-toolbar border-b border-border px-2 py-1" />

    <Editor
      v-model="valueHtml"
      :default-config="props.editorConfig"
      :style="{ height: `${props.height}px` }"
      class="vben-wangeditor-editor px-2 py-2"
      @on-created="handleCreated"
    />
  </div>

  <!-- /////////////////////////////////////////////////////
       MODAL 模式：按钮 + 缩略 + 弹窗编辑
  ///////////////////////////////////////////////////// -->
  <div v-else class="flex items-center gap-3">
    <a-button @click="openModal">
      <template #icon>
        <IconifyIcon icon="mdi:invoice-text-edit-outline" />
      </template>
      {{ t('page.richTextEditor.editContent') }}
    </a-button>

    <div v-if="textLen" class="hover:text-regular hover:border-border-strong rounded-md border border-border bg-card p-1 px-2 text-primary transition-all hover:bg-muted">
      {{ t('page.richTextEditor.textContent', { len: textLen }) }}
    </div>

    <Modal v-model:open="showModal" :title="t('page.richTextEditor.editContent')" width="1200px" @ok="handleOk" @cancel="() => (showModal = false)">
      <div class="vben-wangeditor rounded-md border border-border">
        <Toolbar :editor="editorRef" :default-config="props.toolbarConfig" class="vben-wangeditor-toolbar border-b border-border px-2 py-1" />

        <Editor
          v-model="valueHtml"
          :default-config="props.editorConfig"
          :style="{ height: `${props.height}px` }"
          class="vben-wangeditor-editor px-2 py-2"
          @on-created="handleCreated"
        />
      </div>
    </Modal>
  </div>
</template>

<style scoped>
/* ——你的主题适配（完全保留）—— */
.vben-wangeditor {
  width: 100%;
  border-radius: 8px;
}

.vben-wangeditor-toolbar {
  background-color: hsl(var(--card));
  border-color: hsl(var(--border));
}

.vben-wangeditor-editor {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* 深色模式适配 */
:global(.dark .vben-wangeditor .w-e-toolbar) {
  background-color: hsl(var(--card)) !important;
  border-color: hsl(var(--border)) !important;
}
:global(.dark .vben-wangeditor .w-e-bar-item button svg) {
  filter: brightness(1.4) contrast(1.1) !important;
}
:global(.dark .vben-wangeditor .w-e-bar-item button:hover) {
  background-color: rgba(255, 255, 255, 0.08) !important;
}
:global(.dark .vben-wangeditor .w-e-text-container),
:global(.dark .vben-wangeditor .w-e-textarea),
:global(.dark .vben-wangeditor .w-e-scroll) {
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
}

/* 灰色模式 */
:global(.gray-mode .vben-wangeditor),
:global(.gray-mode .vben-wangeditor-toolbar),
:global(.gray-mode .vben-wangeditor-editor) {
  filter: grayscale(100%) !important;
}

/* 色弱模式 */
:global(.color-weak .vben-wangeditor),
:global(.color-weak .vben-wangeditor-toolbar),
:global(.color-weak .vben-wangeditor-editor) {
  filter: invert(80%) hue-rotate(180deg) !important;
}
</style>
