<script setup lang="ts">
import type { TusBody } from '@uppy/tus';
import type { UploadFile } from 'ant-design-vue';

import { onBeforeUnmount, ref } from 'vue';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import XHRUpload from '@uppy/xhr-upload';
import { message } from 'ant-design-vue';

import { getTusFileInfo, getTusUrl, getUploadUrl } from '#/api/core/upload';

const props = withDefaults(
  defineProps<{
    isPrivate?: boolean;
  }>(),
  {
    isPrivate: false,
  },
);

const TUS_ENDPOINT = getTusUrl();
const SIMPLE_ENDPOINT = getUploadUrl();
const BIG_FILE_THRESHOLD = 5 * 1024 * 1024;

type Meta = Record<string, unknown>;

// 为了在模板中类型推导更完善，增加明确的接口定义
interface UIFile extends Omit<UploadFile, 'status'> {
  downloadUrl?: string;
  engine: 'tus' | 'xhr';
  eta: number;
  fileId?: string;
  isStart: boolean;
  name: string;
  paused: boolean;
  percent: number;
  speed: number;
  status: 'done' | 'error' | 'paused' | 'uploading' | 'wait';
  totalMB: number;
  uid: string;
  uploadedMB: number;
  uppyId: string;
}

const uploadFiles = ref<UIFile[]>([]);

// =================================
// 引擎初始化 (保持不变)
// =================================
const uppyTus = new Uppy<Meta, TusBody>({ autoProceed: false, id: 'uppy-tus' }).use(Tus, {
  endpoint: TUS_ENDPOINT,
  chunkSize: BIG_FILE_THRESHOLD,
  limit: 1,
  retryDelays: [1000, 3000],
  removeFingerprintOnSuccess: true,
});

const uppyXhr = new Uppy<Meta, TusBody>({ autoProceed: false, id: 'uppy-xhr' }).use(XHRUpload, {
  endpoint: SIMPLE_ENDPOINT,
  fieldName: 'file',
  formData: true,
  bundle: false,
});

// =============================
// 统一事件监听 (增强响应式同步)
// =============================
const progressData = new Map<string, { lastBytes: number; lastTime: number }>();

function bindEvents(instance: Uppy<Meta, TusBody>, engineType: 'tus' | 'xhr') {
  instance.on('file-added', (file) => {
    const target = uploadFiles.value.find((f) => f.uid === file.meta.uid);
    if (target) target.uppyId = file.id;
  });

  instance.on('upload-progress', (file, progress) => {
    const target = uploadFiles.value.find((f) => f.uppyId === file?.id);
    if (!target || !progress.bytesTotal) return;

    const now = Date.now();
    const pd = progressData.get(file!.id) ?? { lastBytes: progress.bytesUploaded, lastTime: now };
    const deltaBytes = progress.bytesUploaded - pd.lastBytes;
    const deltaTime = (now - pd.lastTime) / 1000;

    const speed = deltaTime > 0 ? deltaBytes / 1024 / 1024 / deltaTime : 0;
    const remaining = progress.bytesTotal - progress.bytesUploaded;

    target.speed = speed;
    target.eta = speed > 0 ? remaining / 1024 / 1024 / speed : 0;
    target.percent = Number(((progress.bytesUploaded / progress.bytesTotal) * 100).toFixed(2));
    target.uploadedMB = progress.bytesUploaded / 1024 / 1024;
    target.totalMB = progress.bytesTotal / 1024 / 1024;
    target.status = 'uploading';
    target.paused = false;

    progressData.set(file!.id, { lastBytes: progress.bytesUploaded, lastTime: now });
  });

  // 🌟 核心修复：抹平 TUS 和 XHR 成功后的数据结构差异
  instance.on('upload-success', (file, response: any) => {
    const target = uploadFiles.value.find((f) => f.uppyId === file?.id);
    if (!target) return;

    target.status = 'done';
    target.percent = 100;
    target.speed = 0;
    target.eta = 0;

    if (engineType === 'tus') {
      const tusUrl = response?.uploadURL || (file as any).uploadURL;
      if (tusUrl) {
        target.fileId = tusUrl.split('/').pop();
        // TUS 上传成功后，最好不要直接用 tusUrl 下载，因为那是临时分片接口
        // 建议等调完 getTusFileInfo 拿到真实路径后再赋值，这里先不给 downloadUrl
      }
    } else {
      // XHR 解析咱们后端的标准结构：{ code: 200, data: { id, path } }
      const xhrData = response?.body?.data;
      if (xhrData) {
        target.fileId = xhrData.id;
        target.downloadUrl = xhrData.fullUrl || xhrData.path;
      }
    }
    message.success(`上传成功：${file?.name}`);
  });

  instance.on('upload-error', (file) => {
    const target = uploadFiles.value.find((f) => f.uppyId === file?.id);
    if (target) target.status = 'error';
  });

  // 同步真正的暂停状态
  instance.on('upload-pause', (file) => {
    const target = uploadFiles.value.find((f) => f.uppyId === file?.id);
    if (target) {
      target.paused = true;
      target.status = 'paused';
    }
  });
}

bindEvents(uppyTus, 'tus');
bindEvents(uppyXhr, 'xhr');

onBeforeUnmount(() => {
  uppyTus.destroy();
  uppyXhr.destroy();
});

