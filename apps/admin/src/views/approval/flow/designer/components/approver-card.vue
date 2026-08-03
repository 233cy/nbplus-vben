<script setup lang="ts">
import type { ApproverNode } from '../data';

import { IconifyIcon } from '@vben/icons';

import { $t } from '#/locales';

import { useFlowDesignerContext } from '../composables/useFlowDesigner';
import { approvalModeText, approverSummary } from '../data';

/** 审批人节点卡片：显示节点名、审批人规则摘要与通过方式，点击打开配置抽屉 */
const props = defineProps<{
  node: ApproverNode;
}>();

const emit = defineEmits<{
  delete: [];
}>();

const designer = useFlowDesignerContext();
</script>

<template>
  <div class="flow-card approver-card" @click="designer.openApproverConfig(props.node)">
    <div class="flow-card-header">
      <span class="flow-card-title">
        <IconifyIcon icon="lucide:user-check" class="size-3.5" />
        {{ node.name || $t('approval.designer.approver') }}
      </span>
      <IconifyIcon icon="lucide:x" class="flow-card-close size-3.5" @click.stop="emit('delete')" />
    </div>
    <div class="flow-card-body">
      <div class="summary">{{ approverSummary(node, $t) }}</div>
      <div class="mode">{{ approvalModeText(node, $t) }}</div>
    </div>
  </div>
</template>
