<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'ant-design-vue';

import { $t } from '#/locales';

import DoneGrid from './components/done-grid.vue';
import TodoGrid from './components/todo-grid.vue';

const activeKey = ref<'done' | 'todo'>('todo');
</script>

<template>
  <Page auto-content-height>
    <Tabs v-model:active-key="activeKey" class="h-full px-4">
      <TabPane key="todo" :tab="$t('approval.todo.tabs.todo')">
        <TodoGrid v-if="activeKey === 'todo'" />
      </TabPane>
      <TabPane key="done" :tab="$t('approval.todo.tabs.done')">
        <DoneGrid v-if="activeKey === 'done'" />
      </TabPane>
    </Tabs>
  </Page>
</template>
