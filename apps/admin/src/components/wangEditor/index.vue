<script setup lang="ts">
import type { TusBody } from '@uppy/tus';

import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useI18n } from '@vben/locales';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { i18nChangeLanguage } from '@wangeditor/editor';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { Modal } from 'ant-design-vue';

import '@wangeditor/editor/dist/css/style.css';

/* -----------------------
   Props
------------------------- */
const props = defineProps({
  modelValue: { type: String, default: '' },
  height: { type: Number, default: 380 },
  toolbarConfig: { type: Object, default: () => ({}) },
  editorConfig: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'inline' },
  previewLength: { type: Number, default: 30 },
});

const emit = defineEmits(['update:modelValue']);
const { locale, t } = useI18n();
const langMap: Record<string, string> = { 'zh-CN': 'zh-CN', 'en-US': 'en', 'zh-TW': 'zh-TW' };
watch(
  () => locale.value,
  lang => {
    i18nChangeLanguage(langMap[lang] || 'en');
  },
  { immediate: true },
);

/* -----------------------
   Uppy Init
------------------------- */
const apiURL = 'http://10.8.0.4:2330';
const TUS_ENDPOINT = `${apiURL}/tus`;
const uppyRef = shallowRef<null | Uppy<Record<string, unknown>, TusBody>>(null);

function initUppy() {
  if (uppyRef.value) return;
  uppyRef.value = new Uppy<Record<string, unknown>, TusBody>({
    id: 'wangEditorUppy',
    autoProceed: true,
    // 允许同一个文件多次上传，虽然我们下面通过自定义ID已经解决了，但加上这个双保险
    onBeforeFileAdded: () => {
      return true;
    },
    restrictions: { maxNumberOfFiles: 20 },
  }).use(Tus, {
    endpoint: TUS_ENDPOINT,
    chunkSize: 5 * 1024 * 1024,
    retryDelays: [0, 1000, 3000, 5000],
    removeFingerprintOnSuccess: true,
  });
}

/* -----------------------
   ⭐ 核心逻辑：递归查找路径 ⭐
   (保留这个函数以防止 editor.nodes 报错)
------------------------- */
const editorRef = shallowRef();
const valueHtml = ref('');

watch(
  () => props.modelValue,
  v => {
    if (v !== valueHtml.value) valueHtml.value = v;
  },
);
watch(valueHtml, v => emit('update:modelValue', v));

/**
 * 递归查找包含特定文本的节点路径
 */
const findPath = (nodes: any[], searchText: string, currentPath: number[] = []): null | { path: number[]; textNode: any } => {
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
};

/**
 * 替换占位符
 */
const replacePlaceholder = (uniqueText: string, content: any, isError = false) => {
  const editor = editorRef.value;
  if (!editor) return;

  const result = findPath(editor.children, uniqueText);

  if (result) {
    const { path, textNode } = result;
    const startOffset = textNode.text.indexOf(uniqueText);

    editor.select({
      anchor: { path, offset: startOffset },
      focus: { path, offset: startOffset + uniqueText.length },
    });

    if (isError) {
      editor.insertText(content);
    } else {
      editor.deleteFragment();
      editor.insertNode(content);
    }
  }
};

