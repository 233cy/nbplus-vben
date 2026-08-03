<script setup lang="ts">
import type { ApprovalInstanceApi } from '#/api/sys/approvalInstance';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Spin } from 'ant-design-vue';

import { getApprovalInstanceDetailApi } from '#/api/sys/approvalInstance';
import { $t } from '#/locales';

import InstanceDetail from '#/views/approval/components/instance-detail.vue';

const detail = ref<ApprovalInstanceApi.InstanceDetail | null>(null);
const loading = ref(false);

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = drawerApi.getData<{ id: string }>();
    detail.value = null;
    if (!data?.id) {
      return;
    }
    loading.value = true;
    try {
      detail.value = await getApprovalInstanceDetailApi(data.id);
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Drawer :title="$t('approval.instance.detail')" class="w-[640px]">
    <Spin :spinning="loading">
      <InstanceDetail v-if="detail" :detail="detail" />
    </Spin>
  </Drawer>
</template>
