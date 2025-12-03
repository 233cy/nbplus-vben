<script setup lang="ts">
import type { TusBody } from '@uppy/tus';
import type { UploadFile } from 'ant-design-vue';

import { onBeforeUnmount, ref } from 'vue';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { message } from 'ant-design-vue';

type Meta = Record<string, unknown>;

// === 基础配置 ===
const API_BASE = 'http://10.8.0.4:9501';
const TUS_ENDPOINT = `${API_BASE}/tus`;

// ================================
// 上传文件类型定义
// ================================

type UIFile = {
  downloadUrl?: string;
  eta?: number; // 秒
  isStart: boolean;

  name: string;
  paused?: boolean;
  percent: number;

  speed?: number; // MB/s
  status: string;
  totalMB?: number;
  uid: string;
  uploadedMB?: number;

  uppyId: string;
} & UploadFile;

const uploadFiles = ref<UIFile[]>([]);

// =================================
// Uppy 初始化 + Tus
// =================================
const uppy = new Uppy<Meta, TusBody>({
  autoProceed: false,
  allowMultipleUploadBatches: true,
}).use(Tus, {
  endpoint: TUS_ENDPOINT,
  chunkSize: 5 * 1024 * 1024,
  retryDelays: [],
  removeFingerprintOnSuccess: false,
});

// 绑定 uppyId
uppy.on('file-added', (file) => {
  const target = uploadFiles.value.find((f) => f.uid === file.meta.uid);
  if (target) target.uppyId = file.id;
});

// =============================
// 上传进度
// =============================
const progressData = new Map<string, { lastBytes: number; lastTime: number }>();
uppy.on('upload-progress', (file, progress) => {
  const files = file!;
  const target = uploadFiles.value.find((f) => f.uppyId === files.id);
  if (!target || !progress.bytesTotal) return;

  const now = Date.now();
  const pd = progressData.get(files.id) ?? {
    lastBytes: progress.bytesUploaded,
    lastTime: now,
  };

  const deltaBytes = progress.bytesUploaded - pd.lastBytes;
  const deltaTime = (now - pd.lastTime) / 1000;

  const speed = deltaTime > 0 ? deltaBytes / 1024 / 1024 / deltaTime : 0;
  const remaining = progress.bytesTotal - progress.bytesUploaded;
  const eta = speed > 0 ? remaining / 1024 / 1024 / speed : 0;

  target.speed = speed;
  target.eta = eta;
  target.percent = Number(((progress.bytesUploaded / progress.bytesTotal) * 100).toFixed(2));
  target.uploadedMB = progress.bytesUploaded / 1024 / 1024;
  target.totalMB = progress.bytesTotal / 1024 / 1024;
  target.status = 'uploading';

  progressData.set(files.id, {
    lastBytes: progress.bytesUploaded,
    lastTime: now,
  });
});

// =============================
// 上传成功
// =============================
uppy.on('upload-success', (file, response: any) => {
  const files = file!;
  const target = uploadFiles.value.find((f) => f.uppyId === files.id);
  if (!target) return;

  target.status = 'done';
  target.percent = 100;
  target.speed = 0;
  target.eta = 0;

  const url = response?.uploadURL || (file as any).uploadURL;
  if (url) target.downloadUrl = url;

  message.success(`上传成功：${files.name}`);
});

// 错误
uppy.on('upload-error', (file) => {
  const files = file!;
  const target = uploadFiles.value.find((f) => f.uppyId === files.id);
  if (target) target.status = 'error';
});

onBeforeUnmount(() => uppy.destroy());

// =================================
// Antd Upload 交互
// =================================
function handleBeforeUpload(raw: any, fileList: any) {
  console.log(raw, fileList);
  uploadFiles.value.push({
    uid: raw.uid,
    name: raw.name,
    status: 'uploading',
    percent: 0,
    uppyId: '',
    speed: 0,
    eta: 0,
    isStart: false,
  });

  uppy.addFile({
    data: raw,
    name: raw.name,
    type: raw.type,
    meta: { uid: raw.uid },
  });

  return false;
}

