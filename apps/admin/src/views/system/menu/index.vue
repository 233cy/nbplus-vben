<script setup lang="ts">
import type { MenuAdminApi } from '#/api/core/menuAdmin';

import { computed, ref, toRaw } from 'vue';

import { IconPicker } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  RadioButton,
  RadioGroup,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Tree,
  TreeSelect,
} from 'ant-design-vue';

import { createMenuApi, deleteMenuApi, getMenuListApi, sortMenuApi, toggleMenuApi, updateMenuApi } from '#/api';
import { $t } from '#/locales';

defineOptions({ name: 'MenuPage' });

// =========================================================================
// 数据加载
// =========================================================================
const loading = ref(false);
const treeData = ref<MenuAdminApi.MenuItem[]>([]);

async function loadMenus() {
  loading.value = true;
  try {
    treeData.value = await getMenuListApi();
  } finally {
    loading.value = false;
  }
}

loadMenus();

// =========================================================================
// 展开/收起控制
// =========================================================================
const expandedKeys = ref<string[]>([]);

/** 递归收集所有节点 id */
function collectAllKeys(nodes: MenuAdminApi.MenuItem[]): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    keys.push(node.id);
    if (node.children?.length) keys.push(...collectAllKeys(node.children));
  }
  return keys;
}

function expandAll() {
  expandedKeys.value = collectAllKeys(treeData.value);
}

function collapseAll() {
  expandedKeys.value = [];
}

function toggleNode(id: string) {
  const idx = expandedKeys.value.indexOf(id);
  expandedKeys.value = idx === -1 ? [...expandedKeys.value, id] : expandedKeys.value.filter((k) => k !== id);
}

// =========================================================================
// 拖拽排序（禁止跨层级）
// =========================================================================

/** 找到节点的父节点 id，null 表示顶级 */
function findParentId(nodes: MenuAdminApi.MenuItem[], targetId: string, parentId: null | string = null): null | string {
  for (const node of nodes) {
    if (node.id === targetId) return parentId;
    if (node.children?.length) {
      const found = findParentId(node.children, targetId, node.id);
      if (found !== 'NOT_FOUND') return found;
    }
  }
  return 'NOT_FOUND';
}

function allowDrop(info: any): boolean {
  // 禁止拖入节点内部，只允许间隙排序
  if (!info.dropNode) return false;

  // 只允许同父级排序，禁止跨目录拖拽
  const dragParent = findParentId(treeData.value, info.dragNode.key);
  const dropParent = findParentId(treeData.value, info.dropNode.id);

  if (dragParent === 'NOT_FOUND' || dropParent === 'NOT_FOUND') return false;

  return dragParent === dropParent;
}

function onDrop(info: any) {
  // 必须是间隙放置且同父级
  if (!info.dropToGap) return;

  const dragParent = findParentId(treeData.value, info.dragNode.key);
  const dropParent = findParentId(treeData.value, info.node.key);
  if (dragParent === 'NOT_FOUND' || dropParent === 'NOT_FOUND' || dragParent !== dropParent) return;

  const dropKey: string = info.node.key;
  const dragKey: string = info.dragNode.key;
  const dropPos: string[] = info.node.pos.split('-');
  const dropPosition: number = info.dropPosition - Number(dropPos[dropPos.length - 1]);

  const loop = (data: MenuAdminApi.MenuItem[], key: string, callback: (item: MenuAdminApi.MenuItem, idx: number, arr: MenuAdminApi.MenuItem[]) => void) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i]!.id === key) {
        callback(data[i]!, i, data);
        return;
      }
      if (data[i]!.children?.length) loop(data[i]!.children!, key, callback);
    }
  };

  const data = structuredClone(toRaw(treeData.value)) as MenuAdminApi.MenuItem[];
  let dragObj!: MenuAdminApi.MenuItem;

  // 先从原位置移除
  loop(data, dragKey, (item, idx, arr) => {
    arr.splice(idx, 1);
    dragObj = item;
  });

  // 插入到目标间隙
  if (dropPosition === -1) {
    // 拖到目标节点上方
    loop(data, dropKey, (_item, idx, arr) => {
      arr.splice(idx, 0, dragObj);
    });
  } else {
    // 拖到目标节点下方
    loop(data, dropKey, (_item, idx, arr) => {
      arr.splice(idx + 1, 0, dragObj);
    });
  }

  treeData.value = data;

  // 提交排序到后端（只提交同层级节点的排序）
  const sortItems: { id: string; sort: number }[] = [];
  const collectSort = (nodes: MenuAdminApi.MenuItem[]) => {
    nodes.forEach((n, i) => {
      sortItems.push({ id: n.id, sort: (i + 1) * 10 });
      if (n.children?.length) collectSort(n.children);
    });
  };
  collectSort(data);
  sortMenuApi(sortItems).catch(() => loadMenus());
}

