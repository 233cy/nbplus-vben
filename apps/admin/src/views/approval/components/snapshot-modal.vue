<script setup lang="ts">
import type { ApprovalInstanceApi } from '#/api/sys/approvalInstance';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Spin } from 'ant-design-vue';

import { getApprovalDetailByBizApi } from '#/api/sys/approval';
import { $t } from '#/locales';

import InstanceDetail from '#/views/approval/components/instance-detail.vue';

/**
 * 快照详情兜底弹窗
 *
 * 业务模块未注册详情路由（resolveApprovalRoute 返回 null）时，
 * 按 bizType + bizId 拉取实例，展示快照与时间线兜底。
 */
const detail = ref<ApprovalInstanceApi.InstanceDetail | null>(null);
const loading = ref(false);

const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<{ bizId: string; bizType: string }>();
    detail.value = null;
    if (!data?.bizType || !data?.bizId) {
      return;
    }
    loading.value = true;
    try {
      detail.value = await getApprovalDetailByBizApi(data.bizType, data.bizId);
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal :title="$t('approval.todo.snapshotTitle')" class="w-[640px]">
    <Spin :spinning="loading">
      <InstanceDetail v-if="detail" :detail="detail" />
    </Spin>
  </Modal>
</template>