// =================================
// 交互逻辑
// =================================
function handleBeforeUpload(raw: any) {
  // 🌟 1. 核心体验优化：查重拦截！
  // 检查队列中是否已经存在 [同名] 且 [同大小] 且 [还没传完] 的文件
  const isDuplicate = uploadFiles.value.some((f) => {
    // raw.size 是字节，我们要和之前存的 totalMB 换算比对一下，或者直接比对原始大小，为了保险我们通过名字和近似大小判断
    const isSameFile = f.name === raw.name && Math.abs(f.totalMB - raw.size / 1024 / 1024) < 0.01;
    const isUnfinished = ['paused', 'uploading', 'wait'].includes(f.status);
    return isSameFile && isUnfinished;
  });

  if (isDuplicate) {
    message.warning(`文件 [${raw.name}] 已在上传队列中，请勿重复添加！`);
    return false; // 直接打回，不让它进 Uppy，也不让它进 UI 列表
  }

  // 2. 正常走接下来的流程
  const isBigFile = raw.size > BIG_FILE_THRESHOLD;
  const targetEngine = isBigFile ? 'tus' : 'xhr';

  uploadFiles.value.push({
    uid: raw.uid,
    name: raw.name,
    status: 'wait',
    percent: 0,
    uppyId: '',
    speed: 0,
    eta: 0,
    isStart: false,
    paused: false,
    engine: targetEngine,
    totalMB: raw.size / 1024 / 1024,
    uploadedMB: 0,
  });

  const targetUppy = isBigFile ? uppyTus : uppyXhr;

  targetUppy.addFile({
    data: raw,
    name: raw.name,
    type: raw.type,
    meta: {
      uid: raw.uid,
      isPrivate: props.isPrivate ? '1' : '0',
    },
  });

  return false;
}

function handleRemove(file: UIFile) {
  if (file.uppyId) {
    const currentUppy = file.engine === 'tus' ? uppyTus : uppyXhr;
    const uppyFile = currentUppy.getFile(file.uppyId);

    // 发送 DELETE 请求终止任务
    if (file.engine === 'tus' && uppyFile?.uploadURL) {
      fetch(uppyFile.uploadURL, { method: 'DELETE', headers: { 'Tus-Resumable': '1.0.0' } });
    }
    currentUppy.removeFile(file.uppyId);
  }
  uploadFiles.value = uploadFiles.value.filter((f) => f.uid !== file.uid);
}

function handleToggleAction(file: UIFile) {
  const currentUppy = file.engine === 'tus' ? uppyTus : uppyXhr;

  if (!file.isStart) {
    currentUppy.upload();
    file.isStart = true;
  } else if (file.status === 'error') {
    currentUppy.retryUpload(file.uppyId);
  } else if (file.paused) {
    currentUppy.resume(file.uppyId);
  } else {
    currentUppy.pauseResume(file.uppyId);
  }
}

async function handleDownload(file: UIFile) {
  if (!file.fileId) return message.warning('无法获取文件 ID');

  // 如果是 TUS 或者后端没直接返回完整 URL，就调接口拿取真身
  if (!file.downloadUrl) {
    try {
      const res: any = await getTusFileInfo({ fileId: file.fileId });
      // 假设接口返回结构里有 fullUrl
      file.downloadUrl = res.data?.fullUrl || res.fullUrl;
    } catch {
      return message.error('获取文件下载地址失败');
    }
  }

  if (file.downloadUrl) {
    window.open(file.downloadUrl, '_blank');
  }
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

    <template #itemRender="{ file: rawFile }">
      <a-list
        item-layout="horizontal"
        :data-source="[rawFile as UIFile]"
        class="hover:text-regular mt-2 rounded-md border bg-card transition-all hover:bg-gray-100 dark:bg-gray-800 hover:dark:bg-gray-900"
      >
        <template #renderItem="{ item: file }">
          <a-list-item>
            <template #actions>
              <a-button v-if="!file.isStart" type="link" size="small" @click.stop="handleToggleAction(file)"> 上传 </a-button>
              <a-button v-else-if="file.status === 'error'" type="link" size="small" @click.stop="handleToggleAction(file)"> 重试 </a-button>
              <a-button v-else-if="file.status !== 'done'" type="link" size="small" @click.stop="handleToggleAction(file)">
                {{ file.paused ? '继续' : '暂停' }}
              </a-button>

              <a-button type="link" size="small" :disabled="file.status !== 'done'" @click.stop="handleDownload(file)"> 下载 </a-button>
              <a-button type="link" danger size="small" @click.stop="handleRemove(file)"> 删除 </a-button>
            </template>

            <a-list-item-meta>
              <template #title>
                {{ file.name }}
                <a-tag class="ml-2" :color="file.engine === 'tus' ? 'blue' : 'green'">
                  {{ file.engine === 'tus' ? '大文件加速' : '普通极速' }}
                </a-tag>
                <a-tag class="ml-2" :color="props.isPrivate ? 'red' : 'cyan'">
                  {{ props.isPrivate ? '私密资源' : '公开资源' }}
                </a-tag>

                <span v-if="['uploading', 'paused'].includes(file.status)" class="ml-1 text-gray-500">
                  （{{ file.uploadedMB?.toFixed(2) }} MB / {{ file.totalMB?.toFixed(2) }} MB， {{ file.speed?.toFixed(2) }} MB/s， 剩余 {{ file.eta?.toFixed(1) }}s）
                </span>
              </template>

              <template #description>
                <a-progress
                  :percent="file.percent"
                  :status="file.status === 'error' ? 'exception' : file.status === 'done' ? 'success' : 'normal'"
                  :stroke-color="file.paused ? '#faad14' : '#1677ff'"
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
