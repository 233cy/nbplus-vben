<script setup lang="ts">
import type { ApproverNode, Branch, CcNode } from '../data';

import { computed, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  RadioButton,
  RadioGroup,
  Switch,
} from 'ant-design-vue';

import PageSelect from '#/components/page-select/index.vue';
import { $t } from '#/locales';

import { useFlowDesignerContext } from '../composables/useFlowDesigner';
import { APPROVER_RULES, createCond } from '../data';

import ConditionBuilder from './condition-builder.vue';

/**
 * 右侧配置抽屉：点击画布卡片打开，直接双向编辑 reactive 节点树
 * - 审批人节点：名称、审批人规则（注册表 APPROVER_RULES 动态渲染面板）、通过方式
 * - 抄送节点：名称、指定抄送人、是否允许发起人自选
 * - 分支列：名称、条件构建器（or 条件组 / and 条件）、默认分支切换
 * 通知模板不提供编辑入口，schema 默认值 approval_todo 由工厂函数保留。
 */
const designer = useFlowDesignerContext();

const target = computed(() => designer.state.drawerTarget);

const drawerTitle = computed(() => {
  if (target.value?.kind === 'branch') return $t('approval.designer.config.branchTitle');
  if (target.value?.kind === 'cc') return $t('approval.designer.config.ccTitle');
  return $t('approval.designer.config.approverTitle');
});

/** 当前编辑的审批人节点 / 抄送节点 / 分支列 */
const approverNode = computed<ApproverNode | null>(() =>
  target.value?.kind === 'approver' ? target.value.node : null,
);
const ccNode = computed<CcNode | null>(() => (target.value?.kind === 'cc' ? target.value.node : null));
const branch = computed<Branch | undefined>(() => {
  const t = target.value;
  return t?.kind === 'branch' ? t.branchNode.branches[t.index] : undefined;
});

/** 注册的审批人规则列表（Radio 竖排展示，顺序即注册顺序） */
const approverRuleEntries = Object.entries(APPROVER_RULES);

/** 当前规则的参数面板组件；存量未注册类型（role/post）返回 null 走兼容提示 */
const rulePanel = computed(() => {
  const type = approverNode.value?.approverType;
  return type ? (APPROVER_RULES[type]?.panel ?? null) : null;
});

/** 切换审批人类型：按注册表整体重置 param（存量类型不重置，仅回显） */
watch(
  () => approverNode.value?.approverType,
  (type, prev) => {
    if (!type || type === prev || !approverNode.value) return;
    const rule = APPROVER_RULES[type];
    if (rule) approverNode.value.param = rule.defaultParam();
  },
);

/** 是否存在其他默认分支（决定「设为默认分支」入口是否可用） */
const hasOtherDefault = computed(() => {
  const t = target.value;
  if (t?.kind !== 'branch') return false;
  return t.branchNode.branches.some((b, i) => i !== t.index && b.conditionGroups.length === 0);
});

/** quorumCount 与 InputNumber 的类型适配：null ↔ undefined */
const quorumCountValue = computed<number | undefined>({
  get: () => approverNode.value?.quorumCount ?? undefined,
  set: v => {
    if (approverNode.value) {
      approverNode.value.quorumCount = typeof v === 'number' ? v : null;
    }
  },
});
</script>

<template>
  <Drawer
    :open="!!target"
    :title="drawerTitle"
    :width="520"
    @close="designer.closeDrawer()"
  >
    <!-- 审批人节点配置 -->
    <Form v-if="approverNode" layout="vertical">
      <FormItem :label="$t('approval.designer.config.nodeName')">
        <Input
          v-model:value="approverNode.name"
          :placeholder="$t('approval.designer.config.namePlaceholder')"
          :maxlength="30"
        />
      </FormItem>

      <FormItem :label="$t('approval.designer.config.approverType')">
        <RadioGroup v-model:value="approverNode.approverType" class="flex flex-col gap-2">
          <Radio v-for="[key, rule] in approverRuleEntries" :key="key" :value="key">
            {{ $t(rule.labelKey) }}
          </Radio>
        </RadioGroup>
      </FormItem>

      <!-- 参数面板：按 APPROVER_RULES 注册表动态渲染 -->
      <component :is="rulePanel" v-if="rulePanel" :node="approverNode" />

      <!-- 存量未注册类型（role/post）：回显原始类型名，不提供编辑 -->
      <Alert
        v-else
        type="warning"
        show-icon
        :message="$t('approval.designer.config.legacyType', { type: approverNode.approverType })"
        class="mb-4"
      />

      <FormItem :label="$t('approval.designer.config.approvalMode')">
        <RadioGroup v-model:value="approverNode.approvalMode">
          <RadioButton value="any">{{ $t('approval.designer.config.modeAny') }}</RadioButton>
          <RadioButton value="all">{{ $t('approval.designer.config.modeAll') }}</RadioButton>
          <RadioButton value="quorum">{{ $t('approval.designer.config.modeQuorum') }}</RadioButton>
        </RadioGroup>
      </FormItem>

      <FormItem v-if="approverNode.approvalMode === 'quorum'" :label="$t('approval.designer.config.quorumCount')">
        <InputNumber v-model:value="quorumCountValue" :min="1" :precision="0" class="w-full" />
        <div class="quorum-tip">{{ $t('approval.designer.config.quorumTip') }}</div>
      </FormItem>
    </Form>

    <!-- 抄送节点配置 -->
    <Form v-else-if="ccNode" layout="vertical">
      <FormItem :label="$t('approval.designer.config.nodeName')">
        <Input
          v-model:value="ccNode.name"
          :placeholder="$t('approval.designer.config.namePlaceholder')"
          :maxlength="30"
        />
      </FormItem>

      <FormItem :label="$t('approval.designer.config.ccUsers')">
        <PageSelect v-model="ccNode.ccUserIds" config="user" value-type="array" />
      </FormItem>

      <FormItem :label="$t('approval.designer.config.allowSelfSelect')">
        <Switch v-model:checked="ccNode.allowSelfSelect" />
      </FormItem>
    </Form>

    <!-- 分支条件配置 -->
    <Form v-else-if="branch" layout="vertical">
      <FormItem :label="$t('approval.designer.config.branchName')">
        <Input
          v-model:value="branch.name"
          :placeholder="$t('approval.designer.config.namePlaceholder')"
          :maxlength="30"
        />
      </FormItem>

      <!-- 默认分支：无条件，仅提示文案 -->
      <template v-if="branch.conditionGroups.length === 0">
        <Alert type="info" show-icon :message="$t('approval.designer.defaultBranchTip')" class="mb-3" />
        <Button size="small" @click="branch.conditionGroups.push([createCond()])">
          <IconifyIcon icon="lucide:plus" class="size-3.5" />
          {{ $t('approval.designer.addCondition') }}
        </Button>
      </template>

      <!-- 条件构建器 -->
      <template v-else>
        <FormItem :label="$t('approval.designer.config.condition')">
          <ConditionBuilder :branch="branch" :fields="designer.state.flowDef.fields" />
        </FormItem>
        <Popconfirm
          v-if="!hasOtherDefault"
          :title="$t('approval.designer.setAsDefaultConfirm')"
          :ok-text="$t('common.confirm')"
          :cancel-text="$t('common.cancel')"
          @confirm="branch.conditionGroups = []"
        >
          <Button type="link" size="small" class="!px-0">
            {{ $t('approval.designer.setAsDefault') }}
          </Button>
        </Popconfirm>
      </template>
    </Form>
  </Drawer>
</template>
