<script setup lang="ts">
import { computed } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, Input, Space } from 'ant-design-vue';

import { $t } from '#/locales';

import MenuForm from './components/menu-form.vue';
import MenuMethodPicker from './components/menu-method-picker.vue';
import MenuMoveModal from './components/menu-move-modal.vue';
import MenuPermissionModal from './components/menu-permission-modal.vue';
import MenuTree from './components/menu-tree.vue';
import { useMenuForm, useMenuMove, useMenuPermission, useMenuTree } from './composables';

const tree = useMenuTree({ t: $t });
const form = useMenuForm({ treeData: tree.treeData, reload: tree.loadMenus, t: $t });
const move = useMenuMove({ treeData: tree.treeData, reload: tree.loadMenus, t: $t });
const permission = useMenuPermission({ reload: tree.loadMenus, t: $t });

const checkedCount = computed(() => tree.checkedKeys.value.length);

function handlePickMethod() {
  permission.openPickMethod();
}

function onMethodPicked(permissionCode: string, title?: string) {
  form.form.value.permission = permissionCode;
  if (title && !form.form.value.title) {
    form.form.value.title = title;
  }
}

// 页面初始化
tree.loadMenus();
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
            {{ $t('dev.menu.expandAll') }}
          </Button>
          <Button @click="tree.collapseAll">
            <template #icon>
              <IconifyIcon icon="ant-design:node-collapse-outlined" />
            </template>
            {{ $t('dev.menu.collapseAll') }}
          </Button>
          <Button :disabled="checkedCount === 0" danger @click="tree.handleBatchDelete">
            <template #icon>
              <IconifyIcon icon="ant-design:delete-outlined" />
            </template>
            {{ $t('common.batchDelete') }} {{ checkedCount > 0 ? `(${checkedCount})` : '' }}
          </Button>
          <Input v-model:value="tree.keyword.value" :placeholder="$t('dev.menu.searchPlaceholder')" allow-clear style="width: 240px">
            <template #prefix>
              <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
            </template>
          </Input>
          <Button type="primary" @click="form.openCreate()">
            <Plus class="size-4" />
            {{ $t('dev.menu.addRoot') }}
          </Button>
        </Space>
      </div>

      <!-- 菜单树 -->
      <MenuTree
        class="flex-1 overflow-auto rounded-[var(--radius)] border border-border bg-card p-3"
        :loading="tree.loading.value"
        :tree-data="tree.filteredTreeData.value"
        :expanded-keys="tree.expandedKeys.value"
        :checked-keys="tree.checkedKeys.value"
        :toggle-loading="tree.toggleLoading.value"
        :allow-drop="tree.allowDrop"
        @update:expanded-keys="tree.expandedKeys.value = $event"
        @update:checked-keys="tree.checkedKeys.value = $event"
        @drop="tree.onDrop"
        @toggle="tree.toggleNode"
        @create="form.openCreate($event)"
        @edit="form.openEdit"
        @delete="tree.handleDelete"
        @move="move.openMove"
        @generate-permission="permission.openGeneratePermission"
        @toggle-status="tree.handleToggleStatus"
        @toggle-keep-alive="tree.handleToggleKeepAlive"
      />

      <!-- 新增/编辑弹窗 -->
      <MenuForm
        v-model:form="form.form.value"
        v-model:visible="form.visible.value"
        :loading="form.loading.value"
        :is-edit="form.isEdit.value"
        :title="form.title.value"
        :tree-data="tree.treeData.value"
        :available-types="form.availableTypes.value"
        @submit="form.handleSubmit"
        @open-pick-method="handlePickMethod"
      />

      <!-- 移动节点弹窗 -->
      <MenuMoveModal
        v-model:visible="move.visible.value"
        v-model:move-parent-id="move.moveParentId.value"
        :loading="move.loading.value"
        :move-item="move.moveItem.value"
        :tree-data="move.treeSelectData.value"
        @submit="move.handleMove"
      />

      <!-- 生成权限码弹窗 -->
      <MenuPermissionModal
        v-model:visible="permission.genVisible.value"
        v-model:gen-prefix="permission.genPrefix.value"
        v-model:gen-selected="permission.genSelected.value"
        :loading="permission.genLoading.value"
        :gen-item="permission.genItem.value"
        :permission-options="permission.permissionOptions"
        @submit="permission.handleGeneratePermission"
      />

      <!-- 从接口选择权限码弹窗 -->
      <MenuMethodPicker
        v-model:visible="permission.pickVisible.value"
        v-model:controller-prefix="permission.pickControllerPrefix.value"
        v-model:permission-prefix="permission.pickPermissionPrefix.value"
        v-model:selected="permission.pickSelected.value"
        :loading="permission.pickLoading.value"
        :methods="permission.methodOptions()"
        @scan="permission.handleScanMethods"
        @pick="permission.handlePickMethod(onMethodPicked)"
      />
    </div>
  </Page>
</template>
