<script setup lang="ts">
import type { MenuAdminApi } from '#/api/dev/menuAdmin';

import { Modal, TreeSelect } from 'ant-design-vue';

import { ROOT_PARENT } from '../data';

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  moveItem: MenuAdminApi.MenuItem | null;
  treeData: { label: string; value: string; children: any[] }[];
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'update:moveParentId': [value: string];
  submit: [];
}>();

const showVisible = defineModel<boolean>('visible', { required: true });
const moveParentId = defineModel<string>('moveParentId', { required: true });

function handleOk() {
  emit('submit');
}

function handleCancel() {
  showVisible.value = false;
}
</script>

<template>
  <Modal
    v-model:open="showVisible"
    :title="$t('dev.menu.moveTitle', { title: moveItem?.title ?? '' })"
    :confirm-loading="loading"
    width="400px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="py-4">
      <TreeSelect
        v-model:value="moveParentId"
        :tree-data="treeData"
        tree-default-expand-all
        class="w-full"
      />
    </div>
  </Modal>
</template>
