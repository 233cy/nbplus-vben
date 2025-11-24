<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

import AwsS3 from '@uppy/aws-s3';
import Uppy from '@uppy/core';
import { Button, message, Upload } from 'ant-design-vue';

// 注意：我们不再 import '@uppy/core/style.css' 或 '@uppy/dashboard/style.css'
// 因为你说你不需要 Uppy UI

// Antd Upload 的 fileList
const fileList = ref([]);

// 创建 Uppy 实例
const uppy = new Uppy({
  autoProceed: true,
  allowMultipleUploadBatches: true,
}).use(AwsS3, {
  endpoint: 'http://192.168.1.96:9000', // 你的 Hyperf S3 签名服务
  shouldUseMultipart(file) {
    // 大文件自动走分片上传，例如 >50MB
    return file.size > 50 * 1024 * 1024;
  },
});

// 【Uppy → Antd】 上传进度同步到 UI
uppy.on('upload-progress', (file, progress) => {
  const target = fileList.value.find((f) => f.uid === file.meta.uid);
  if (target) {
    target.percent = progress.bytesTotal ? Number(((progress.bytesUploaded / progress.bytesTotal) * 100).toFixed(2)) : 0;
  }
});

// 【Uppy → Antd】 上传成功同步 UI
uppy.on('upload-success', (file, response) => {
  const target = fileList.value.find((f) => f.uid === file.meta.uid);
  if (target) {
    target.status = 'done';
    const body = response?.body || {};
    target.url = body.location || body.url || '';

    message.success(`上传成功：${file.name}`);
  }
});

// 错误处理
uppy.on('error', (err) => {
  console.error(err);
  message.error('上传失败');
});

// 组件卸载时清理 Uppy
onBeforeUnmount(() => {
  uppy.close();
});

// Antd beforeUpload → 阻止默认上传 → 丢给 Uppy 处理
function beforeUpload(file) {
  const uid = file.uid;

  // 写入 antd UI 显示列表
  fileList.value.push({
    uid,
    name: file.name,
    status: 'uploading',
    percent: 0,
  });

  // 写入 Uppy
  uppy.addFile({
    name: file.name,
    type: file.type,
    data: file,
    meta: {
      uid,
    },
  });

  // 阻止 Antd 发起请求，全部交给 Uppy
  return false;
}
</script>

<template>
  <Upload :before-upload="beforeUpload" :file-list="fileList" :show-upload-list="true">
    <Button>选择文件</Button>
  </Upload>
</template>
