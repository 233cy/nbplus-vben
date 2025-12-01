<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

import AwsS3 from '@uppy/aws-s3';
import Uppy from '@uppy/core';
import { Button, message, Upload } from 'ant-design-vue';

// Antd 的文件列表
const fileList = ref<any[]>([]);

// 你的后端 API 根地址
const API_BASE = 'http://10.8.0.4:9501';

// 创建 Uppy 实例
const uppy = new Uppy({
  autoProceed: true,
  allowMultipleUploadBatches: true,
}).use(AwsS3, {
  shouldUseMultipart(file) {
    return file.size > 100 * 1024 * 1024;
  },
  async getUploadParameters(file, { signal }) {
    const res = await fetch(`${API_BASE}/s3/sign-put`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
      }),
    });

    if (!res.ok) {
      throw new Error('获取 PUT 签名失败');
    }

    // 后端返回：{ url, headers }
    const data = await res.json();

    // Uppy 需要的返回格式：
    // { method, url, fields, headers }
    return {
      method: 'PUT',
      url: data.url,
      fields: {}, // presigned PUT 不用 fields
      headers: data.headers || {
        'content-type': file.type || 'application/octet-stream',
      },
    };
  },

  // Multipart：创建上传
  async createMultipartUpload(file) {
    const res = await fetch(`${API_BASE}/s3/multipart/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
      }),
    });

    if (!res.ok) {
      throw new Error('创建 multipart 失败');
    }

    const data = await res.json();
    console.warn('🔥 createMultipartUpload 返回：', data);

    return data; // ⭐ 必须 return data
  },

  // Multipart：为某一分片签名
  async signPart(_file, { uploadId, key, partNumber, signal }) {
    console.log('signPart 参数：', uploadId, key, partNumber);
    const res = await fetch(`${API_BASE}/s3/multipart/sign`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        key,
        partNumber,
      }),
    });

    if (!res.ok) {
      throw new Error('签名分片失败');
    }

    // 必须返回：{ url, headers? }
    return res.json();
  },

  // Multipart：完成上传
  async completeMultipartUpload(_file, { uploadId, key, parts }) {
    const res = await fetch(`${API_BASE}/s3/multipart/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        key,
        parts,
      }),
    });

    if (!res.ok) {
      throw new Error('完成 multipart 失败');
    }

    // 建议返回：{ location, bucket, key }
    return res.json();
  },

  // 可选：取消 Multipart
  async abortMultipartUpload(_file, { uploadId, key }) {
    console.log('🔥 abortMultipartUpload:', uploadId, key);

    await fetch(`${API_BASE}/s3/multipart/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        key,
      }),
    });
  },
} as any);

// ----------------------
// Uppy → Antd 进度同步
// ----------------------
uppy.on('upload-progress', (file, progress) => {
  const target = fileList.value.find((f) => f.uid === file.meta.uid);
  if (target) {
    target.percent = progress.bytesTotal ? Number(((progress.bytesUploaded / progress.bytesTotal) * 100).toFixed(2)) : 0;
  }
});

// ----------------------
// Uppy → Antd 上传成功
// ----------------------
uppy.on('upload-success', (file, response) => {
  const target = fileList.value.find((f) => f.uid === file.meta.uid);
  if (target) {
    target.status = 'done';

    const body = response?.body || {};
    // 后端 completeMultipart / sign-put 最好返回 location
    target.url = body.location || body.url || '';

    message.success(`上传成功：${file.name}`);
  }
});

// 错误处理
uppy.on('error', (err) => {
  console.error(err);
  message.error(`上传失败：${err.message}`);
});

// 组件卸载时清理 Uppy
onBeforeUnmount(() => {
  uppy.close();
});

// Antd beforeUpload：阻止默认上传，交给 Uppy
function beforeUpload(file: any) {
  const uid = file.uid;

  fileList.value.push({
    uid,
    name: file.name,
    status: 'uploading',
    percent: 0,
  });

  uppy.addFile({
    name: file.name,
    type: file.type,
    data: file,
    meta: { uid },
  });

  return false;
}
</script>

<template>
  <Upload :before-upload="beforeUpload" :file-list="fileList" :show-upload-list="true">
    <Button>选择文件</Button>
  </Upload>
</template>