// =========================================================================
// 弹窗表单
// =========================================================================
const STATUS_OPTIONS = [
  { label: $t('menu.status.enabled'), value: 1 },
  { label: $t('menu.status.disabled'), value: 2 },
];

const modalVisible = ref(false);
const modalLoading = ref(false);
const isEdit = ref(false);

const defaultForm = (): MenuAdminApi.SaveParams & { id?: string } => ({
  parentId: null,
  type: 1,
  title: '',
  name: '',
  path: '',
  component: '',
  icon: '',
  permission: '',
  sort: 0,
  isHidden: false,
  isKeepAlive: false,
  status: 1,
});

const form = ref(defaultForm());

/** 根据 id 找节点 title */
function findNodeTitle(nodes: MenuAdminApi.MenuItem[], id: string): string {
  for (const node of nodes) {
    if (node.id === id) return node.title;
    if (node.children?.length) {
      const found = findNodeTitle(node.children, id);
      if (found) return found;
    }
  }
  return '';
}

const ROOT_PARENT = '__root__';

/** 构建父节点选择器的树数据，排除 excludeId 及其子孙（显示完整树） */
function buildParentTreeData(nodes: MenuAdminApi.MenuItem[], excludeId?: string): any[] {
  const result: any[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    const children = node.children?.length ? buildParentTreeData(node.children, excludeId) : [];
    result.push({ label: node.title, value: node.id, children });
  }
  return result;
}

// =========================================================================
// 移动节点（变更父节点）
// =========================================================================
const moveVisible = ref(false);
const moveLoading = ref(false);
const moveItem = ref<MenuAdminApi.MenuItem | null>(null);
const moveParentId = ref<string>(ROOT_PARENT);

function openMove(item: MenuAdminApi.MenuItem) {
  moveItem.value = item;
  moveParentId.value = item.parentId ?? ROOT_PARENT;
  moveVisible.value = true;
}

async function handleMove() {
  if (!moveItem.value) return;
  moveLoading.value = true;
  try {
    const parentId = moveParentId.value === ROOT_PARENT ? null : moveParentId.value;
    await updateMenuApi({ ...moveItem.value, parentId });
    message.success('移动成功');
    moveVisible.value = false;
    await loadMenus();
  } finally {
    moveLoading.value = false;
  }
}

const moveTreeData = computed(() => {
  const excludeId = moveItem.value?.id;
  return [{ label: '顶级', value: ROOT_PARENT, children: [] }, ...buildParentTreeData(treeData.value, excludeId)];
});

const modalTitle = computed(() => {
  if (isEdit.value) return $t('menu.edit');
  const parentId = form.value.parentId;
  const parentTitle = parentId ? findNodeTitle(treeData.value, parentId) : '';
  const location = parentTitle ? `「${parentTitle}」` : '「顶级」';
  return `${parentId ? $t('menu.addChild') : $t('menu.addRoot')} - ${location}`;
});

function openCreate(parentId: null | string = null) {
  isEdit.value = false;
  form.value = { ...defaultForm(), parentId };
  modalVisible.value = true;
}

