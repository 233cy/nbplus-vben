<script setup lang="ts">
import { computed } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, Input, Space } from 'ant-design-vue';

import { $t } from '#/locales';

import DeptForm from './components/dept-form.vue';
import DeptMoveModal from './components/dept-move-modal.vue';
import DeptTree from './components/dept-tree.vue';
import { useDeptForm, useDeptMove, useDeptTree } from './composables/index.js';

const tree = useDeptTree({ t: $t });
const form = useDeptForm({ treeData: tree.treeData, reload: tree.loadDepts, t: $t });
const move = useDeptMove({ treeData: tree.treeData, reload: tree.loadDepts, t: $t });

const checkedCount = computed(() => tree.checkedKeys.value.length);

// 页面初始化
tree.loadDepts();
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col">
      <!-- 顶部工具栏 -->
      <div class="mb-4 flex items-center gap-4 rounded-[var(--radius)] border border-border bg-card p-4">
        <Space :size="8">
          <Button @click="tree.expandAll">
            <template #icon>
              <IconifyIcon icon="ant-design:node-expand-outlined" />
            </template>
            {{ $t('sys.user-dept.expandAll') }}
          </Button>
          <Button @click="tree.collapseAll">
            <template #icon>
              <IconifyIcon icon="ant-design:node-collapse-outlined" />
            </template>
            {{ $t('sys.user-dept.collapseAll') }}
          </Button>
          <Button :disabled="checkedCount === 0" danger @click="tree.handleBatchDelete">
            <template #icon>
              <IconifyIcon icon="ant-design:delete-outlined" />
            </template>
            {{ $t('sys.user-dept.batchDelete') }} {{ checkedCount > 0 ? `(${checkedCount})` : '' }}
          </Button>
          <Input v-model:value="tree.keyword.value" :placeholder="$t('sys.user-dept.searchPlaceholder')" allow-clear style="width: 240px">
            <template #prefix>
              <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
            </template>
          </Input>
          <Button type="primary" @click="form.openCreate()">
            <Plus class="size-4" />
            {{ $t('sys.user-dept.addRoot') }}
          </Button>
        </Space>
      </div>

      <!-- 部门树 -->
      <DeptTree
        class="flex-1 overflow-auto rounded-[var(--radius)] border border-border bg-card p-3"
        :loading="tree.loading.value"
        :tree-data="tree.filteredTreeData.value"
        :expanded-keys="tree.expandedKeys.value"
        :checked-keys="tree.checkedKeys.value"
        :toggle-loading="tree.toggleLoading.value"
        @update:expanded-keys="tree.expandedKeys.value = $event"
        @update:checked-keys="tree.checkedKeys.value = $event"
        @drop="tree.onDrop"
        @toggle="tree.toggleNode"
        @create="form.openCreate"
        @edit="form.openEdit"
        @delete="tree.handleDelete"
        @move="move.openMove"
        @toggle-status="tree.handleToggleStatus"
      />

      <!-- 新增/编辑弹窗 -->
      <DeptForm
        v-model:form="form.form.value"
        v-model:visible="form.visible.value"
        :loading="form.loading.value"
        :is-edit="form.isEdit.value"
        :title="form.title.value"
        :tree-data="tree.treeData.value"
        @submit="form.handleSubmit"
      />

      <!-- 移动节点弹窗 -->
      <DeptMoveModal
        v-model:visible="move.visible.value"
        v-model:move-parent-id="move.moveParentId.value"
        :loading="move.loading.value"
        :move-item="move.moveItem.value"
        :tree-data="move.treeSelectData.value"
        @submit="move.handleMove"
      />
    </div>
  </Page>
</template>
