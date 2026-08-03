<script setup lang="ts">
import type { ApproverNode } from '../../data';

import { FormItem, Radio, RadioGroup } from 'ant-design-vue';

import { $t } from '#/locales';

/** 发起人自选面板：单人/多人，值存 param.multiple */
const props = defineProps<{
  node: ApproverNode;
}>();

// 兜底：保证 multiple 为布尔值
if (typeof props.node.param.multiple !== 'boolean') {
  props.node.param.multiple = false;
}
</script>

<template>
  <FormItem :label="$t('approval.designer.config.selfSelectMultiple')">
    <RadioGroup v-model:value="props.node.param.multiple">
      <Radio :value="false">{{ $t('approval.designer.config.selfSelectSingle') }}</Radio>
      <Radio :value="true">{{ $t('approval.designer.config.selfSelectMulti') }}</Radio>
    </RadioGroup>
  </FormItem>
</template>
