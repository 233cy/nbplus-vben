<script setup lang="ts">
import type { ApprovalFlowApi } from '#/api/sys/approvalFlow';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Descriptions, DescriptionsItem, Spin, Tag } from 'ant-design-vue';

import { getApprovalFlowDetailApi } from '#/api/sys/approvalFlow';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

const detail = ref<ApprovalFlowApi.FlowItem | null>(null);
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
      detail.value = await getApprovalFlowDetailApi(data.id);
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Drawer :title="$t('approval.flow.detail')" class="w-[560px]">
    <Spin :spinning="loading">
      <template v-if="detail">
        <Descriptions :column="1" bordered size="small">
          <DescriptionsItem :label="$t('approval.flow.fields.bizType')">{{ detail.bizType }}</DescriptionsItem>
          <DescriptionsItem :label="$t('approval.flow.fields.name')">{{ detail.name }}</DescriptionsItem>
          <DescriptionsItem :label="$t('common.status')">
            <Tag :color="detail.status === 1 ? 'success' : 'error'">
              {{ detail.status === 1 ? $t('common.enabled') : $t('common.disabled') }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem :label="$t('approval.flow.fields.remark')">{{ detail.remark || '-' }}</DescriptionsItem>
          <DescriptionsItem :label="$t('common.updatedAt')">{{ formatUnixTime(detail.updatedAt) }}</DescriptionsItem>
          <DescriptionsItem :label="$t('common.createdAt')">{{ formatUnixTime(detail.createdAt) }}</DescriptionsItem>
        </Descriptions>

        <div class="mt-4">
          <div class="mb-2 font-medium">{{ $t('approval.flow.fieldsPreview') }}</div>
          <template v-if="detail.fields?.length">
            <Tag v-for="field in detail.fields" :key="field.key" class="mb-1">{{ field.label ?? field.key }}</Tag>
          </template>
          <span v-else class="text-gray-400">{{ $t('common.noDataAvailable') }}</span>
        </div>

        <div class="mt-4">
          <div class="mb-2 font-medium">{{ $t('approval.flow.nodesPreview') }}</div>
          <template v-if="detail.nodes?.length">
            <Tag v-for="node in detail.nodes" :key="node.seq" color="blue" class="mb-1">{{ node.seq }}. {{ node.name }}</Tag>
          </template>
          <span v-else class="text-gray-400">{{ $t('common.noDataAvailable') }}</span>
        </div>
      </template>
    </Spin>
  </Drawer>
</template>
