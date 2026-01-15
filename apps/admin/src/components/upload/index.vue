<script setup lang="ts">
import type { TusBody } from '@uppy/tus';
import type { UploadFile } from 'ant-design-vue';

import { onBeforeUnmount, ref } from 'vue';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import XHRUpload from '@uppy/xhr-upload'; // ⭐ 1. 引入 XHR 插件
import { message } from 'ant-design-vue';

// === 基础配置 ===
const API_BASE = 'http://10.8.0.4:2330';
const TUS_ENDPOINT = `${API_BASE}/tus`;
const SIMPLE_ENDPOINT = `${API_BASE}/upload/simple`; // ⭐ 2. 普通上传接口
const BIG_FILE_THRESHOLD = 5 * 1024 * 1024; // ⭐ 3. 5MB 阈值

type Meta = Record<string, unknown>;

// ================================
// 上传文件类型定义
// ================================

type UIFile = {
  downloadUrl?: string;
  // ⭐ 4. 新增字段：标记该文件属于哪个引擎
  engine: 'tus' | 'xhr';
  eta?: number;
  isStart: boolean;
  name: string;
  paused?: boolean;
  percent: number;
  speed?: number;
  status: string;
  totalMB?: number;
  uid: string;
  uploadedMB?: number;

  uppyId: string;
} & UploadFile;

const uploadFiles = ref<UIFile[]>([]);

// =================================
// ⭐ 5. 双引擎初始化
// =================================

// 引擎 A: Tus (大文件)
const uppyTus = new Uppy<Meta, TusBody>({
  autoProceed: false,
  id: 'uppy-tus', // 唯一ID
}).use(Tus, {
  endpoint: TUS_ENDPOINT,
  chunkSize: 5 * 1024 * 1024,
  limit: 1,
  retryDelays: [1000, 3000],
  removeFingerprintOnSuccess: false,
});

// 引擎 B: XHR (小文件)
const uppyXhr = new Uppy<Meta, TusBody>({
  autoProceed: false,
  id: 'uppy-xhr', // 唯一ID
}).use(XHRUpload, {
  endpoint: SIMPLE_ENDPOINT,
  fieldName: 'file', // 后端接收的字段名
  formData: true,
  bundle: false, // 设为 false 确保每个文件单独请求
});

// =============================
// ⭐ 6. 统一事件绑定逻辑
// =============================
const progressData = new Map<string, { lastBytes: number; lastTime: number }>();