function handleRemove(file: UIFile) {
  // if (file.uppyId) uppy.removeFile(file.uppyId);
  // uploadFiles.value = uploadFiles.value.filter((f) => f.uid !== file.uid);
  // return false;
  if (file.uppyId) {
    const uppyFile = uppy.getFile(file.uppyId);
    const uploadURL = uppyFile?.uploadURL;

    // ⭐ 1. 先发 DELETE 请求到 tus server
    if (uploadURL) {
      fetch(uploadURL, {
        method: 'DELETE',
        headers: {
          'Tus-Resumable': '1.0.0',
        },
      });
    }

    // ⭐ 2. 再从 Uppy 队列移除
    uppy.removeFile(file.uppyId);
  }

  // 3. 删除 UI 列表
  uploadFiles.value = uploadFiles.value.filter((f) => f.uid !== file.uid);

  return false;
}

function handleToggleAction(file: UIFile) {
  if (file.isStart === false) {
    uppy.upload();
    file.isStart = true;
  } else if (file.status === 'error') {
    uppy.retryUpload(file.uppyId);
  } else {
    uppy.pauseResume(file.uppyId);
    const updated = uppy.getFile(file.uppyId);
    file.paused = !!updated?.isPaused;
  }
}

function handleDownload(file: UIFile) {
  if (!file.downloadUrl) return message.warning('文件未上传完成');
  window.open(`${file.downloadUrl}/get`, '_blank');
}

function findUIFile(file: any): UIFile {
  const f = uploadFiles.value.find((x) => x.uid === file.uid);
  if (!f) throw new Error(`UIFile not found: ${file.uid}`);
  return f;
}
</script>

<template>
  <a-upload
    :before-upload="handleBeforeUpload"
    :file-list="uploadFiles"
    :show-upload-list="{
      showRemoveIcon: false,
      showDownloadIcon: false,
      showPreviewIcon: false,
    }"
    :custom-request="() => {}"
  >
    <a-button type="primary">选择文件</a-button>

    <template #itemRender="{ file }">
      <a-list
        v-if="findUIFile(file)"
        item-layout="horizontal"
        :data-source="[file]"
        class="hover:text-regular bg-card mt-2 rounded-md border transition-all hover:bg-gray-100 dark:bg-gray-800 hover:dark:bg-gray-900"
      >
        <template #renderItem>
          <a-list-item>
            <template #actions>
              <a-button v-if="findUIFile(file).isStart === false" type="link" size="small" @click.stop="handleToggleAction(findUIFile(file))"> 上传 </a-button>
              <a-button v-else-if="findUIFile(file).status === 'error'" type="link" size="small" @click.stop="handleToggleAction(findUIFile(file))"> 重试 </a-button>
              <a-button v-else type="link" size="small" @click.stop="handleToggleAction(findUIFile(file))">
                {{ findUIFile(file).paused ? '继续' : '暂停' }}
              </a-button>

              <a-button type="link" size="small" :disabled="!findUIFile(file).downloadUrl" @click.stop="handleDownload(findUIFile(file))"> 下载 </a-button>

              <a-button type="link" danger size="small" @click.stop="handleRemove(findUIFile(file))"> 删除 </a-button>
            </template>
            <a-list-item-meta>
              <template #title>
                {{ findUIFile(file).name }}
                <!-- 上传速度 + ETA -->
                <span v-if="findUIFile(file).status === 'uploading'" class="ml-1 text-gray-500">
                  （{{ findUIFile(file).uploadedMB?.toFixed(2) }} MB / {{ findUIFile(file).totalMB?.toFixed(2) }} MB， {{ findUIFile(file).speed?.toFixed(2) }} MB/s， 剩余
                  {{ findUIFile(file).eta?.toFixed(1) }}s）
                </span>
              </template>
              <template #description>
                <!-- 进度条 -->
                <a-progress
                  :percent="findUIFile(file).percent"
                  :status="findUIFile(file).status === 'error' ? 'exception' : findUIFile(file).status === 'done' ? 'success' : undefined"
                  :stroke-color="findUIFile(file).paused ? '#faad14' : '#1677ff'"
                />
              </template>
              <template #avatar>
                <a-avatar src="https://joeschmoe.io/api/v1/random" />
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </template>
  </a-upload>
</template>
