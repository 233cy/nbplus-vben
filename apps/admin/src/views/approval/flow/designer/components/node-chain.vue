<script setup lang="ts">
import type { FlowNode, NodeType } from '../data';

import { computed } from 'vue';

import { useFlowDesignerContext } from '../composables/useFlowDesigner';

import ApproverCard from './approver-card.vue';
import BranchNodeBox from './branch-node.vue';
import CcCard from './cc-card.vue';
import InsertButton from './insert-button.vue';

/**
 * 链式节点渲染（递归）：
 * 渲染 owner 的 slotKey 插槽上的节点，节点之后跟「+」插入按钮，
 * 并递归渲染该节点的 childNode 链；插槽为空时只渲染插入按钮。
 */
const props = defineProps<{
  /** 插槽属主对象（FlowDef / 节点 / 分支列） */
  owner: {
    childNode?: FlowNode | null;
    root?: FlowNode | null;
  };
  /** 插槽字段名 */
  slotKey: 'childNode' | 'root';
}>();

const designer = useFlowDesignerContext();

const node = computed<FlowNode | null>(() => props.owner[props.slotKey] ?? null);

/** 「+」插入：有节点时插到其 childNode，空插槽时直接插入该插槽 */
function onInsert(type: NodeType) {
  if (node.value) {
    designer.insertInto(node.value, 'childNode', type);
  } else {
    designer.insertInto(props.owner, props.slotKey, type);
  }
}
</script>

<template>
  <div class="node-chain">
    <template v-if="node">
      <div class="chain-line"></div>
      <ApproverCard v-if="node.type === 'approver'" :node="node" @delete="designer.removeNode(owner, slotKey)" />
      <CcCard v-else-if="node.type === 'cc'" :node="node" @delete="designer.removeNode(owner, slotKey)" />
      <BranchNodeBox v-else :node="node" @delete="designer.removeNode(owner, slotKey)" />
    </template>
    <InsertButton @insert="onInsert" />
    <NodeChain v-if="node?.childNode" :owner="node!" slot-key="childNode" />
  </div>
</template>