function bindEvents(instance: Uppy<Meta, TusBody>) {
  // 绑定 uppyId
  instance.on('file-added', (file) => {
    const target = uploadFiles.value.find((f) => f.uid === file.meta.uid);
    if (target) target.uppyId = file.id;
  });

  // 进度
  instance.on('upload-progress', (file, progress) => {
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

  // 成功
  instance.on('upload-success', (file, response: any) => {
    const files = file!;
    const target = uploadFiles.value.find((f) => f.uppyId === files.id);
    if (!target) return;

    target.status = 'done';
    target.percent = 100;
    target.speed = 0;
    target.eta = 0;

    // Tus 和 XHR 返回的 URL 结构可能不同，需兼容
    // Tus 通常在 response.uploadURL
    // XHR 通常在 response.body.url (取决于你后端返回的 JSON 结构)
    const url = response?.uploadURL || response?.body?.url || (file as any).uploadURL;

    if (url) target.downloadUrl = url;
    message.success(`上传成功：${files.name}`);
  });

  // 错误
  instance.on('upload-error', (file) => {
    const files = file!;
    const target = uploadFiles.value.find((f) => f.uppyId === files.id);
    if (target) target.status = 'error';
  });
}

// 对两个实例应用相同的逻辑
bindEvents(uppyTus);
bindEvents(uppyXhr);

onBeforeUnmount(() => {
  uppyTus.destroy();
  uppyXhr.destroy();
});

// =================================
// Antd Upload 交互
// =================================
function handleBeforeUpload(raw: any, _fileList: any) {
  // ⭐ 7. 核心分流逻辑
  const isBigFile = raw.size > BIG_FILE_THRESHOLD;
  const targetEngine = isBigFile ? 'tus' : 'xhr';

  uploadFiles.value.push({
    uid: raw.uid,
    name: raw.name,
    status: 'uploading',
    percent: 0,
    uppyId: '',
    speed: 0,
    eta: 0,
    isStart: false,
    engine: targetEngine, // 记录引擎
  });

  // 添加到对应的 Uppy 实例
  const targetUppy = isBigFile ? uppyTus : uppyXhr;

  targetUppy.addFile({
    data: raw,
    name: raw.name,
    type: raw.type,
    meta: { uid: raw.uid },
  });

  return false;
}

// 辅助函数：根据文件获取对应的 Uppy 实例
function getUppyInstance(file: UIFile) {
  return file.engine === 'tus' ? uppyTus : uppyXhr;
}

function handleRemove(file: UIFile) {
  if (file.uppyId) {
    const currentUppy = getUppyInstance(file);
    const uppyFile = currentUppy.getFile(file.uppyId);

    // Tus 才需要发送 DELETE 请求，普通上传通常不需要（或者是不同接口）
    if (file.engine === 'tus' && uppyFile?.uploadURL) {
      fetch(uppyFile.uploadURL, {
        method: 'DELETE',
        headers: { 'Tus-Resumable': '1.0.0' },
      });
    }

    currentUppy.removeFile(file.uppyId);
  }

  uploadFiles.value = uploadFiles.value.filter((f) => f.uid !== file.uid);
  return false;
}

function handleToggleAction(file: UIFile) {
  const currentUppy = getUppyInstance(file);

  if (file.isStart === false) {
    // ⭐ 8. 只上传指定文件，避免 uppy.upload() 触发所有
    // 虽然 Uppy 默认行为是 upload() 触发所有，但我们可以通过 fileID 过滤
    // 但更简单的做法是：因为 autoProceed 是 false，我们可以只针对该文件所在的实例触发
    // 最好的方式是：uppy.upload() 会上传该实例所有 PENDING 的文件
    // 如果想要单文件控制，Uppy 官方推荐是全部入队，一次性 upload。
    // 如果你非要点一个传一个，直接 call upload() 即可，它会处理所有处于“待上传”状态的文件
    currentUppy.upload();
    file.isStart = true;
  } else if (file.status === 'error') {
    currentUppy.retryUpload(file.uppyId);
  } else {
    // 暂停/继续
    // 注意：XHR 上传通常不支持“暂停”，它只会 Abort（取消），再点继续相当于重传
    // Tus 支持真正的暂停
    currentUppy.pauseResume(file.uppyId);
    const updated = currentUppy.getFile(file.uppyId);
    file.paused = !!updated?.isPaused;
  }
}

function handleDownload(file: UIFile) {
  if (!file.downloadUrl) return message.warning('文件未上传完成');
  // 假设后端返回的 path 需要拼接或已经是完整 URL
  window.open(file.downloadUrl, '_blank');
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
    :show-upload-list="{ showRemoveIcon: false, showDownloadIcon: false, showPreviewIcon: false }"
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
                <a-tag class="ml-2" :color="findUIFile(file).engine === 'tus' ? 'blue' : 'green'">
                  {{ findUIFile(file).engine === 'tus' ? '大文件加速' : '普通上传' }}
                </a-tag>

                <span v-if="findUIFile(file).status === 'uploading'" class="ml-1 text-gray-500">
                  （{{ findUIFile(file).uploadedMB?.toFixed(2) }} MB / {{ findUIFile(file).totalMB?.toFixed(2) }} MB， {{ findUIFile(file).speed?.toFixed(2) }} MB/s， 剩余
                  {{ findUIFile(file).eta?.toFixed(1) }}s）
                </span>
              </template>
              <template #description>
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