function openEdit(item: MenuAdminApi.MenuItem) {
  isEdit.value = true;
  form.value = {
    id: item.id,
    parentId: item.parentId,
    type: item.type,
    title: item.title,
    name: item.name,
    path: item.path,
    component: item.component,
    icon: item.icon,
    permission: item.permission,
    sort: item.sort,
    isHidden: item.isHidden,
    isKeepAlive: item.isKeepAlive,
    status: item.status,
  };
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.title?.trim()) {
    message.warning('请输入菜单标题');
    return;
  }
  if (form.value.type !== 3 && !form.value.name?.trim()) {
    message.warning('请输入路由名称');
    return;
  }
  if (form.value.type !== 3 && !form.value.path?.trim()) {
    message.warning('请输入路由路径');
    return;
  }
  if (form.value.type === 2 && !form.value.component?.trim()) {
    message.warning('请输入组件路径');
    return;
  }
  if (form.value.type === 3 && !form.value.permission?.trim()) {
    message.warning('请输入权限码');
    return;
  }
  modalLoading.value = true;
  try {
    if (isEdit.value && form.value.id) {
      await updateMenuApi(form.value as MenuAdminApi.SaveParams & { id: string });
      message.success($t('menu.updateSuccess'));
    } else {
      await createMenuApi(form.value);
      message.success($t('menu.createSuccess'));
    }
    modalVisible.value = false;
    await loadMenus();
  } finally {
    modalLoading.value = false;
  }
}

async function handleDelete(id: string) {
  await deleteMenuApi(id);
  message.success($t('menu.deleteSuccess'));
  await loadMenus();
}

// 快捷切换加载状态，key 为 `${id}_status` / `${id}_keepAlive`
const toggleLoading = ref<Record<string, boolean>>({});

async function handleToggleStatus(item: MenuAdminApi.MenuItem) {
  const key = `${item.id}_status`;
  toggleLoading.value[key] = true;
  try {
    const newStatus = item.status === 1 ? 2 : 1;
    await toggleMenuApi(item.id, 'status', newStatus);
    item.status = newStatus;
  } finally {
    toggleLoading.value[key] = false;
  }
}

async function handleToggleKeepAlive(item: MenuAdminApi.MenuItem) {
  const key = `${item.id}_keepAlive`;
  toggleLoading.value[key] = true;
  try {
    const newVal = !item.isKeepAlive;
    await toggleMenuApi(item.id, 'isKeepAlive', newVal);
    item.isKeepAlive = newVal;
  } finally {
    toggleLoading.value[key] = false;
  }
}
// =========================================================================
// 渲染辅助
// =========================================================================
function typeTag(type: number) {
  if (type === 1) return { color: 'blue', text: $t('menu.type.dir') };
  if (type === 2) return { color: 'green', text: $t('menu.type.menu') };
  return { color: 'orange', text: $t('menu.type.button') };
}
</script>

