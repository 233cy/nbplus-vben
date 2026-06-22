<script setup lang="ts">
import type { SortTreeNode } from '../composables/useConfigSort';

import { IconifyIcon } from '@vben/icons';

import { Modal, Tag, Tree } from 'ant-design-vue';

import { $t } from '#/locales';

interface Props {
  visible: boolean;
  loading: boolean;
  treeData: SortTreeNode[];
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'drop', info: any): void;
  (e: 'submit'): void;
}>();
</script>

<template>
  <Modal :open="visible" :title="$t('system.config.sortModal')" :confirm-loading="loading" width="520px" @update:open="emit('update:visible', $event)" @ok="emit('submit')">
    <p class="mb-4 text-sm text-gray-400">{{ $t('system.config.sortModalTip') }}</p>
    <Tree :tree-data="treeData" draggable block-node :show-icon="false" :selectable="false" @drop="emit('drop', $event)">
      <template #title="{ title, _item }">
        <div class="flex items-center gap-3 py-2">
          <IconifyIcon icon="ant-design:drag-outlined" class="shrink-0 cursor-grab text-xl font-black text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
          <span class="flex-1 text-base font-medium text-gray-800 dark:text-gray-200">
            {{ title }}
          </span>
          <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-blue-600 dark:bg-gray-700 dark:text-blue-400">
            {{ _item.key }}
          </code>
          <Tag v-if="_item.isSys" color="gold">{{ $t('system.config.isSysTag') }}</Tag>
        </div>
      </template>
    </Tree>
  </Modal>
</template>
