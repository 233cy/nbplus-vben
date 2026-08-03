<script setup lang="ts">
import type { CcNode } from '../data';

import { IconifyIcon } from '@vben/icons';

import { $t } from '#/locales';

import { useFlowDesignerContext } from '../composables/useFlowDesigner';
import { ccSummary } from '../data';

/** 抄送节点卡片：样式与审批人卡片区分（左侧色条 + 邮件图标），点击打开抄送配置 */
const props = defineProps<{
  node: CcNode;
}>();

const emit = defineEmits<{
  delete: [];
}>();

const designer = useFlowDesignerContext();
</script>

<template>
  <div class="flow-card cc-card" @click="designer.openCcConfig(props.node)">
    <div class="flow-card-header">
      <span class="flow-card-title">
        <IconifyIcon icon="lucide:send" class="size-3.5" />
        {{ node.name || $t('approval.designer.cc') }}
      </span>
      <IconifyIcon icon="lucide:x" class="flow-card-close size-3.5" @click.stop="emit('delete')" />
    </div>
    <div class="flow-card-body">
      <div class="summary">{{ ccSummary(node, $t) }}</div>
    </div>
  </div>
</template>
