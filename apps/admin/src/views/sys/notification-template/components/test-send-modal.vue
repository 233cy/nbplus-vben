<script setup lang="ts">
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { $t } from '#/locales';

import NotificationSendPanel from '../shared/notification-send/index.vue';

const emit = defineEmits<{
  success: [];
}>();

const template = ref<NotificationTemplateApi.Template | null>(null);
const panelRef = ref<InstanceType<typeof NotificationSendPanel> | null>(null);

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    modalApi.setState({ loading: true });
    try {
      // 全部成功时面板会 emit success，弹窗在 onPanelSuccess 中关闭
      await panelRef.value?.submit();
    } catch {
      // 请求错误已由 request.ts 统一弹窗提示，这里不再重复处理
    } finally {
      // 成功关闭弹窗后实例已销毁（destroyOnClose），不再操作 modal 状态
      if (template.value) {
        modalApi.setState({ loading: false });
      }
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    template.value = modalApi.getData<NotificationTemplateApi.Template>() || null;
  },
});

function onPanelSuccess() {
  emit('success');
  template.value = null;
  modalApi.close();
}
</script>

<template>
  <Modal
    :title="$t('sys.notification-template.testSendTitle', { name: template?.name || '' })"
    :show-cancel-button="true"
    width="680px"
  >
    <NotificationSendPanel
      v-if="template"
      ref="panelRef"
      mode="template"
      :template="template"
      @success="onPanelSuccess"
    />
  </Modal>
</template>
