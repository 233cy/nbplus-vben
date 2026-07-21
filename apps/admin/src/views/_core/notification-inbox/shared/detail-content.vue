<script setup lang="ts">
import type { NotificationInboxApi } from '#/api/sys/notificationInbox';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Tag } from 'ant-design-vue';
import DOMPurify from 'dompurify';

import RichTextView from '#/components/rich-text-view/index.vue';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

/**
 * 通知详情内容（模块内共享组件）
 *
 * 只封装标题、正文、跳转链接、阅读时间等内容区，
 * 外层容器（抽屉/弹窗）与操作按钮由使用方决定。
 */
const props = defineProps<{
  data: NotificationInboxApi.MessageItem;
}>();

const isUnread = computed(() => Number(props.data.isRead) !== 1);
// 正文为富文本 HTML，渲染前统一消毒防 XSS
const sanitizedContent = computed(() => DOMPurify.sanitize(props.data.content || ''));
const jumpUrl = computed(() => {
  const url = props.data.extra?.url;
  return typeof url === 'string' && url !== '' ? url : '';
});
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

    <!-- 跳转链接（extra.url 存在时展示） -->
    <a
      v-if="jumpUrl"
      :href="jumpUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      <IconifyIcon icon="lucide:link" class="size-4" />
      {{ $t('core.notification-inbox.goTo') }}
    </a>

    <!-- 底部元信息 -->
    <div v-if="!isUnread && data.readAt" class="mt-4 text-xs text-gray-400">
      {{ $t('core.notification-inbox.fields.readAt') }}：{{ formatUnixTime(data.readAt) }}
    </div>
  </div>
</template>
