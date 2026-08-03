<script setup lang="ts">
import type { SendResultItem } from './types';

import { computed } from 'vue';

import { Alert, Tag } from 'ant-design-vue';

import { $t } from '#/locales';

interface Props {
  /** 每个目标的投递结果，顺序与提交时的目标列表一致 */
  results: SendResultItem[];
  /** 与 results 顺序一致的目标展示名（用户 ID / 手机号 / 邮箱），缺省时按序号展示 */
  targets?: string[];
  failureCount?: number;
  skippedCount?: number;
  /** 批次号（自由发送接口返回） */
  batchNo?: string;
}

const props = withDefaults(defineProps<Props>(), {
  targets: undefined,
  failureCount: 0,
  skippedCount: 0,
  batchNo: '',
});

const successCount = computed(() => props.results.filter(item => item.success).length);

const alertType = computed(() => {
  if ((props.failureCount ?? 0) > 0) return 'error';
  if ((props.skippedCount ?? 0) > 0) return 'warning';
  return 'success';
});

function targetLabel(index: number) {
  return props.targets?.[index] || `#${index + 1}`;
}

function itemStatus(item: SendResultItem) {
  if (item.skipped) return 'skipped';
  return item.success ? 'success' : 'failed';
}
</script>

<template>
  <div>
    <Alert :type="alertType" show-icon>
      <template #message>
        {{ $t('sys.notification-send.resultSummary', { total: results.length, success: successCount, failure: failureCount, skipped: skippedCount }) }}
        <span v-if="batchNo" class="ml-2 text-xs text-gray-500">
          {{ $t('sys.notification-send.batchNo') }}：{{ batchNo }}
        </span>
      </template>
    </Alert>

    <ul class="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto border-t border-gray-100 pt-3 text-sm">
      <li v-for="(item, index) in results" :key="index" class="flex items-center gap-2">
        <Tag v-if="itemStatus(item) === 'success'" color="success">
          {{ $t('common.success') }}
        </Tag>
        <Tag v-else-if="itemStatus(item) === 'skipped'" color="warning">
          {{ $t('sys.notification-send.resultSkipped') }}
        </Tag>
        <Tag v-else color="error">
          {{ $t('common.fail') }}
        </Tag>
        <span class="shrink-0">{{ targetLabel(index) }}</span>
        <span v-if="item.errorMessage" class="truncate text-red-500" :title="item.errorMessage">
          {{ item.errorMessage }}
        </span>
        <span v-else-if="item.skipReason" class="truncate text-gray-500" :title="item.skipReason">
          {{ item.skipReason }}
        </span>
      </li>
    </ul>
  </div>
</template>
