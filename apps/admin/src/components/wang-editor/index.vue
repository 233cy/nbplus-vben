<script setup lang="ts">
import type { PageWidth } from '#/components/rich-text-view/preset';

import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useI18n } from '@vben/locales';

import { Boot, i18nChangeLanguage } from '@wangeditor/editor';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import attachmentModule from '@wangeditor/plugin-upload-attachment';
import { message, Modal } from 'ant-design-vue';

import { resolvePageWidthCss } from '#/components/rich-text-view/preset';
import { useFileUpload, validateFileBySystem } from '#/components/upload/composables/useFileUpload';

import { useRichTextLogical } from './composables/useRichTextLogical';
import { registerPageWidthEditor, registerPageWidthMenu } from './page-width-menu';

import '@wangeditor/editor/dist/css/style.css';
// 共享内容样式表（唯一真相），需在 wangEditor 样式之后引入以覆盖其默认内容样式
import '#/components/rich-text-view/rich-text.css';

/* -----------------------
   Props
------------------------- */
const props = withDefaults(
  defineProps<{
    /** 上传文件的访问策略 */
    accessPolicy?: 'login' | 'owner' | 'public';
    /** 上传文件的访问类型 */
    accessType?: 'authorized' | 'login' | 'public';
    editorConfig?: Record<string, any>;
    height?: number;
    mode?: 'inline' | 'modal';
    modelValue?: string;
    /** 页面宽度：'iphone' | 'ipad' | 'common' 预设，或具体像素数，默认 common(800) */
    pageWidth?: PageWidth;
    previewLength?: number;
    /** 只读展示模式：隐藏工具栏、禁止编辑，仅用于渲染内容 */
    readonly?: boolean;
    toolbarConfig?: Record<string, any>;
  }>(),
  {
    modelValue: '',
    height: 380,
    toolbarConfig: () => ({}),
    editorConfig: () => ({}),
    mode: 'inline',
    previewLength: 30,
    accessType: 'public',
    accessPolicy: undefined,
    readonly: false,
    pageWidth: 'ipad',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/* -----------------------
   注册附件上传插件（uploadAttachment 菜单非内置，需注册模块）
   Boot.registerModule 全局只能注册一次，重复注册会报错
------------------------- */
if (!(Boot as any).__attachmentRegistered) {
  Boot.registerModule(attachmentModule);
  (Boot as any).__attachmentRegistered = true;
}

/* -----------------------
   注册页面宽度菜单（全局仅一次）
------------------------- */
if (!(Boot as any).__pageWidthMenuRegistered) {
  registerPageWidthMenu();
  (Boot as any).__pageWidthMenuRegistered = true;
}

const { locale, t } = useI18n();
const { uploadFile } = useFileUpload();
const { register, dehydrate, rehydrate } = useRichTextLogical();

const langMap: Record<string, string> = { 'zh-CN': 'zh-CN', 'en-US': 'en', 'zh-TW': 'zh-TW' };
watch(
  () => locale.value,
  lang => {
    i18nChangeLanguage(langMap[lang] || 'en');
  },
  { immediate: true },
);

/* -----------------------
   值同步
   - 编辑器内部持有 fullUrl（图片才能显示），对外 modelValue 是入库形态（logicalPath）
   - 进站：modelValue → rehydrate（回填新鲜 fullUrl）→ 编辑器
   - 出站：编辑器 → dehydrate（收敛为 data-logical）→ emit
------------------------- */
const editorRef = shallowRef<any>();
const valueHtml = ref('');
// 防止「出站 emit → 父级回灌 modelValue → 进站重置编辑器」的循环与光标跳动
let syncingFromProp = false;

watch(
  () => props.modelValue,
  async (v = '') => {
    const incoming = v;
    // 入参与编辑器当前内容的入库形态一致时跳过，避免重置编辑器导致光标跳动
    if (dehydrate(valueHtml.value) === incoming) return;
    const hydrated = await rehydrate(incoming);
    syncingFromProp = true;
    valueHtml.value = hydrated;
    await nextTick();
    syncingFromProp = false;
  },
  { immediate: true },
);
watch(valueHtml, v => {
  if (syncingFromProp) return;
  emit('update:modelValue', dehydrate(v));
});

/* -----------------------
   Toolbar 默认配置
   - 不覆盖 toolbarKeys，沿用 wangEditor 完整默认工具栏
     （已含图片/视频下拉分组、全屏等，group-image 之类的分组 key 不能单独使用）
   - 仅通过 insertKeys 把附件上传追加到工具栏末尾（uploadAttachment 需注册插件）
------------------------- */
const finalToolbarConfig = computed(() => ({
  insertKeys: {
    index: 1000, // 足够大，确保插到默认工具栏末尾
    keys: ['uploadAttachment', 'pageWidth'],
  },
  ...props.toolbarConfig,
}));

/* -----------------------
   占位符替换工具
------------------------- */
function findPath(nodes: any[], searchText: string, currentPath: number[] = []): null | { path: number[]; textNode: any } {
  for (const [i, node] of nodes.entries()) {
    const newPath = [...currentPath, i];

    if (node.text !== undefined && typeof node.text === 'string' && node.text.includes(searchText)) {
      return { path: newPath, textNode: node };
    }

    if (node.children) {
      const result = findPath(node.children, searchText, newPath);
      if (result) return result;
    }
  }
  return null;
}

/** 选中占位文本（供替换/删除复用），未找到返回 false */
function selectPlaceholder(uniqueText: string): boolean {
  const editor = editorRef.value;
  if (!editor) return false;

  const result = findPath(editor.children, uniqueText);
  if (!result) return false;

  const { path, textNode } = result;
  const startOffset = textNode.text.indexOf(uniqueText);
  editor.select({
    anchor: { path, offset: startOffset },
    focus: { path, offset: startOffset + uniqueText.length },
  });
  return true;
}

function makePlaceholder(): string {
  const uid = Math.random().toString(36).slice(2, 8);
  return `[⏳上传中-${uid}]`;
}

/** 删除占位文本（上传失败时清理，避免残留垃圾文字） */
function removePlaceholder(uniqueText: string) {
  if (selectPlaceholder(uniqueText)) editorRef.value?.deleteFragment();
}

/* -----------------------
   上传处理
------------------------- */
async function handleUpload(file: File, placeholderText: string) {
  const hide = message.loading(t('upload.uploadingFile', { name: file.name }), 0);
  try {
    const { fullUrl, logicalPath } = await uploadFile(file, {
      accessType: props.accessType,
      accessPolicy: props.accessPolicy,
    });
    register(fullUrl, logicalPath);
    hide();
    message.success(t('upload.uploadSuccess', { name: file.name }));
    return fullUrl;
  } catch {
    hide();
    removePlaceholder(placeholderText); // 失败时移除占位，不残留文字
    // 失败原因已由全局拦截器（XHR）或 composable（TUS）统一提示，这里不再重复弹通用文案
    throw new Error('upload failed');
  }
}

/**
 * 统一的「占位 → 上传 → 替换 / 失败清理」流程，图片、视频、附件共用。
 * 成功后选中占位并删除，光标停在原位，再由 insertResult 在原位插入对应内容。
 */
async function uploadWithPlaceholder(file: File, insertResult: (fullUrl: string) => void) {
  const editor = editorRef.value;
  if (!editor) return;

  // 前端预校验：体积/类型不合规即时拦截（与后端 storage.* 白名单一致），不插入占位、不发起上传
  const preError = validateFileBySystem(file);
  if (preError) {
    message.error(preError);
    return;
  }

  const placeholderText = makePlaceholder();
  editor.insertText(placeholderText);
  editor.insertText(' ');

  // handleUpload 内含 toast 与失败时的占位清理；失败会抛出，终止后续插入
  const fullUrl = await handleUpload(file, placeholderText);

  if (selectPlaceholder(placeholderText)) {
    editor.deleteFragment();
    insertResult(fullUrl);
  }
}

/** 图片上传 */
async function customImageUpload(file: File, _insertFn: (url: string, alt?: string, href?: string) => void) {
  await uploadWithPlaceholder(file, fullUrl => {
    editorRef.value?.insertNode({ type: 'image', src: fullUrl, alt: file.name, href: '', children: [{ text: '' }] });
  });
}

/** 视频上传 */
async function customVideoUpload(file: File, _insertFn: (url: string, poster?: string) => void) {
  await uploadWithPlaceholder(file, fullUrl => {
    editorRef.value?.insertNode({ type: 'video', src: fullUrl, children: [{ text: '' }] });
  });
}

/** 附件上传 */
async function customAttachmentUpload(file: File, insertFn: (fileName: string, link: string) => void) {
  // 插件签名为 insertFn(fileName, link)：文件名在前作展示文字，URL 在后作 href
  await uploadWithPlaceholder(file, fullUrl => {
    insertFn(file.name, fullUrl);
  });
}

/* -----------------------
   Editor Config
------------------------- */
const finalEditorConfig = computed(() => ({
  ...props.editorConfig,
  readOnly: props.readonly,
  placeholder: props.readonly ? '' : (props.editorConfig?.placeholder ?? '请输入内容...'),
  MENU_CONF: {
    ...props.editorConfig?.MENU_CONF,
    uploadImage: { customUpload: customImageUpload },
    uploadVideo: { customUpload: customVideoUpload },
    uploadAttachment: { customUpload: customAttachmentUpload },
  },
}));

function handleCreated(editor: any) {
  editorRef.value = editor;
  registerPageWidthEditor(editor, currentWidth);
  if (props.readonly) editor.disable();
}

onBeforeUnmount(() => {
  editorRef.value?.destroy();
});

/* -----------------------
   Modal Logic
------------------------- */
const showModal = ref(false);
function openModal() {
  showModal.value = true;
}
function handleOk() {
  emit('update:modelValue', dehydrate(valueHtml.value));
  showModal.value = false;
}
const textLen = computed(() => valueHtml.value.replaceAll(/<[^>]+>/g, '').length);

/* -----------------------
   页面宽度（支持工具切换）
------------------------- */
const currentWidth = ref<PageWidth>(props.pageWidth);
watch(
  () => props.pageWidth,
  v => {
    currentWidth.value = v;
  },
);
/** 固定页面宽度 CSS 变量，驱动共享样式表里的 --rt-page-width */
const pageWidthStyle = computed(() => ({ '--rt-page-width': resolvePageWidthCss(currentWidth.value) }));
</script>

<template>
  <div v-if="props.mode === 'inline'" class="vben-wangeditor rounded-md border border-border" :class="{ 'vben-wangeditor--readonly': props.readonly }">
    <Toolbar v-if="!props.readonly" :editor="editorRef" :default-config="finalToolbarConfig" class="vben-wangeditor-toolbar border-b border-border px-2 py-1" />
    <Editor
      v-model="valueHtml"
      :default-config="finalEditorConfig"
      :style="[props.readonly ? { minHeight: '120px' } : { height: `${props.height}px` }, pageWidthStyle]"
      class="vben-wangeditor-editor rich-text-content"
      :class="{ 'is-editor': !props.readonly }"
      @on-created="handleCreated"
    />
  </div>

  <div v-else class="flex items-center gap-3">
    <a-button @click="openModal">
      <template #icon>
        <IconifyIcon icon="mdi:invoice-text-edit-outline" />
      </template>
      {{ t('common.richTextEditor.editContent') }}
    </a-button>
    <div v-if="textLen" class="hover:text-regular rounded-md border border-border bg-card p-1 px-2 text-primary transition-all">
      {{ t('common.richTextEditor.textContent', { len: textLen }) }}
    </div>
    <Modal v-model:open="showModal" :title="t('common.richTextEditor.editContent')" width="1200px" @ok="handleOk">
      <div class="vben-wangeditor rounded-md border border-border">
        <Toolbar :editor="editorRef" :default-config="finalToolbarConfig" class="border-b px-2 py-1" />
        <Editor
          v-model="valueHtml"
          :default-config="finalEditorConfig"
          :style="[{ height: `${props.height}px` }, pageWidthStyle]"
          class="vben-wangeditor-editor rich-text-content is-editor"
          @on-created="handleCreated"
        />
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.vben-wangeditor {
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
}

/* 只读展示：去掉编辑器外框，呈现为正文内容 */
.vben-wangeditor--readonly {
  border: none !important;
  border-radius: 0;
}

.vben-wangeditor--readonly :deep(.w-e-text-container) {
  background-color: transparent !important;
}

.vben-wangeditor-toolbar {
  background-color: hsl(var(--card));
  border-color: hsl(var(--border));
}

.vben-wangeditor-editor {
  color: hsl(var(--foreground));
  background-color: hsl(var(--background));
}

:deep(.w-e-text-container) {
  z-index: 1 !important;
}

:deep(.w-e-toolbar) {
  z-index: 2 !important;
}

:global(.dark .vben-wangeditor .w-e-toolbar) {
  background-color: hsl(var(--card)) !important;
  border-color: hsl(var(--border)) !important;
}

:global(.dark .vben-wangeditor .w-e-toolbar) {
  background-color: hsl(var(--card)) !important;
  border-color: hsl(var(--border)) !important;
}

:global(.dark .vben-wangeditor .w-e-text-container) {
  color: hsl(var(--foreground)) !important;
  background-color: hsl(var(--background)) !important;
}
</style>