<template>
  <div class="p-4">
    <!-- 顶部操作栏 -->
    <div class="mb-3 flex items-center justify-between">
      <Space>
        <Button @click="expandAll">
          <template #icon>
            <IconifyIcon icon="ant-design:node-expand-outlined" />
          </template>
          全部展开
        </Button>
        <Button @click="collapseAll">
          <template #icon>
            <IconifyIcon icon="ant-design:node-collapse-outlined" />
          </template>
          全部收起
        </Button>
      </Space>
      <Button type="primary" @click="openCreate()">
        <template #icon>
          <IconifyIcon icon="ant-design:plus-outlined" />
        </template>
        {{ $t('menu.addRoot') }}
      </Button>
    </div>

    <Spin :spinning="loading">
      <Tree
        v-model:expanded-keys="expandedKeys"
        :tree-data="treeData as any"
        :field-names="{ key: 'id', title: 'title', children: 'children' }"
        draggable
        block-node
        :show-icon="false"
        :selectable="false"
        :allow-drop="allowDrop"
        class="menu-tree"
        @drop="onDrop"
      >
        <template #title="item">
          <div class="flex items-center justify-between px-2 py-2">
            <!-- 拖拽手柄（唯一可拖拽区域） -->
            <IconifyIcon icon="ant-design:holder-outlined" class="mr-1 flex-shrink-0 cursor-grab text-base text-muted-foreground" />

            <!-- 左侧主信息 -->
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <button v-if="item.children?.length" class="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground" @click.stop="toggleNode(item.id)">
                <IconifyIcon :icon="expandedKeys.includes(item.id) ? 'ant-design:minus-square-outlined' : 'ant-design:plus-square-outlined'" class="text-base" />
              </button>
              <span v-else class="w-4 flex-shrink-0"></span>

              <IconifyIcon v-if="item.icon" :icon="item.icon" class="flex-shrink-0 text-lg" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ item.title }}</span>
                  <Tag :color="typeTag(item.type).color" class="flex-shrink-0 text-xs">{{ typeTag(item.type).text }}</Tag>
                  <Tag v-if="item.isHidden" color="default" class="flex-shrink-0 text-xs">隐藏</Tag>
                </div>
                <div class="mt-0.5 flex items-center gap-3">
                  <span v-if="item.name" class="font-mono text-xs text-muted-foreground">{{ item.name }}</span>
                  <span v-if="item.path" class="font-mono text-xs text-muted-foreground">{{ item.path }}</span>
                  <span v-if="item.component && item.type === 2" class="font-mono text-xs text-muted-foreground opacity-60">{{ item.component }}</span>
                  <span v-if="item.permission" class="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-xs text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">{{
                    item.permission
                  }}</span>
                </div>
              </div>
            </div>

            <!-- 右侧：快捷开关 + 操作按钮 -->
            <div class="ml-4 flex flex-shrink-0 items-center gap-3">
              <!-- 启用状态 -->
              <Tooltip :title="item.status === 1 ? '点击禁用' : '点击启用'">
                <div class="flex items-center gap-1" @click.stop>
                  <Switch :checked="item.status === 1" :loading="toggleLoading[`${item.id}_status`]" @change="handleToggleStatus(item)" />
                  <span :class="item.status === 1 ? 'text-green-500' : 'text-red-400'" class="text-xs">
                    {{ item.status === 1 ? '启用' : '禁用' }}
                  </span>
                </div>
              </Tooltip>

              <!-- 缓存（仅菜单类型） -->
              <Tooltip v-if="item.type === 2" :title="item.isKeepAlive ? '关闭缓存' : '开启缓存'">
                <div class="flex items-center gap-1" @click.stop>
                  <Switch :checked="item.isKeepAlive" :loading="toggleLoading[`${item.id}_keepAlive`]" @change="handleToggleKeepAlive(item)" />
                  <span :class="item.isKeepAlive ? 'text-cyan-500' : 'text-muted-foreground'" class="text-xs">缓存</span>
                </div>
              </Tooltip>

              <div class="h-4 w-px bg-border"></div>

              <Tooltip v-if="item.type < 3" title="新增子菜单">
                <Button size="small" type="text" @click.stop="openCreate(item.id)">
                  <IconifyIcon icon="ant-design:plus-outlined" />
                </Button>
              </Tooltip>
              <Tooltip title="移动到">
                <Button size="small" type="text" @click.stop="openMove(item)">
                  <IconifyIcon icon="ant-design:drag-outlined" />
                </Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button size="small" type="text" @click.stop="openEdit(item)">
                  <IconifyIcon icon="ant-design:edit-outlined" />
                </Button>
              </Tooltip>
              <Popconfirm :title="$t('menu.confirmDelete')" @confirm="handleDelete(item.id)">
                <Tooltip title="删除">
                  <Button size="small" type="text" danger @click.stop>
                    <IconifyIcon icon="ant-design:delete-outlined" />
                  </Button>
                </Tooltip>
              </Popconfirm>
            </div>
          </div>
        </template>
      </Tree>

      <div v-if="!loading && treeData.length === 0" class="py-16 text-center text-gray-400">
        {{ $t('common.noDataAvailable') }}
      </div>
    </Spin>

    <!-- 新增/编辑弹窗 -->
    <Modal v-model:open="modalVisible" :title="modalTitle" :confirm-loading="modalLoading" width="600px" @ok="handleSubmit">
      <Form :model="form" layout="vertical" class="mt-4">
        <!-- 类型 + 状态 -->
        <div class="grid grid-cols-2 gap-x-4">
          <FormItem :label="$t('menu.fields.type')" required>
            <RadioGroup v-model:value="form.type" button-style="solid">
              <RadioButton :value="1">{{ $t('menu.type.dir') }}</RadioButton>
              <RadioButton :value="2">{{ $t('menu.type.menu') }}</RadioButton>
              <RadioButton :value="3">{{ $t('menu.type.button') }}</RadioButton>
            </RadioGroup>
          </FormItem>
          <FormItem :label="$t('menu.fields.status')">
            <Select v-model:value="form.status" :options="STATUS_OPTIONS" class="w-full" />
          </FormItem>
        </div>

        <!-- 标题（所有类型必填） -->
        <FormItem :label="$t('menu.fields.title')" required>
          <Input v-model:value="form.title" />
        </FormItem>

        <!-- 目录 + 菜单 -->
        <template v-if="form.type !== 3">
          <div class="grid grid-cols-2 gap-x-4">
            <FormItem :label="$t('menu.fields.name')" required>
              <Input v-model:value="form.name" placeholder="如：SystemConfig" />
            </FormItem>
            <FormItem :label="$t('menu.fields.path')" required>
              <Input v-model:value="form.path" placeholder="如：/system/config" />
            </FormItem>
          </div>

          <!-- 菜单专属：组件路径 -->
          <FormItem v-if="form.type === 2" :label="$t('menu.fields.component')" required>
            <Input v-model:value="form.component" :placeholder="$t('menu.placeholder.component')" />
          </FormItem>

          <!-- 图标 -->
          <FormItem :label="$t('menu.fields.icon')">
            <div class="flex items-center gap-2">
              <IconPicker v-model="form.icon" prefix="lucide" />
            </div>
          </FormItem>
        </template>

        <!-- 按钮专属：权限码 -->
        <FormItem v-if="form.type === 3" :label="$t('menu.fields.permission')" required>
          <Input v-model:value="form.permission" :placeholder="$t('menu.placeholder.permission')" />
        </FormItem>

        <!-- 排序 + 隐藏 + 缓存 -->
        <div class="grid grid-cols-3 gap-x-4">
          <FormItem :label="$t('menu.fields.sort')">
            <InputNumber v-model:value="form.sort" class="w-full" :min="0" />
          </FormItem>
          <FormItem v-if="form.type !== 3" :label="$t('menu.fields.isHidden')">
            <Switch v-model:checked="form.isHidden" />
          </FormItem>
          <FormItem v-if="form.type === 2" :label="$t('menu.fields.isKeepAlive')">
            <Switch v-model:checked="form.isKeepAlive" />
          </FormItem>
        </div>
      </Form>
    </Modal>
    <!-- 移动节点弹窗 -->
    <Modal v-model:open="moveVisible" :title="`移动「${moveItem?.title}」到`" :confirm-loading="moveLoading" width="400px" @ok="handleMove">
      <div class="py-4">
        <TreeSelect
          v-model:value="moveParentId"
          :tree-data="moveTreeData"
          tree-default-expand-all
          class="w-full"
        />
      </div>
    </Modal>
  </div>
</template>

<style scoped>
:deep(.menu-tree .ant-tree-treenode) {
  padding: 2px 0;
}

:deep(.menu-tree .ant-tree-node-content-wrapper) {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 0 4px;
  border-radius: 6px;
}

:deep(.menu-tree .ant-tree-node-content-wrapper:hover) {
  background-color: hsl(var(--accent));
}

:deep(.menu-tree .ant-tree-switcher) {
  display: none;
}
</style>
