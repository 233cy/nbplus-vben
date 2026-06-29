<script setup lang="ts">
import type { DeptApi } from '#/api/sys/dept';

import { Modal, TreeSelect } from 'ant-design-vue';

const props = defineProps<{
  loading: boolean;
  moveItem: DeptApi.DeptItem | null;
  treeData: { label: string; value: string; children: any[] }[];
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
    :title="$t('system.dept.moveTitle', { title: moveItem?.name ?? '' })"
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
