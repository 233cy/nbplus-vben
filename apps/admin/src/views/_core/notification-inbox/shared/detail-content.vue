<script setup lang="ts">
import type { NotificationInboxApi } from '#/api/sys/notificationInbox';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Tag } from 'ant-design-vue';
import DOMPurify from 'dompurify';

import { previewFileApi } from '#/api/sys/file';
import RichTextView from '#/components/rich-text-view/index.vue';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

/**
 * 通知详情内容（模块内共享组件）
 *
 * 只封装标题、正文、附件、阅读时间等内容区，
 * 外层容器（抽屉/弹窗）与操作按钮由使用方决定。
 */
const props = defineProps<{
  data: NotificationInboxApi.MessageItem;
}>();

const isUnread = computed(() => Number(props.data.isRead) !== 1);
// 正文为富文本 HTML，渲染前统一消毒防 XSS
const sanitizedContent = computed(() => DOMPurify.sanitize(props.data.content || ''));
const attachments = computed(() => props.data.extra?.attachments ?? []);

/** 附件大小的人类可读格式 */
function formatSize(size?: number) {
  if (!size || size <= 0) return '';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

/** 下载附件：逻辑路径经预览接口解析为可访问 URL（天然继承存储鉴权） */
async function downloadAttachment(att: NotificationInboxApi.Attachment) {
  const res = await previewFileApi(att.path);
  window.open(res.url, '_blank');
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 头部：标题 + 状态 + 送达时间 -->
    <div class="flex items-start justify-between gap-3">
      <h3 class="text-lg font-semibold leading-7">{{ data.title }}</h3>
      <Tag :color="isUnread ? 'orange' : 'default'" class="mt-1 shrink-0">
        {{ isUnread ? $t('core.notification-inbox.unread') : $t('core.notification-inbox.read') }}
      </Tag>
    </div>
    <div class="mt-1 flex items-center gap-1 text-xs text-gray-400">
      <IconifyIcon icon="lucide:clock" class="size-3.5" />
      {{ formatUnixTime(data.createdAt) }}
    </div>

    <!-- 正文阅读区（富文本） -->
    <div class="mt-4 flex-1 overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm leading-7 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
      <RichTextView :html="sanitizedContent" rehydrate page-width="common" />
    </div>

    <!-- 附件（任务产物引用，点击经逻辑路径解析后下载） -->
    <div v-if="attachments.length > 0" class="mt-4 flex flex-wrap gap-2">
      <a
        v-for="att in attachments"
        :key="att.path"
        class="attachment-capsule"
        :title="att.name"
        @click.prevent="downloadAttachment(att)"
      >
        <span class="truncate">{{ att.name }}</span>
        <span v-if="(att.size ?? 0) > 0" class="ml-1 shrink-0 text-gray-400">{{ formatSize(att.size) }}</span>
      </a>
    </div>

    <!-- 底部元信息 -->
    <div v-if="!isUnread && data.readAt" class="mt-4 text-xs text-gray-400">
      {{ $t('core.notification-inbox.fields.readAt') }}：{{ formatUnixTime(data.readAt) }}
    </div>
  </div>
</template>

<style scoped>
/* 附件胶囊：复用 rich-text.css 中 wangEditor 附件的统一视觉 */
.attachment-capsule {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 2px 10px;
  margin: 0 2px;
  font-size: 0.92em;
  color: hsl(var(--foreground));
  cursor: pointer;
  background-color: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.attachment-capsule::before {
  margin-right: 4px;
  content: '📎';
}

.attachment-capsule:hover {
  text-decoration: none;
  border-color: hsl(var(--primary));
}
</style>
