<script setup lang="ts">
import type { TusBody } from '@uppy/tus';

import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

// ⭐ 新增：引入应用配置
import { IconifyIcon } from '@vben/icons';
import { useI18n } from '@vben/locales';

import Uppy from '@uppy/core'; // ⭐ 新增 Uppy 核心
import Tus from '@uppy/tus'; // ⭐ 新增 TUS 插件
import { i18nChangeLanguage } from '@wangeditor/editor';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { message, Modal } from 'ant-design-vue'; // ⭐ 引入 message

import '@wangeditor/editor/dist/css/style.css';

// 假设 WangEditor 配置中不需要 upload_file，因此移除该引用：
// import { upload_file } from '#/api/examples/upload';

/* -----------------------
   Props（包含 inline / modal）
------------------------- */
const props = defineProps({
  // ... (Props不变) ...
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
   ⭐ Uppy/TUS 配置和初始化
------------------------- */
const apiURL = 'http://10.8.0.4:9501';
// 假设 TUS 接口位于 API_BASE/tus
const TUS_ENDPOINT = `${apiURL}/tus`;

// Uppy 实例
const uppyRef = shallowRef<null | Uppy<Record<string, unknown>, TusBody>>(null);

function initUppy() {
  if (uppyRef.value) return;

  uppyRef.value = new Uppy<Record<string, unknown>, TusBody>({
    id: 'wangEditorUppy',
    autoProceed: true,
    restrictions: { maxNumberOfFiles: 1 },
  }).use(Tus, {
    endpoint: TUS_ENDPOINT,
    chunkSize: 5 * 1024 * 1024,
    retryDelays: [0, 1000, 3000, 5000],
    // TIP: 如果 TUS 服务器需要认证，您可能需要在这里或通过配置设置 Authorization Header
  });
}

/* -----------------------
   vben-admin i18n → wangEditor i18n
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
   富文本基础逻辑
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

// ⭐ 新增：定义 wangEditor 期望的上传函数类型和实现
type InsertFn = (url: string, alt: string, href: string) => void;
type UploadFn = (file: File, insertFn: InsertFn) => void;

/**
 * 自定义图片上传函数：使用 Uppy + TUS 协议实现断点续传
 */
const customUploadImage: UploadFn = (file, insertFn) => {
  if (!uppyRef.value) {
    initUppy();
  }
  const uppy = uppyRef.value!;

  // 清空旧的队列
  // Uppy.removeFile 接受单个 id，传入 string[] 会导致类型错误，改为遍历删除
  uppy.getFiles().forEach((f) => uppy.removeFile(f.id));

  // 1. 将文件添加到 Uppy 队列
  uppy.addFile({
    data: file,
    name: file.name,
    type: file.type,
    meta: {},
  });

  // 2. 定义事件监听器
  const onFileAdded = (addedFile: any) => {
    if (addedFile.name === file.name) {
      message.loading({ content: t('common.uploading') || '上传中...', key: addedFile.id, duration: 0 });
    }
  };

  const onUploadSuccess = (uploadedFile: any, response: any) => {
    if (uploadedFile.name === file.name) {
      const url = response?.uploadURL || uploadedFile.uploadURL;

      message.destroy(uploadedFile.id);

      if (url) {
        insertFn(`${url}/get`, file.name, `${url}/get`);
        message.success(t('page.richTextEditor.upload.imageUploadSuccess') || '图片上传成功');
      } else {
        message.error(`${t('page.richTextEditor.upload.uploadFailed')}: URL缺失`);
      }
      cleanupListeners();
    }
  };

  const onUploadError = (uploadedFile: any, error: Error) => {
    if (uploadedFile.name === file.name) {
      message.destroy(uploadedFile.id);
      message.error(`${t('page.richTextEditor.upload.uploadFailed')}: ${error.message}`);
      cleanupListeners();
    }
  };

  const cleanupListeners = () => {
    uppy.off('file-added', onFileAdded);
    uppy.off('upload-success', onUploadSuccess);
    uppy.off('upload-error', onUploadError);
  };

  // 3. 绑定监听器
  uppy.on('file-added', onFileAdded);
  uppy.on('upload-success', onUploadSuccess);
  uppy.on('upload-error', onUploadError);
};

/**
 * ⭐ 新增：计算属性合并配置，注入自定义上传逻辑
 */
const finalEditorConfig = computed(() => {
  return {
    ...props.editorConfig,
    MENU_CONF: {
      ...props.editorConfig.MENU_CONF,

      // 覆盖图片上传配置
      uploadImage: {
        customUpload: customUploadImage,
        // 这里可以配置上传文件的类型、最大体积等，但由 Uppy 和后端 TUS 服务器处理更可靠
      },

      // 可选：如果需要支持文件上传，也使用相同的逻辑
      uploadAttachment: {
        customUpload: customUploadImage,
      },
    },
  };
});

function handleCreated(editor: any) {
  editorRef.value = editor;
}

onMounted(() => {
  initUppy(); // 确保组件挂载时 Uppy 被初始化
});

onBeforeUnmount(() => {
  editorRef.value?.destroy();
  // ⭐ 销毁 Uppy 实例
  uppyRef.value?.destroy();
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
  <div v-if="props.mode === 'inline'" class="vben-wangeditor border-border rounded-md border">
    <Toolbar :editor="editorRef" :default-config="props.toolbarConfig" class="vben-wangeditor-toolbar border-border border-b px-2 py-1" />

    <Editor v-model="valueHtml" :default-config="finalEditorConfig" :style="{ height: `${props.height}px` }" class="vben-wangeditor-editor px-2 py-2" @on-created="handleCreated" />
  </div>

  <div v-else class="flex items-center gap-3">
    <a-button @click="openModal">
      <template #icon>
        <IconifyIcon icon="mdi:invoice-text-edit-outline" />
      </template>
      {{ t('page.richTextEditor.editContent') }}
    </a-button>

    <div v-if="textLen" class="hover:text-regular hover:border-border-strong border-border bg-card text-primary hover:bg-muted rounded-md border p-1 px-2 transition-all">
      {{ t('page.richTextEditor.textContent', { len: textLen }) }}
    </div>

    <Modal v-model:open="showModal" :title="t('page.richTextEditor.editContent')" width="1200px" @ok="handleOk" @cancel="() => (showModal = false)">
      <div class="vben-wangeditor border-border rounded-md border">
        <Toolbar :editor="editorRef" :default-config="props.toolbarConfig" class="vben-wangeditor-toolbar border-border border-b px-2 py-1" />

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
  color: hsl(var(--foreground));
  background-color: hsl(var(--background));
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
  background-color: rgb(255 255 255 / 8%) !important;
}

:global(.dark .vben-wangeditor .w-e-text-container),
:global(.dark .vben-wangeditor .w-e-textarea),
:global(.dark .vben-wangeditor .w-e-scroll) {
  color: hsl(var(--foreground)) !important;
  background-color: hsl(var(--background)) !important;
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
