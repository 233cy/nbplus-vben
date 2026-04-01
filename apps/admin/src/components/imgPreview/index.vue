<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Image } from 'ant-design-vue';

import { pathsToFullUrlMap } from '#/utils/upload';

const props = defineProps<{
  /** 逻辑路径，字符串（逗号分隔）或数组 */
  value?: null | string | string[];
}>();

const urls = ref<string[]>([]);
const previewVisible = ref(false);
const previewIndex = ref(0);

async function resolve(raw: null | string | string[] | undefined) {
  if (!raw) {
    urls.value = [];
    return;
  }
  const paths: string[] = Array.isArray(raw)
    ? raw.filter(Boolean)
    : String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  if (paths.length === 0) {
    urls.value = [];
    return;
  }
  const map = await pathsToFullUrlMap(paths);
  urls.value = paths.map((p) => map[p] || p);
}

onMounted(() => resolve(props.value));
watch(
  () => props.value,
  (v) => resolve(v),
);

function open(i: number) {
  previewIndex.value = i;
  previewVisible.value = true;
}
</script>

<template>
  <span v-if="urls.length === 0" class="text-xs text-gray-300">-</span>
  <div v-else class="img-preview-wrap">
    <!-- 隐藏的 PreviewGroup 驱动预览 -->
    <Image.PreviewGroup
      :preview="{
        visible: previewVisible,
        current: previewIndex,
        onVisibleChange: (v: boolean) => (previewVisible = v),
      }"
    >
      <Image v-for="(url, i) in urls" :key="i" :src="url" style="display: none" />
    </Image.PreviewGroup>

    <!-- 缩略图 -->
    <div class="img-preview-thumb" @click="open(0)">
      <img :src="urls[0]" alt="" />
      <!-- 多图遮罩：始终显示数量 -->
      <div v-if="urls.length > 1" class="img-preview-mask always">
        <span class="img-preview-count">+{{ urls.length }}</span>
      </div>
      <!-- 单图遮罩：hover 时显示眼睛 -->
      <div v-else class="img-preview-mask hover-only">
        <IconifyIcon icon="ant-design:eye-outlined" class="img-preview-eye" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.img-preview-wrap {
  display: inline-flex;
  align-items: center;
}

.img-preview-thumb {
  position: relative;
  width: 36px;
  height: 36px;
  overflow: hidden;
  cursor: pointer;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
}

.img-preview-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-preview-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 多图：始终显示半透明遮罩 + 数量 */
.img-preview-mask.always {
  background: rgb(0 0 0 / 45%);
}

.img-preview-count {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

/* 单图：hover 才显示 */
.img-preview-mask.hover-only {
  background: rgb(0 0 0 / 0%);
  transition: background 0.2s;
}

.img-preview-thumb:hover .img-preview-mask.hover-only {
  background: rgb(0 0 0 / 45%);
}

.img-preview-eye {
  font-size: 16px;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.img-preview-thumb:hover .img-preview-eye {
  opacity: 1;
}
</style>
