<script setup lang="ts">
import type { BranchNode } from '../data';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { $t } from '#/locales';

import { useFlowDesignerContext } from '../composables/useFlowDesigner';
import { branchSummary } from '../data';

import NodeChain from './node-chain.vue';

/** 条件分支节点：多列容器，每列顶部条件卡片 + 列内递归节点链 */
const props = defineProps<{
  node: BranchNode;
}>();

const emit = defineEmits<{
  delete: [];
}>();

const designer = useFlowDesignerContext();

/** 顶部横向连接线内缩比例：从首列中心到末列中心 */
const lineInset = computed(() => `${50 / Math.max(props.node.branches.length, 1)}%`);

/** 分支列标题：未命名时按「条件 n / 默认分支」兜底 */
function branchTitle(branch: BranchNode['branches'][number], index: number): string {
  if (branch.name) return branch.name;
  return branch.conditionGroups.length === 0
    ? $t('approval.designer.defaultBranch')
    : `${$t('approval.designer.condition')} ${index + 1}`;
}
</script>

<template>
  <div class="branch-box">
    <IconifyIcon icon="lucide:x" class="branch-box-close size-4" @click.stop="emit('delete')" />
    <div class="branch-cols">
      <div class="branch-cols-line" :style="{ left: lineInset, right: lineInset }"></div>
      <div v-for="(branch, i) in node.branches" :key="i" class="branch-col">
        <div
          class="flow-card condition-card"
          :class="{ 'is-default': branch.conditionGroups.length === 0 }"
          @click="designer.openBranchConfig(node, i)"
        >
          <div class="flow-card-header">
            <span class="flow-card-title">{{ branchTitle(branch, i) }}</span>
            <IconifyIcon
              icon="lucide:x"
              class="flow-card-close size-3.5"
              @click.stop="designer.removeBranch(node, i)"
            />
          </div>
          <div class="flow-card-body">
            <div class="summary">{{ branchSummary(branch, designer.state.flowDef.fields, $t) }}</div>
            <div class="condition-actions">
              <IconifyIcon
                v-if="i > 0"
                icon="lucide:arrow-left"
                class="move-icon size-3.5"
                @click.stop="designer.moveBranch(node, i, -1)"
              />
              <span v-else></span>
              <span>{{ $t('approval.designer.priority', { n: branch.priority }) }}</span>
              <IconifyIcon
                v-if="i < node.branches.length - 1"
                icon="lucide:arrow-right"
                class="move-icon size-3.5"
                @click.stop="designer.moveBranch(node, i, 1)"
              />
              <span v-else></span>
            </div>
          </div>
        </div>
        <NodeChain :owner="branch" slot-key="childNode" />
      </div>
    </div>
    <div class="branch-add">
      <Button size="small" @click="designer.addBranch(node)">
        <IconifyIcon icon="lucide:plus" class="size-3.5" />
        {{ $t('approval.designer.addCondition') }}
      </Button>
    </div>
  </div>
</template>
