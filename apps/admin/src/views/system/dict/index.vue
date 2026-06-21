<!--
  字典管理页面
  ============
  左侧：字典树（按分组展示，支持搜索、拖拽排序、跨组移动）
  右侧：字典项列表（支持搜索、拖拽排序、CRUD）

  逻辑拆分：
  - composables/useDictTree.ts   → 树数据管理与拖拽
  - composables/useDictItems.ts  → 字典项列表与拖拽
  - composables/useDictForm.ts   → 字典 CRUD 弹窗
  - composables/useItemForm.ts   → 字典项 CRUD 弹窗
-->
<script setup lang="ts">
import { computed } from 'vue';

import { ColPage } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Textarea,
  Tooltip,
  Tree,
} from 'ant-design-vue';
import draggable from 'vuedraggable';

import CreatableSelect from '#/components/creatableSelect/index.vue';
import { $t } from '#/locales';

import { useDictForm, useDictItems, useDictTree, useItemForm } from './composables';

// ===== 颜色选项（字典项的 color 字段可选值） =====
const COLOR_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Success', value: 'success' },
  { label: 'Processing', value: 'processing' },
  { label: 'Error', value: 'error' },
  { label: 'Warning', value: 'warning' },
  { label: 'Magenta', value: 'magenta' },
  { label: 'Red', value: 'red' },
  { label: 'Volcano', value: 'volcano' },
  { label: 'Orange', value: 'orange' },
  { label: 'Gold', value: 'gold' },
  { label: 'Lime', value: 'lime' },
  { label: 'Green', value: 'green' },
  { label: 'Cyan', value: 'cyan' },
  { label: 'Blue', value: 'blue' },
  { label: 'Geekblue', value: 'geekblue' },
  { label: 'Purple', value: 'purple' },
];

// ===== 初始化 composables =====

/** 左侧字典树 */
const tree = useDictTree();

/** 右侧字典项列表 */
const items = useDictItems();

/** 字典 CRUD 弹窗 */
const dictForm = useDictForm({
  allDicts: tree.allDicts,
  activeDict: tree.activeDict,
  reload: tree.loadDicts,
  clearSelection: () => {
    tree.activeDict.value = null;
    tree.selectedKeys.value = [];
    items.list.value = [];
  },
});

/** 字典项 CRUD 弹窗 */
const itemForm = useItemForm({
  activeDict: tree.activeDict,
  itemList: items.list,
  reloadItems: items.loadItems,
});

/**
 * 树节点选中事件
 * 选中字典后加载对应的字典项列表
 */
function onTreeSelect(keys: (number | string)[], info: any) {
  tree.onSelect(keys, info);
  if (tree.activeDict.value) {
    items.loadItems(tree.activeDict.value.id);
  }
}

/**
 * 点击分组名称时切换展开/折叠
 * @param key 分组节点的 key
 */
function toggleExpand(key: string) {
  const idx = tree.expandedKeys.value.indexOf(key);
  if (idx > -1) {
    tree.expandedKeys.value.splice(idx, 1);
  } else {
    tree.expandedKeys.value.push(key);
  }
}

/**
 * 全部展开/折叠切换
 * 如果当前已全部展开则折叠所有，否则展开所有分组
 */
const isAllExpanded = computed(() => {
  const allGroupKeys = tree.treeData.value.map((n) => n.key);
  return allGroupKeys.length > 0 && allGroupKeys.every((k) => tree.expandedKeys.value.includes(k));
});

function toggleExpandAll() {
  if (isAllExpanded.value) {
    tree.expandedKeys.value = [];
  } else {
    tree.expandedKeys.value = tree.treeData.value.map((n) => n.key);
  }
}

/**
 * 字典项拖拽结束回调
 * vuedraggable 已自动更新数组顺序，这里触发后端排序同步
 */
function onItemDragEnd() {
  if (tree.activeDict.value) {
    items.onDragEnd(tree.activeDict.value.id);
  }
}

// ===== 页面初始化：加载字典数据 =====
tree.loadDicts();
</script>

