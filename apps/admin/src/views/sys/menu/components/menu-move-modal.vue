<script setup lang="ts">
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { Modal, TreeSelect } from 'ant-design-vue';

defineProps<{
  loading: boolean;
  moveItem: MenuAdminApi.MenuItem | null;
  treeData: { children: any[]; label: string; value: string }[];
  visible: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  'update:moveParentId': [value: string];
  'update:visible': [visible: boolean];
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
    :title="$t('sys.menu.moveTitle', { title: moveItem?.title ?? '' })"
    :confirm-loading="loading"
    width="400px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="py-4">
      <TreeSelect v-model:value="moveParentId" :tree-data="treeData" tree-default-expand-all class="w-full" />
    </div>
  </Modal>
</template>
