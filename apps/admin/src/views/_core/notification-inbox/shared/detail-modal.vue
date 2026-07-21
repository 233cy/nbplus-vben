<script setup lang="ts">
import type { NotificationInboxApi } from '#/api/sys/notificationInbox';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { $t } from '#/locales';

import DetailContent from './detail-content.vue';

/**
 * 通知详情弹窗（供全局通知中心点击消息时展示）
 */
const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  cancelText: $t('common.close'),
});

const data = computed(() => modalApi.getData<NotificationInboxApi.MessageItem>());
</script>

<template>
  <Modal :title="$t('core.notification-inbox.detail')" class="w-[560px] max-w-[90vw]">
    <DetailContent v-if="data" :data="data" class="min-h-40" />
  </Modal>
</template>