<template>
  <ColPage
    auto-content-height
    :left-width="26"
    :right-width="74"
    :resizable="true"
    :split-line="true"
    :split-handle="true"
  >
    <!-- ==================== 左侧：字典树 ==================== -->
    <template #left>
      <div class="mr-2 flex h-full flex-col rounded-[var(--radius)] border border-border bg-card">
        <!-- 顶部：标题 + 展开/折叠 + 新增按钮 -->
        <div class="flex items-center justify-between border-b px-3 py-2.5">
          <span class="font-medium">{{ $t('system.dict.pageTitle') }}</span>
          <Space :size="4">
            <Tooltip :title="isAllExpanded ? $t('common.collapseAll') : $t('common.expandAll')">
              <Button type="text" @click="toggleExpandAll">
                <IconifyIcon :icon="isAllExpanded ? 'ant-design:minus-square-outlined' : 'ant-design:plus-square-outlined'" />
              </Button>
            </Tooltip>
            <Tooltip :title="$t('system.dict.addDict')">
              <Button type="primary" @click="dictForm.openCreate()">
                <IconifyIcon icon="ant-design:plus-outlined" />
              </Button>
            </Tooltip>
          </Space>
        </div>

        <!-- 搜索框 -->
        <div class="px-3 py-2">
          <Input v-model:value="tree.keyword.value" :placeholder="$t('system.dict.searchPlaceholder')" allow-clear>
            <template #prefix>
              <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
            </template>
          </Input>
        </div>

        <!-- 树组件 -->
        <Spin :spinning="tree.loading.value" class="flex-1 overflow-y-auto px-1 pb-2">
          <Tree
            v-if="tree.treeData.value.length > 0"
            :tree-data="tree.treeData.value"
            :selected-keys="tree.selectedKeys.value"
            :expanded-keys="tree.expandedKeys.value"
            draggable
            block-node
            :show-icon="false"
            @select="onTreeSelect"
            @expand="(keys: any) => (tree.expandedKeys.value = keys as string[])"
            @drop="tree.onDrop"
          >
            <template #title="node">
              <!-- 分组节点：显示文件夹图标、分组名、数量、新增按钮 -->
              <!-- 点击分组名称区域可展开/折叠 -->
              <div
                v-if="node.isGroup"
                class="group flex w-full cursor-pointer items-center gap-1.5 py-0.5 font-medium text-gray-500"
                @click.stop="toggleExpand(node.key)"
              >
                <IconifyIcon icon="ant-design:folder-outlined" />
                <span class="flex-1">{{ node.title }}</span>
                <span class="text-gray-400">({{ node.children?.length ?? 0 }})</span>
                <Tooltip :title="$t('system.dict.addDictInGroup')">
                  <Button type="text" @click.stop="dictForm.openCreate(node.title)">
                    <IconifyIcon icon="ant-design:plus-outlined" />
                  </Button>
                </Tooltip>
              </div>

              <!-- 字典节点：显示名称、编码、状态标签、操作按钮 -->
              <div v-else class="group flex w-full items-center gap-2 py-0.5">
                <div class="min-w-0 flex-1">
                  <div class="truncate">{{ node.title }}</div>
                  <div class="truncate font-mono text-gray-400" style="font-size: 11px">
                    {{ node.dict.code }}
                  </div>
                </div>
                <Tag v-if="node.dict.status === 2" color="error">{{ $t('common.disabled') }}</Tag>
                <div class="flex shrink-0 items-center gap-0.5" @click.stop>
                  <Button type="text" @click="dictForm.openEdit(node.dict)">
                    <IconifyIcon icon="ant-design:edit-outlined" />
                  </Button>
                  <Popconfirm
                    :title="$t('system.dict.confirmDelete')"
                    :description="$t('system.dict.confirmDeleteContent', { name: node.dict.name })"
                    @confirm="dictForm.handleDelete(node.dict)"
                  >
                    <Button type="text" danger>
                      <IconifyIcon icon="ant-design:delete-outlined" />
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            </template>
          </Tree>

          <!-- 空状态 -->
          <div v-else-if="!tree.loading.value" class="py-10 text-center text-gray-400">
            {{ $t('system.dict.empty') }}
          </div>
        </Spin>
      </div>
    </template>

    <!-- ==================== 右侧：字典项列表 ==================== -->
    <Card
      class="ml-2 h-full"
      :body-style="{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 16px', overflow: 'hidden' }"
    >
      <!-- 未选中字典时的引导提示 -->
      <div v-if="!tree.activeDict.value" class="flex h-full items-center justify-center text-gray-400">
        <div class="text-center">
          <IconifyIcon icon="lucide:book-marked" class="mx-auto mb-2 text-gray-300" style="font-size: 2.5rem" />
          <p>{{ $t('system.dict.selectDictTip') }}</p>
        </div>
      </div>

      <!-- 已选中字典：展示字典项管理界面 -->
      <template v-else>
        <!-- 头部：字典名称/编码 + 新增按钮 -->
        <div class="mb-2 flex items-center justify-between border-b pb-2.5">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ tree.activeDict.value.name }}</span>
            <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-blue-600 dark:bg-gray-700 dark:text-blue-400" style="font-size: 12px">
              {{ tree.activeDict.value.code }}
            </code>
          </div>
          <Button type="primary" @click="itemForm.openCreate">
            + {{ $t('system.dict.addItem') }}
          </Button>
        </div>

        <!-- 搜索框 -->
        <div class="mb-2">
          <Input v-model:value="items.keyword.value" :placeholder="$t('system.dict.itemSearchPlaceholder')" allow-clear style="max-width: 260px">
            <template #prefix>
              <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
            </template>
          </Input>
        </div>

        <!-- 字典项表格（使用 vuedraggable 实现行拖拽排序） -->
        <div class="flex-1 overflow-auto">
          <Spin :spinning="items.loading.value">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b text-left text-gray-500">
                  <th class="w-10 py-2"></th>
                  <th class="py-2">{{ $t('system.dict.itemFields.label') }}</th>
                  <th class="py-2">{{ $t('system.dict.itemFields.value') }}</th>
                  <th class="py-2">{{ $t('system.dict.itemFields.color') }}</th>
                  <th class="py-2 text-center">{{ $t('system.dict.fields.status') }}</th>
                  <th class="py-2">{{ $t('system.dict.fields.remark') }}</th>
                  <th class="py-2 text-center">{{ $t('common.operation') }}</th>
                </tr>
              </thead>
              <!--
                非搜索模式：vuedraggable 绑定 items.list（源数据），拖拽直接改变数组顺序
                handle=".drag-handle" 表示只有拖拽手柄区域可以触发拖拽
                ghost-class 给拖拽占位元素添加半透明效果
                @end 拖拽结束后触发排序同步
              -->
              <draggable
                v-if="!items.isSearching.value"
                v-model="items.list.value"
                tag="tbody"
                item-key="id"
                handle=".drag-handle"
                ghost-class="opacity-50"
                @end="onItemDragEnd"
              >
                <template #item="{ element }">
                  <tr class="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="py-2">
                      <IconifyIcon icon="ant-design:holder-outlined" class="drag-handle cursor-grab text-gray-400" />
                    </td>
                    <td class="py-2">{{ element.label }}</td>
                    <td class="py-2">
                      <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-blue-600 dark:bg-gray-700 dark:text-blue-400">
                        {{ element.value }}
                      </code>
                    </td>
                    <td class="py-2">
                      <Tag v-if="element.color" :color="element.color">{{ element.color }}</Tag>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                    <td class="py-2 text-center">
                      <Tag :color="element.status === 1 ? 'success' : 'error'">
                        {{ element.status === 1 ? $t('common.enabled') : $t('common.disabled') }}
                      </Tag>
                    </td>
                    <td class="max-w-40 truncate py-2">{{ element.remark || '-' }}</td>
                    <td class="py-2 text-center">
                      <Space :size="4">
                        <Tooltip :title="$t('common.edit')">
                          <Button type="text" @click="itemForm.openEdit(element)">
                            <IconifyIcon icon="ant-design:edit-outlined" />
                          </Button>
                        </Tooltip>
                        <Popconfirm :title="$t('system.dict.confirmDeleteItem')" @confirm="itemForm.handleDelete(element)">
                          <Button type="text" danger>
                            <IconifyIcon icon="ant-design:delete-outlined" />
                          </Button>
                        </Popconfirm>
                      </Space>
                    </td>
                  </tr>
                </template>
              </draggable>
              <!-- 搜索模式：展示过滤结果，不支持拖拽（避免过滤状态下排序错乱） -->
              <tbody v-else>
                <tr v-for="element in items.filteredList.value" :key="element.id" class="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="py-2">
                    <IconifyIcon icon="ant-design:holder-outlined" class="text-gray-200" />
                  </td>
                  <td class="py-2">{{ element.label }}</td>
                  <td class="py-2">
                    <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-blue-600 dark:bg-gray-700 dark:text-blue-400">
                      {{ element.value }}
                    </code>
                  </td>
                  <td class="py-2">
                    <Tag v-if="element.color" :color="element.color">{{ element.color }}</Tag>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                  <td class="py-2 text-center">
                    <Tag :color="element.status === 1 ? 'success' : 'error'">
                      {{ element.status === 1 ? $t('common.enabled') : $t('common.disabled') }}
                    </Tag>
                  </td>
                  <td class="max-w-40 truncate py-2">{{ element.remark || '-' }}</td>
                  <td class="py-2 text-center">
                    <Space :size="4">
                      <Tooltip :title="$t('common.edit')">
                        <Button type="text" @click="itemForm.openEdit(element)">
                          <IconifyIcon icon="ant-design:edit-outlined" />
                        </Button>
                      </Tooltip>
                      <Popconfirm :title="$t('system.dict.confirmDeleteItem')" @confirm="itemForm.handleDelete(element)">
                        <Button type="text" danger>
                          <IconifyIcon icon="ant-design:delete-outlined" />
                        </Button>
                      </Popconfirm>
                    </Space>
                  </td>
                </tr>
              </tbody>
            </table>
          </Spin>
        </div>
      </template>
    </Card>

    <!-- ==================== 字典类型弹窗 ==================== -->
    <Modal
      v-model:open="dictForm.visible.value"
      :title="dictForm.editing.value ? $t('system.dict.editDict') : $t('system.dict.addDict')"
      :confirm-loading="dictForm.confirmLoading.value"
      @ok="dictForm.handleOk"
    >
      <Form :model="dictForm.formState.value" layout="vertical" class="mt-4">
        <FormItem :label="$t('system.dict.fields.name')" required>
          <Input v-model:value="dictForm.formState.value.name" :placeholder="$t('system.dict.placeholder.name')" />
        </FormItem>
        <FormItem :label="$t('system.dict.fields.code')" required>
          <Input
            v-model:value="dictForm.formState.value.code"
            :disabled="!!dictForm.editing.value"
            :placeholder="$t('system.dict.placeholder.code')"
          />
        </FormItem>
        <FormItem :label="$t('system.dict.fields.groups')">
          <CreatableSelect
            v-model:value="dictForm.formState.value.groups"
            :options="dictForm.groupOptions.value"
            :placeholder="$t('system.dict.placeholder.groups')"
            :add-placeholder="$t('system.dict.placeholder.groups')"
            allow-clear
          />
        </FormItem>
        <FormItem :label="$t('system.dict.fields.status')">
          <Select
            v-model:value="dictForm.formState.value.status"
            :options="[
              { label: $t('common.enabled'), value: 1 },
              { label: $t('common.disabled'), value: 2 },
            ]"
          />
        </FormItem>
        <FormItem :label="$t('system.dict.fields.remark')">
          <Textarea v-model:value="dictForm.formState.value.remark" :rows="2" />
        </FormItem>
      </Form>
    </Modal>

    <!-- ==================== 字典项弹窗 ==================== -->
    <Modal
      v-model:open="itemForm.visible.value"
      :title="itemForm.editing.value ? $t('system.dict.editItem') : $t('system.dict.addItem')"
      :confirm-loading="itemForm.confirmLoading.value"
      @ok="itemForm.handleOk"
    >
      <Form :model="itemForm.formState.value" layout="vertical" class="mt-4">
        <FormItem :label="$t('system.dict.itemFields.label')" required>
          <Input v-model:value="itemForm.formState.value.label" />
        </FormItem>
        <FormItem :label="$t('system.dict.itemFields.value')" required>
          <Input v-model:value="itemForm.formState.value.value" />
        </FormItem>
        <FormItem :label="$t('system.dict.itemFields.color')">
          <Select v-model:value="itemForm.formState.value.color" :options="COLOR_OPTIONS" allow-clear>
            <template #option="{ label, value: val }">
              <Space>
                <Tag v-if="val" :color="val">{{ label }}</Tag>
                <span v-else>{{ label }}</span>
              </Space>
            </template>
          </Select>
        </FormItem>
        <FormItem :label="$t('system.dict.fields.status')">
          <Select
            v-model:value="itemForm.formState.value.status"
            :options="[
              { label: $t('common.enabled'), value: 1 },
              { label: $t('common.disabled'), value: 2 },
            ]"
          />
        </FormItem>
        <FormItem :label="$t('system.dict.fields.remark')">
          <Textarea v-model:value="itemForm.formState.value.remark" :rows="2" />
        </FormItem>
      </Form>
    </Modal>
  </ColPage>
</template>
