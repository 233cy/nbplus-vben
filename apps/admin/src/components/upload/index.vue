<script setup lang="ts">
import type { TusBody } from '@uppy/tus';
import type { UploadFile } from 'ant-design-vue';

import { onBeforeUnmount, ref } from 'vue';

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import XHRUpload from '@uppy/xhr-upload';
import { message } from 'ant-design-vue';

import { deleteOssFile, getTusFileInfo, getTusUrl, getUploadUrl } from '#/api/core/upload';

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
  logicalPath?: string; // 🌟 新增：存放 public://xxx.png
}

const uploadFiles = ref<UIFile[]>([]);

// =================================
// 引擎初始化
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
// 统一事件监听
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

  instance.on('upload-success', (file, response: any) => {
    const target = uploadFiles.value.find((f) => f.uppyId === file?.id);
    if (!target) return;

    target.status = 'done';
    target.percent = 100;

    if (engineType === 'tus') {
      const tusUrl = response?.uploadURL || (file as any).uploadURL;
      if (tusUrl) {
        target.fileId = tusUrl.split('/').pop();
        // 🌟 TUS 转存是异步的，通过获取文件信息接口，拿到转存后的 logicalPath
        getTusFileInfo({ uploadKey: target.fileId }).then((res: any) => {
          // 根据你后端的实际返回结构取值
          target.logicalPath = res.logicalPath;
          target.downloadUrl = res.fullUrl;
        });
      }
    } else {
      // 🌟 普通 XHR 上传，后端直接在响应里返回了 logicalPath
      const xhrData = response?.body?.data;
      if (xhrData) {
        target.fileId = xhrData.uploadKey; // 可能没有 fileId，因为不是 TUS 协议了，但我们可以用 uploadKey 来标识这个文件
        target.logicalPath = xhrData.logicalPath;
        target.downloadUrl = xhrData.fullUrl;
      }
    }
    message.success(`上传成功：${file?.name}`);
  });

  instance.on('upload-error', (file) => {
    const target = uploadFiles.value.find((f) => f.uppyId === file?.id);
    if (target) target.status = 'error';
  });

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
  // 🌟 1. 智能重命名逻辑：检测UI列表中是否已有同名文件
  let finalName = raw.name;
  let count = 1;

  // 安全地分离文件名和后缀 (例如: "document.pdf" -> "document" 和 ".pdf")
  const lastDotIndex = finalName.lastIndexOf('.');
  const baseName = lastDotIndex === -1 ? finalName : finalName.slice(0, Math.max(0, lastDotIndex));
  const ext = lastDotIndex === -1 ? '' : finalName.slice(Math.max(0, lastDotIndex));

  // 如果发现重名，就自动累加序号，直到名字唯一
  while (uploadFiles.value.some((f) => f.name === finalName)) {
    finalName = `${baseName}(${count})${ext}`;
    count++;
  }

  // 🌟 2. 伪造全新的 File 对象 (0 内存开销，只是创建了一个新引用指向原硬盘数据)
  // 这会彻底骗过 Uppy，让它认为这是一个 100% 陌生的新文件！
  const renamedRaw = new File([raw], finalName, {
    type: raw.type,
    lastModified: raw.lastModified,
  }) as any;
  renamedRaw.uid = raw.uid; // 保留 Ant Design Vue 的原生防重 uid

  // 3. 后续逻辑全部使用 renamedRaw
  const isBigFile = renamedRaw.size > BIG_FILE_THRESHOLD;
  const targetEngine = isBigFile ? 'tus' : 'xhr';

  uploadFiles.value.push({
    uid: renamedRaw.uid,
    name: renamedRaw.name, // UI 列表将展示重命名后的名字
    status: 'wait',
    percent: 0,
    uppyId: '',
    speed: 0,
    eta: 0,
    isStart: false,
    paused: false,
    engine: targetEngine,
    totalMB: renamedRaw.size / 1024 / 1024,
    uploadedMB: 0,
  });

  const targetUppy = isBigFile ? uppyTus : uppyXhr;

  targetUppy.addFile({
    data: renamedRaw, // 传入伪造的新文件对象
    name: renamedRaw.name,
    type: renamedRaw.type,
    meta: {
      uid: renamedRaw.uid,
      isPrivate: props.isPrivate ? '1' : '0',
    },
  });

  return false; // 拦截默认上传
}

async function handleRemove(file: UIFile) {
  // 🌟 阶段 A：文件已经成为正式资产 (状态为 done)
  if (file.status === 'done') {
    if (file.logicalPath) {
      try {
        // 调用我们自己写的后端业务删除接口，传入 public://...
        await deleteOssFile({ logicalPath: file.logicalPath });
        message.success('已彻底抹除服务器上的源文件');
      } catch {
        message.error('文件删除失败，请检查网络或权限');
        return; // 接口报错时，拦截前端移除 UI
      }
    }
  }
  // 🌟 阶段 B：文件还是临时碎片 (上传中 / 暂停中 / 算 Hash 中)
  else if (file.engine === 'tus' && file.fileId) {
    // 按照 TUS 协议，直接向对应的 fileId 发送 DELETE 请求
    const tusDeleteUrl = `${TUS_ENDPOINT}/${file.fileId}`;
    fetch(tusDeleteUrl, {
      method: 'DELETE',
      headers: { 'Tus-Resumable': '1.0.0' },
    }).catch(() => console.warn('TUS 临时文件清理失败'));
  }

  // 无论哪种情况，清理成功后从 Uppy 队列和 Vue 列表中抹除
  if (file.uppyId) {
    const currentUppy = file.engine === 'tus' ? uppyTus : uppyXhr;
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
  if (!file.downloadUrl) {
    try {
      const res: any = await getTusFileInfo({ uploadKey: file.fileId });
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
