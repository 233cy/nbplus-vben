<script setup lang="ts">
import { Page } from '@vben/common-ui';

import { Alert, Card } from 'ant-design-vue';

import { $t } from '#/locales';
import NotificationSendPanel from '#/views/sys/notification-template/shared/notification-send/index.vue';

import { useNotificationSendPermission } from './permissions';

defineOptions({ name: 'NotificationSendPage' });

const { canSend } = useNotificationSendPermission();
</script>

<template>
  <Page>
    <Card :title="$t('sys.notification-send.pageTitle')" :bordered="false">
      <NotificationSendPanel v-if="canSend" mode="channel" />
      <Alert v-else :message="$t('sys.notification-send.noPermission')" type="warning" show-icon />
    </Card>
  </Page>
</template>