const customUploadHandler = (file: File, _insertFn: any) => {
  if (!uppyRef.value) initUppy();
  const uppy = uppyRef.value!;
  const editor = editorRef.value;
  if (!editor) return;

  // 1. 生成本次任务的唯一 Hash
  const uid = Math.random().toString(36).slice(2, 8);
  const placeholderText = `[⏳上传中-${uid}]`;

  // 2. 插入编辑器
  editor.insertText(placeholderText);
  editor.insertText(' ');

  // 3. ⭐⭐ 关键修改：生成一个基于时间戳的 Uppy ID ⭐⭐
  // 这样每次调用 addFile，ID 都是全新的，Uppy 就不会报 Duplicate error
  const uniqueUppyId = `file-${Date.now()}-${uid}`;

  let finalFileId: string;
  try {
    finalFileId = uppy.addFile({
      id: uniqueUppyId, // <--- 强制指定唯一 ID
      data: file,
      name: file.name,
      type: file.type,
    });
  } catch (error) {
    console.error('Uppy Add File Error:', error);
    replacePlaceholder(placeholderText, '[❌ 添加失败]', true);
    return;
  }

  // 4. 回调处理
  const onUploadSuccess = (uploadedFile: any, response: any) => {
    // 必须匹配我们生成的 uniqueUppyId
    if (uploadedFile.id === finalFileId) {
      const url = response?.uploadURL || uploadedFile.uploadURL;
      if (url) {
        const node = file.type.startsWith('video/')
          ? { type: 'video', src: url, children: [{ text: '' }] }
          : { type: 'image', src: url, alt: file.name, href: '', children: [{ text: '' }] };

        replacePlaceholder(placeholderText, node, false);
      } else {
        replacePlaceholder(placeholderText, '[❌ URL丢失]', true);
      }
      cleanup();
    }
  };

  const onUploadError = (uploadedFile: any, _error: Error) => {
    if (uploadedFile.id === finalFileId) {
      replacePlaceholder(placeholderText, '[❌ 上传失败]', true);
      cleanup();
    }
  };

  const cleanup = () => {
    uppy.off('upload-success', onUploadSuccess);
    uppy.off('upload-error', onUploadError);
  };

  uppy.on('upload-success', onUploadSuccess);
  uppy.on('upload-error', onUploadError);
};

/* -----------------------
   UI Config
------------------------- */
const finalEditorConfig = computed(() => ({
  ...props.editorConfig,
  placeholder: '请输入内容...',
  MENU_CONF: {
    ...props.editorConfig.MENU_CONF,
    uploadImage: { customUpload: customUploadHandler },
    uploadVideo: { customUpload: customUploadHandler },
    uploadAttachment: { customUpload: customUploadHandler },
  },
}));

function handleCreated(editor: any) {
  editorRef.value = editor;
}
onMounted(() => {
  initUppy();
});
onBeforeUnmount(() => {
  editorRef.value?.destroy();
  uppyRef.value?.destroy();
});

// Modal Logic
const showModal = ref(false);
function openModal() {
  showModal.value = true;
}
function handleOk() {
  emit('update:modelValue', valueHtml.value);
  showModal.value = false;
}
const textLen = computed(() => valueHtml.value.replaceAll(/<[^>]+>/g, '').length);
</script>

<template>
  <div v-if="props.mode === 'inline'" class="vben-wangeditor rounded-md border border-border">
    <Toolbar :editor="editorRef" :default-config="props.toolbarConfig" class="vben-wangeditor-toolbar border-b border-border px-2 py-1" />
    <Editor v-model="valueHtml" :default-config="finalEditorConfig" :style="{ height: `${props.height}px` }" class="vben-wangeditor-editor px-2 py-2" @on-created="handleCreated" />
  </div>

  <div v-else class="flex items-center gap-3">
    <a-button @click="openModal">
      <template #icon>
        <IconifyIcon icon="mdi:invoice-text-edit-outline" />
      </template>
      {{ t('page.richTextEditor.editContent') }}
    </a-button>
    <div v-if="textLen" class="hover:text-regular rounded-md border border-border bg-card p-1 px-2 text-primary transition-all">
      {{ t('page.richTextEditor.textContent', { len: textLen }) }}
    </div>
    <Modal v-model:open="showModal" :title="t('page.richTextEditor.editContent')" width="1200px" @ok="handleOk">
      <div class="vben-wangeditor rounded-md border border-border">
        <Toolbar :editor="editorRef" :default-config="props.toolbarConfig" class="border-b px-2 py-1" />
        <Editor
          v-model="valueHtml"
          :default-config="finalEditorConfig"
          :style="{ height: `${props.height}px` }"
          class="vben-wangeditor-editor px-2 py-2"
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

:global(.dark .vben-wangeditor .w-e-text-container) {
  color: hsl(var(--foreground)) !important;
  background-color: hsl(var(--background)) !important;
}
</style>
