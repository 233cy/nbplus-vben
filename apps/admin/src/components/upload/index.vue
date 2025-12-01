<script setup lang="ts">
import type { AwsBody } from '@uppy/aws-s3';

import { onBeforeUnmount, ref } from 'vue';

import AwsS3 from '@uppy/aws-s3';
import Uppy from '@uppy/core';
import { Button, message, Upload } from 'ant-design-vue';

// ---------- 基本配置 ----------
const API_BASE = 'http://10.8.0.4:9501'; // 你的 Hyperf API

// antd 的 fileList
const fileList = ref<any[]>([]);

// Uppy 泛型：Meta / Body
type Meta = Record<string, unknown>;

const uppy = new Uppy<Meta, AwsBody>({
  autoProceed: true,
  allowMultipleUploadBatches: true,
}).use(AwsS3, {
  // 1) 决定什么时候走 Multipart
  shouldUseMultipart(file) {
    // 大于 $maxFile MB 走 切片上传
    const maxFile = 5;
    return (file.size ?? 0) > maxFile * 1024 * 1024;
  },

  // 2) 普通 PUT：小文件
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

    const data = await res.json();
    // Uppy 需要：method / url / fields / headers:contentReference[oaicite:2]{index=2}
    return {
      method: 'PUT',
      url: data.url,
      fields: {},
      headers: data.headers || {
        'content-type': file.type || 'application/octet-stream',
      },
    };
  },

  // 3) 创建 Multipart Upload
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
    // 必须返回：{ uploadId, key }:contentReference[oaicite:3]{index=3}
    return data;
  },

  // 4) 为某一分片签名
  async signPart(file, { uploadId, key, partNumber, signal }) {
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

    // 必须返回：{ url, headers? }:contentReference[oaicite:4]{index=4}
    return res.json();
  },

  // 5) 查询已上传的分片（用于断点续传等）
  async listParts(file, { uploadId, key }) {
    const res = await fetch(`${API_BASE}/s3/multipart/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        key,
      }),
    });

    if (!res.ok) {
      throw new Error('获取分片列表失败');
    }

    // 返回 S3 风格 parts 数组：[{ PartNumber, Size, ETag }, ...]:contentReference[oaicite:5]{index=5}
    return res.json();
  },

  // 6) 完成 Multipart
  async completeMultipartUpload(file, { uploadId, key, parts }) {
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

    // 建议返回：{ location, key }
    return res.json();
  },

  // 7) 取消 Multipart（中止上传）
  async abortMultipartUpload(file, { uploadId, key }) {
    await fetch(`${API_BASE}/s3/multipart/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, key }),
    });
  },
});

// ---------- Uppy → Antd 同步 ----------
uppy.on('upload-progress', (file, progress) => {
  const f = file!; // 告诉 TS：file 不可能是 null/undefined
  const t = fileList.value.find((val) => val.uid === f.meta.uid);
  if (t) {
    t.percent = progress.bytesTotal ? Number(((progress.bytesUploaded / progress.bytesTotal) * 100).toFixed(2)) : 0;
  }
});

uppy.on('upload-success', (file, response) => {
  const f = file!; // 告诉 TS：file 不可能是 null/undefined
  const t = fileList.value.find((val) => val.uid === f.meta.uid);
  if (t) {
    t.status = 'done';
    const body = (response?.body ?? {}) as {
      location?: string;
      url?: string;
    };
    t.url = body.location || body.url || '';
    message.success(`上传成功：${f.name}`);
  }
});

uppy.on('error', (err) => {
  console.error(err);
  message.error(`上传失败：${err.message}`);
});

onBeforeUnmount(() => {
  uppy.destroy();
});

// Antd 的 beforeUpload：阻止默认上传，交给 Uppy
function beforeUpload(file: any) {
  fileList.value.push({
    uid: file.uid,
    name: file.name,
    status: 'uploading',
    percent: 0,
  });

  uppy.addFile({
    name: file.name,
    type: file.type,
    data: file,
    meta: { uid: file.uid },
  });

  return false;
}
</script>

<template>
  <Upload :before-upload="beforeUpload" :file-list="fileList" :show-upload-list="true">
    <Button>选择文件</Button>
  </Upload>
</template>
