<script setup lang="ts">
import type { NotificationMessageApi } from '#/api/sys/notificationMessage';

import { computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Tag, Tooltip } from 'ant-design-vue';
import DOMPurify from 'dompurify';

import { $t } from '#/locales';
import RichTextView from '#/components/rich-text-view/index.vue';
import { formatCode } from '#/utils/format';
import { formatUnixTime } from '#/utils/time';

const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  showCancelButton: false,
});

const data = computed(() => drawerApi.getData<NotificationMessageApi.MessageItem>());

/** 富文本渠道（邮件/站内信）正文用富文本回显，其他渠道保持纯文本 */
const isRichText = computed(() => ['email', 'station'].includes(data.value?.driver ?? ''));
const sanitizedContent = computed(() => DOMPurify.sanitize(data.value?.content || ''));

const statusMeta = computed(() => {
  const map: Record<number, { color: string; label: string }> = {
    1: { color: 'success', label: $t('common.success') },
    2: { color: 'error', label: $t('common.fail') },
    3: { color: 'processing', label: $t('common.pending') },
    4: { color: 'default', label: $t('sys.notification-message.skipped') },
  };
  return map[data.value?.status ?? 0] ?? { color: 'default', label: '-' };
});

const sendTypeLabel = computed(() => {
  const sendType = data.value?.sendType ?? '';
  const map: Record<string, string> = {
    user: $t('sys.notification-message.sendType.user'),
    free: $t('sys.notification-message.sendType.free'),
  };
  return map[sendType] ?? sendType;
});

const formattedResponse = computed(() => {
  const response = data.value?.response;
  if (!response) return '';
  try {
    return JSON.stringify(JSON.parse(response), null, 2);
  } catch {
    return response;
  }
});
</script>

<template>
  <Drawer :title="$t('sys.notification-message.detail')" class="w-[660px] max-w-[90vw]" :footer-style="{ textAlign: 'right' }">
    <div v-if="data" class="flex h-full flex-col gap-4">
      <!-- 头部：标题 + 状态 + 时间/渠道 -->
      <div>
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-lg font-semibold leading-7">{{ data.templateName || data.subject || '-' }}</h3>
          <div class="mt-1 flex shrink-0 gap-1">
            <Tag v-if="data.isResend === 1" color="blue">{{ $t('sys.notification-message.resend') }}</Tag>
            <Tag :color="statusMeta.color">{{ statusMeta.label }}</Tag>
          </div>
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span class="flex items-center gap-1">
            <IconifyIcon icon="lucide:clock" class="size-3.5" />
            {{ formatUnixTime(data.createdAt) }}
          </span>
          <span>{{ data.channelName || data.channel }}</span>
          <span>{{ sendTypeLabel }}</span>
        </div>
      </div>

      <!-- 正文阅读区：邮件/站内信富文本回显，其他渠道纯文本 -->
      <div class="max-h-72 overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm leading-7 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
        <RichTextView v-if="isRichText" :html="sanitizedContent" rehydrate page-width="common" />
        <template v-else>{{ data.content }}</template>
      </div>

      <!-- 投递信息 -->
      <div>
        <h4 class="mb-2 text-sm font-medium text-gray-500">{{ $t('sys.notification-message.deliveryInfo') }}</h4>
        <div class="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-700">
          <div class="flex gap-2">
            <span class="shrink-0 text-gray-400">{{ $t('sys.notification-message.fields.target') }}</span>
            <span class="min-w-0 break-all">{{ data.label || data.target || '-' }}</span>
          </div>
          <div class="flex gap-2">
            <span class="shrink-0 text-gray-400">{{ $t('sys.notification-message.fields.contact') }}</span>
            <span class="min-w-0 break-all">{{ data.contact || '-' }}</span>
          </div>
          <div class="col-span-2 flex gap-2">
            <span class="shrink-0 text-gray-400">{{ $t('sys.notification-message.fields.batchNo') }}</span>
            <Tooltip :title="`${$t('sys.notification-message.fields.batchNo')}：${data.batchNo || '-'}`">
              <span class="min-w-0 break-all">{{ formatCode(data.batchNo) }}</span>
            </Tooltip>
          </div>
          <div class="flex gap-2">
            <span class="shrink-0 text-gray-400">{{ $t('sys.notification-message.fields.templateCode') }}</span>
            <span class="min-w-0 break-all">{{ data.templateCode || '-' }}</span>
          </div>
          <div class="flex gap-2">
            <span class="shrink-0 text-gray-400">{{ $t('sys.notification-message.fields.bizType') }}</span>
            <span class="min-w-0 break-all">{{ data.bizType || '-' }}</span>
          </div>
          <div class="flex gap-2">
            <span class="shrink-0 text-gray-400">{{ $t('sys.notification-message.fields.ip') }}</span>
            <span class="min-w-0 break-all">{{ data.ip || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 失败原因（仅失败时展示） -->
      <div v-if="data.errorMsg" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <div class="mb-1 flex items-center gap-1 font-medium">
          <IconifyIcon icon="lucide:circle-alert" class="size-4" />
          {{ $t('sys.notification-message.fields.errorMsg') }}
        </div>
        <div class="whitespace-pre-wrap break-all">{{ data.errorMsg }}</div>
      </div>

      <!-- 渠道响应 -->
      <div v-if="formattedResponse">
        <h4 class="mb-2 text-sm font-medium text-gray-500">{{ $t('sys.notification-message.fields.response') }}</h4>
        <pre class="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">{{ formattedResponse }}</pre>
      </div>
    </div>

    <template #footer>
      <Button class="ml-2" @click="drawerApi.close()">
        {{ $t('common.close') }}
      </Button>
    </template>
  </Drawer>
</template>
