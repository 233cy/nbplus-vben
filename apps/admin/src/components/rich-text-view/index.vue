<script setup lang="ts">
import type { PageWidth } from './preset';

import { computed, ref, watch } from 'vue';

import { useRichTextLogical } from '#/components/wang-editor/composables/useRichTextLogical';

import { resolvePageWidthCss } from './preset';

import './rich-text.css';

/**
 * 富文本展示组件（统一展示出口）.
 *
 * 不依赖 wangEditor 编辑引擎，仅用共享内容样式表（rich-text.css，与编辑器同一套）+ v-html 渲染，
 * 保证无论内容来自「前端 rehydrate」还是「后端 render()」，呈现与编辑时完全一致。
 *
 * - html 为入库原始形态（data-logical）时，设 `rehydrate`，前端解析成可访问 URL 再渲染；
 * - html 已由后端 render() 处理（fullUrl + 已清洗）时，不设 `rehydrate`，直接渲染。
 *
 * 安全：后端 render() 输出已 sanitize；前端 rehydrate 路径建议仅用于可信内容，
 * 生产环境对外展示优先走后端 render()。
 */
const props = withDefaults(
  defineProps<{
    html?: string;
    /** 页面宽度：'iphone' | 'ipad' | 'common' 预设，或具体像素数，默认 common(800) */
    pageWidth?: PageWidth;
    /** 是否需要前端 rehydrate（html 为 data-logical 入库态时设 true） */
    rehydrate?: boolean;
  }>(),
  {
    html: '',
    pageWidth: 'common',
    rehydrate: false,
  },
);

const { rehydrate: doRehydrate } = useRichTextLogical();
const content = ref('');

watch(
  () => props.html,
  async v => {
    content.value = props.rehydrate ? await doRehydrate(v || '') : v || '';
  },
  { immediate: true },
);

const widthStyle = computed(() => ({ '--rt-page-width': resolvePageWidthCss(props.pageWidth) }));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="rich-text-content" :style="widthStyle" v-html="content"></div>
</template>
