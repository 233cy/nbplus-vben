<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'ant-design-vue';

import { $t } from '#/locales';

import MineGrid from './components/mine-grid.vue';
import SubmitForm from './components/submit-form.vue';

// 模块副作用：注册 demo_leave 的审批详情路由
import './register';

const activeKey = ref<'mine' | 'submit'>('submit');
const mineGridRef = ref<null | { refresh: () => void }>(null);

/** 提交成功后切到「我的申请」并刷新列表 */
function onSubmitted() {
  activeKey.value = 'mine';
  mineGridRef.value?.refresh();
}
</script>

<template>
  <Page auto-content-height>
    <Tabs v-model:active-key="activeKey" class="h-full px-4">
      <TabPane key="submit" :tab="$t('demos.approval.tabs.submit')">
        <SubmitForm v-if="activeKey === 'submit'" @submitted="onSubmitted" />
      </TabPane>
      <TabPane key="mine" :tab="$t('demos.approval.tabs.mine')">
        <MineGrid v-if="activeKey === 'mine'" ref="mineGridRef" />
      </TabPane>
    </Tabs>
  </Page>
</template>
