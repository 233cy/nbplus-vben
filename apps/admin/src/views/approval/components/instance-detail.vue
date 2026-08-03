<script setup lang="ts">
import type { ApprovalInstanceApi } from '#/api/sys/approvalInstance';

import { computed } from 'vue';

import { Descriptions, DescriptionsItem, Empty, Tag, Timeline, TimelineItem } from 'ant-design-vue';

import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

/**
 * 审批实例详情展示块（审批模块内复用）
 *
 * 被实例管理详情抽屉、待办中心快照兜底、业务演示详情页共同引用：
 * 上半部分 a-descriptions 展示 snapshot 键值，下半部分 a-timeline 展示各 seq 节点。
 */
const props = defineProps<{
  detail: ApprovalInstanceApi.InstanceDetail;
}>();

/** 任务状态对应的 Tag 颜色 */
const taskColorMap: Record<number, string> = {
  1: 'gold',
  2: 'green',
  3: 'red',
  4: 'default',
};

/** 实例状态对应的 Tag 颜色 */
const instanceColorMap: Record<number, string> = {
  1: 'processing',
  2: 'success',
  3: 'error',
  4: 'default',
};

const snapshotEntries = computed(() => Object.entries(props.detail.snapshot ?? {}));

/** 快照值统一转字符串展示，对象/数组序列化 */
function formatSnapshotValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/** 节点时间：优先完成时间，其次创建时间 */
function taskTime(task: ApprovalInstanceApi.TaskItem): string {
  const ts = task.finishedAt ?? task.createdAt;
  return ts ? formatUnixTime(ts) : '-';
}
</script>

<template>
  <div>
    <Descriptions :column="1" bordered size="small">
      <DescriptionsItem :label="$t('approval.instance.fields.title')">{{ detail.title }}</DescriptionsItem>
      <DescriptionsItem :label="$t('approval.instance.fields.bizType')">{{ detail.bizType }}</DescriptionsItem>
      <DescriptionsItem :label="$t('approval.instance.fields.bizId')">{{ detail.bizId }}</DescriptionsItem>
      <DescriptionsItem :label="$t('approval.instance.fields.applicantName')">{{ detail.applicantName || '-' }}</DescriptionsItem>
      <DescriptionsItem :label="$t('common.status')">
        <Tag :color="instanceColorMap[detail.status]">{{ $t(`approval.common.instanceStatus.${detail.status}`) }}</Tag>
      </DescriptionsItem>
      <DescriptionsItem :label="$t('approval.instance.fields.createdAt')">{{ formatUnixTime(detail.createdAt) }}</DescriptionsItem>
    </Descriptions>

    <template v-if="snapshotEntries.length">
      <div class="mb-2 mt-4 font-medium">{{ $t('approval.common.snapshot') }}</div>
      <Descriptions :column="1" bordered size="small">
        <DescriptionsItem v-for="[key, value] in snapshotEntries" :key="key" :label="key">
          {{ formatSnapshotValue(value) }}
        </DescriptionsItem>
      </Descriptions>
    </template>

    <div class="mb-2 mt-4 font-medium">{{ $t('approval.common.timeline') }}</div>
    <Timeline v-if="detail.tasks?.length">
      <TimelineItem v-for="task in detail.tasks" :key="task.id" :color="taskColorMap[task.status]">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-medium">{{ task.seq }}. {{ task.nodeName }}</span>
          <Tag :color="taskColorMap[task.status]">{{ $t(`approval.common.taskStatus.${task.status}`) }}</Tag>
        </div>
        <div class="mt-1 text-sm text-gray-500">
          {{ $t('approval.common.approver') }}：{{ task.approverName || task.approverId || '-' }}
        </div>
        <div v-if="task.comment" class="mt-1 text-sm">
          {{ $t('approval.common.comment') }}：{{ task.comment }}
        </div>
        <div class="mt-1 text-xs text-gray-400">{{ taskTime(task) }}</div>
      </TimelineItem>
    </Timeline>
    <Empty v-else :description="$t('common.noDataAvailable')" />
  </div>
</template>
