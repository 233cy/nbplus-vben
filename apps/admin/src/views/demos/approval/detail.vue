<script setup lang="ts">
import type { ApprovalInstanceApi } from '#/api/sys/approvalInstance';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Empty, Spin } from 'ant-design-vue';

import { getApprovalDetailByBizApi } from '#/api/sys/approval';
import { $t } from '#/locales';
import InstanceDetail from '#/views/approval/components/instance-detail.vue';

// 模块副作用：注册 demo_leave 的审批详情路由（直接访问本页时 index 可能未加载）
import './register';

const route = useRoute();
const detail = ref<ApprovalInstanceApi.InstanceDetail | null>(null);
const loading = ref(false);

onMounted(async () => {
  const bizId = route.query.bizId as string;
  if (!bizId) {
    return;
  }
  loading.value = true;
  try {
    detail.value = await getApprovalDetailByBizApi('demo_leave', bizId);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Page :title="$t('demos.approval.detailTitle')">
    <Spin :spinning="loading">
      <div class="m-4 max-w-[720px] rounded-lg bg-card p-4">
        <InstanceDetail v-if="detail" :detail="detail" />
        <Empty v-else-if="!loading" :description="$t('common.noDataAvailable')" />
      </div>
    </Spin>
  </Page>
</template>
