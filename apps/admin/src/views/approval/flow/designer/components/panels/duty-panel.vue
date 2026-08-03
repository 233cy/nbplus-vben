<script setup lang="ts">
import type { ApproverNode } from '../../data';

import { FormItem } from 'ant-design-vue';

import { $t } from '#/locales';

import DutyPickerList from '../duty-picker-list.vue';

/** 指定职务面板：任职列表形态（新增职务弹窗联动选择 + 已选列表），值存 param.dutyIds */
const props = defineProps<{
  node: ApproverNode;
}>();

// 兜底：存量数据 param 结构异常时保证 dutyIds 为数组
if (!Array.isArray(props.node.param.dutyIds)) {
  props.node.param.dutyIds = [];
}
</script>

<template>
  <FormItem :label="$t('approval.designer.config.selectDuty')">
    <DutyPickerList v-model="props.node.param.dutyIds" />
  </FormItem>
</template>
