<script setup lang="ts">
import type { ApproverNode } from '../../data';

import { Alert } from 'ant-design-vue';

import { $t } from '#/locales';

/** 直接负责人面板：无参数，仅提示自动向上查找规则 */
defineProps<{
  node: ApproverNode;
}>();
</script>

<template>
  <Alert type="info" show-icon :message="$t('approval.designer.config.supervisorTip')" class="mb-4" />
</template>
