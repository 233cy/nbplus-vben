<script setup lang="ts">
import type { ApproverNode } from '../../data';

import { FormItem } from 'ant-design-vue';

import PageSelect from '#/components/page-select/index.vue';
import { $t } from '#/locales';

/** 指定成员面板：PageSelect user 多选，值存 param.userIds */
const props = defineProps<{
  node: ApproverNode;
}>();

// 兜底：存量数据 param 结构异常时保证 userIds 为数组
if (!Array.isArray(props.node.param.userIds)) {
  props.node.param.userIds = [];
}
</script>

<template>
  <FormItem :label="$t('approval.designer.config.selectUsers')">
    <PageSelect v-model="props.node.param.userIds" config="user" value-type="array" />
  </FormItem>
</template>
