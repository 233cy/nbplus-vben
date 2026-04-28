<script setup lang="ts">
import type { MenuAdminApi } from '#/api/dev/menuAdmin';

import { computed, ref, toRaw } from 'vue';

import { IconPicker } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Checkbox,
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

const expandedKeys = ref<string[]>([]);
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

function findParentId(nodes: MenuAdminApi.MenuItem[], targetId: string, parentId: null | string = null): null | string {
  for (const node of nodes) {
    if (node.id === targetId) return parentId;
    if (node.children?.length) {
      const f = findParentId(node.children, targetId, node.id);
      if (f !== 'NOT_FOUND') return f;
    }
  }
  return 'NOT_FOUND';
}

function allowDrop(info: any): boolean {
  if (!info.dropNode) return false;
  const dp = findParentId(treeData.value, info.dragNode.key);
  const op = findParentId(treeData.value, info.dropNode.id);
  if (dp === 'NOT_FOUND' || op === 'NOT_FOUND') return false;
  return dp === op;
}

function onDrop(info: any) {
  if (!info.dropToGap) return;
  const dp = findParentId(treeData.value, info.dragNode.key);
  const op = findParentId(treeData.value, info.node.key);
  if (dp === 'NOT_FOUND' || op === 'NOT_FOUND' || dp !== op) return;
  const dropKey: string = info.node.key;
  const dragKey: string = info.dragNode.key;
  const dropPos: string[] = info.node.pos.split('-');
  const dropPosition: number = info.dropPosition - Number(dropPos[dropPos.length - 1]);
  const loop = (data: MenuAdminApi.MenuItem[], key: string, cb: (item: MenuAdminApi.MenuItem, idx: number, arr: MenuAdminApi.MenuItem[]) => void) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i]!.id === key) {
        cb(data[i]!, i, data);
        return;
      }
      if (data[i]!.children?.length) loop(data[i]!.children!, key, cb);
    }
  };
  const data = structuredClone(toRaw(treeData.value)) as MenuAdminApi.MenuItem[];
  let dragObj!: MenuAdminApi.MenuItem;
  loop(data, dragKey, (item, idx, arr) => {
    arr.splice(idx, 1);
    dragObj = item;
  });
  if (dropPosition === -1) {
    loop(data, dropKey, (_item, idx, arr) => arr.splice(idx, 0, dragObj));
  } else {
    loop(data, dropKey, (_item, idx, arr) => arr.splice(idx + 1, 0, dragObj));
  }
  treeData.value = data;
  const sortItems: { id: string; sort: number }[] = [];
  const cs = (nodes: MenuAdminApi.MenuItem[]) => {
    nodes.forEach((n, i) => {
      sortItems.push({ id: n.id, sort: (i + 1) * 10 });
      if (n.children?.length) cs(n.children);
    });
  };
  cs(data);
  sortMenuApi(sortItems).catch(() => loadMenus());
}

const TYPE_OPTIONS = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 },
  { label: '内嵌', value: 4 },
  { label: '外链', value: 5 },
];

/** 根据父节点类型返回可选的子类型 */
function getAllowedTypes(parentId: null | string): typeof TYPE_OPTIONS {
  if (!parentId) {
    // 顶级只能建目录
    return [{ label: '目录', value: 1 }];
  }
  const parent = findNodeById(treeData.value, parentId);
  if (!parent) return TYPE_OPTIONS;
  switch (parent.type) {
    case 1: {
      return [
        { label: '目录', value: 1 },
        { label: '菜单', value: 2 },
        { label: '内嵌', value: 4 },
        { label: '外链', value: 5 },
      ];
    }
    case 2:
    case 4:
    case 5: {
      return [{ label: '按钮', value: 3 }];
    }
    default: {
      return TYPE_OPTIONS;
    }
  }
}

const availableTypes = computed(() => getAllowedTypes(form.value.parentId ?? null));
const STATUS_OPTIONS = [
  { label: $t('dev.menu.status.enabled'), value: 1 },
  { label: $t('dev.menu.status.disabled'), value: 2 },
];
const BADGE_TYPE_OPTIONS = [
  { label: '不显示', value: '' },
  { label: '圆点', value: 'dot' },
  { label: '文字', value: 'normal' },
];
function typeTag(type: number) {
  const map: Record<number, { color: string; text: string }> = {
    1: { color: 'blue', text: '目录' },
    2: { color: 'green', text: '菜单' },
    3: { color: 'orange', text: '按钮' },
    4: { color: 'purple', text: '内嵌' },
    5: { color: 'cyan', text: '外链' },
  };
  return map[type] ?? { color: 'default', text: '未知' };
}

const modalVisible = ref(false);
const modalLoading = ref(false);
const isEdit = ref(false);

const defaultForm = (): MenuAdminApi.SaveParams & { id?: string } => ({
  parentId: null,
  type: 1,
  title: '',
  name: '',
  path: '',
  activePath: '',
  linkSrc: '',
  component: '',
  icon: '',
  activeIcon: '',
  permission: '',
  sort: 0,
  badge: '',
  badgeType: '',
  badgeVariants: '',
  isHidden: false,
  isHideChildren: false,
  isHideBreadcrumb: false,
  isHideTab: false,
  isKeepAlive: false,
  isAffixTab: false,
  status: 1,
});
const form = ref(defaultForm());

function findNodeTitle(nodes: MenuAdminApi.MenuItem[], id: string): string {
  for (const node of nodes) {
    if (node.id === id) return node.title;
    if (node.children?.length) {
      const f = findNodeTitle(node.children, id);
      if (f) return f;
    }
  }
  return '';
}

function findNodeById(nodes: MenuAdminApi.MenuItem[], id: string): MenuAdminApi.MenuItem | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const f = findNodeById(node.children, id);
      if (f) return f;
    }
  }
  return null;
}

const modalTitle = computed(() => {
  if (isEdit.value) return $t('dev.menu.edit');
  const pid = form.value.parentId;
  const pt = pid ? findNodeTitle(treeData.value, pid) : '';
  return `${pid ? $t('dev.menu.addChild') : $t('dev.menu.addRoot')} - ${pt ? `「${pt}」` : '「顶级」'}`;
});

function openCreate(parentId: null | string = null) {
  isEdit.value = false;
  const allowed = getAllowedTypes(parentId);
  // 自动选第一个可用类型
  const defaultType = allowed[0]?.value ?? 1;
  form.value = { ...defaultForm(), parentId, type: defaultType as MenuAdminApi.MenuType };
  modalVisible.value = true;
}
function openEdit(item: MenuAdminApi.MenuItem) {
  isEdit.value = true;
  form.value = { ...item };
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
  if ([1, 2, 4, 5].includes(form.value.type) && !form.value.path?.trim()) {
    message.warning('请输入路由路径');
    return;
  }
  if (form.value.type === 2 && !form.value.component?.trim()) {
    message.warning('请输入组件路径');
    return;
  }
  if ([4, 5].includes(form.value.type) && !form.value.linkSrc?.trim()) {
    message.warning('请输入链接地址');
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
      message.success($t('dev.menu.updateSuccess'));
    } else {
      await createMenuApi(form.value);
      message.success($t('dev.menu.createSuccess'));
    }
    modalVisible.value = false;
    await loadMenus();
  } finally {
    modalLoading.value = false;
  }
}

async function handleDelete(id: string) {
  await deleteMenuApi(id);
  message.success($t('dev.menu.deleteSuccess'));
  await loadMenus();
}

const toggleLoading = ref<Record<string, boolean>>({});
async function handleToggleStatus(item: MenuAdminApi.MenuItem) {
  const key = `${item.id}_status`;
  toggleLoading.value[key] = true;
  try {
    const ns = item.status === 1 ? 2 : 1;
    await toggleMenuApi(item.id, 'status', ns);
    item.status = ns;
  } finally {
    toggleLoading.value[key] = false;
  }
}
async function handleToggleKeepAlive(item: MenuAdminApi.MenuItem) {
  const key = `${item.id}_keepAlive`;
  toggleLoading.value[key] = true;
  try {
    const nv = !item.isKeepAlive;
    await toggleMenuApi(item.id, 'isKeepAlive', nv);
    item.isKeepAlive = nv;
  } finally {
    toggleLoading.value[key] = false;
  }
}

const ROOT_PARENT = '__root__';
const moveVisible = ref(false);
const moveLoading = ref(false);
const moveItem = ref<MenuAdminApi.MenuItem | null>(null);
const moveParentId = ref<string>(ROOT_PARENT);

function buildParentTreeData(nodes: MenuAdminApi.MenuItem[], excludeId?: string): any[] {
  const result: any[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    result.push({ label: node.title, value: node.id, children: node.children?.length ? buildParentTreeData(node.children, excludeId) : [] });
  }
  return result;
}
const moveTreeData = computed(() => [{ label: '顶级', value: ROOT_PARENT, children: [] }, ...buildParentTreeData(treeData.value, moveItem.value?.id)]);

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
</script>

<template>
  <div class="p-4">
    <div class="mb-3 flex items-center justify-between">
      <Space>
        <Button @click="expandAll">
          <template #icon><IconifyIcon icon="ant-design:node-expand-outlined" /></template>全部展开
        </Button>
        <Button @click="collapseAll">
          <template #icon><IconifyIcon icon="ant-design:node-collapse-outlined" /></template>全部收起
        </Button>
      </Space>
      <Button type="primary" @click="openCreate()">
        <template #icon><IconifyIcon icon="ant-design:plus-outlined" /></template>
        {{ $t('dev.menu.addRoot') }}
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
        :show-line="true"
        :allow-drop="allowDrop"
        class="menu-tree"
        @drop="onDrop"
      >
        <template #title="item">
          <div class="flex items-center justify-between px-2 py-2">
            <IconifyIcon icon="ant-design:holder-outlined" class="mr-1 flex-shrink-0 cursor-grab text-base text-muted-foreground" />
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
                  <Tag v-if="item.badgeType" :color="item.badgeType === 'dot' ? 'red' : 'blue'" class="flex-shrink-0 text-xs">
                    {{ item.badgeType === 'dot' ? '●' : item.badge }}
                  </Tag>
                </div>
                <div class="mt-0.5 flex items-center gap-3">
                  <span v-if="item.name" class="font-mono text-xs text-muted-foreground">{{ item.name }}</span>
                  <span v-if="item.path" class="font-mono text-xs text-muted-foreground">{{ item.path }}</span>
                  <span v-if="item.component && item.type === 2" class="font-mono text-xs text-muted-foreground opacity-60">{{ item.component }}</span>
                  <span v-if="item.linkSrc && [4, 5].includes(item.type)" class="font-mono text-xs text-blue-500 opacity-80">{{ item.linkSrc }}</span>
                  <span v-if="item.permission" class="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-xs text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">{{
                    item.permission
                  }}</span>
                </div>
              </div>
            </div>
            <div class="ml-4 flex flex-shrink-0 items-center gap-3">
              <Tooltip :title="item.status === 1 ? '点击禁用' : '点击启用'">
                <div class="flex items-center gap-1" @click.stop>
                  <Switch :checked="item.status === 1" :loading="toggleLoading[`${item.id}_status`]" @change="handleToggleStatus(item)" />
                  <span :class="item.status === 1 ? 'text-green-500' : 'text-red-400'" class="text-xs">{{ item.status === 1 ? '启用' : '禁用' }}</span>
                </div>
              </Tooltip>
              <Tooltip v-if="item.type === 2" :title="item.isKeepAlive ? '关闭缓存' : '开启缓存'">
                <div class="flex items-center gap-1" @click.stop>
                  <Switch :checked="item.isKeepAlive" :loading="toggleLoading[`${item.id}_keepAlive`]" @change="handleToggleKeepAlive(item)" />
                  <span :class="item.isKeepAlive ? 'text-cyan-500' : 'text-muted-foreground'" class="text-xs">缓存</span>
                </div>
              </Tooltip>
              <div class="h-4 w-px bg-border"></div>
              <Tooltip v-if="item.type !== 3" title="新增子菜单">
                <Button size="small" type="text" @click.stop="openCreate(item.id)"><IconifyIcon icon="ant-design:plus-outlined" /></Button>
              </Tooltip>
              <Tooltip title="移动到">
                <Button size="small" type="text" @click.stop="openMove(item)"><IconifyIcon icon="ant-design:drag-outlined" /></Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button size="small" type="text" @click.stop="openEdit(item)"><IconifyIcon icon="ant-design:edit-outlined" /></Button>
              </Tooltip>
              <Popconfirm :title="$t('dev.menu.confirmDelete')" @confirm="handleDelete(item.id)">
                <Tooltip title="删除">
                  <Button size="small" type="text" danger @click.stop><IconifyIcon icon="ant-design:delete-outlined" /></Button>
                </Tooltip>
              </Popconfirm>
            </div>
          </div>
        </template>
      </Tree>
      <div v-if="!loading && treeData.length === 0" class="py-16 text-center text-gray-400">{{ $t('common.noDataAvailable') }}</div>
    </Spin>

    <!-- 新增/编辑弹窗 -->
    <Modal v-model:open="modalVisible" :title="modalTitle" :confirm-loading="modalLoading" width="680px" @ok="handleSubmit">
      <Form :model="form" layout="vertical" class="mt-4">
        <div class="grid grid-cols-2 gap-x-4">
          <FormItem label="类型" required>
            <RadioGroup v-model:value="form.type" button-style="solid">
              <RadioButton v-for="opt in availableTypes" :key="opt.value" :value="opt.value">{{ opt.label }}</RadioButton>
            </RadioGroup>
          </FormItem>
          <FormItem :label="$t('dev.menu.fields.status')">
            <Select v-model:value="form.status" :options="STATUS_OPTIONS" class="w-full" />
          </FormItem>
        </div>
        <FormItem :label="$t('dev.menu.fields.title')" required>
          <Input v-model:value="form.title" />
        </FormItem>
        <template v-if="form.type !== 3">
          <div class="grid grid-cols-2 gap-x-4">
            <FormItem :label="$t('dev.menu.fields.name')" required>
              <Input v-model:value="form.name" placeholder="如：SystemUser" />
            </FormItem>
            <FormItem :label="$t('dev.menu.fields.path')" required>
              <Input v-model:value="form.path" placeholder="如：/system/user" />
            </FormItem>
          </div>
          <FormItem v-if="[2, 4].includes(form.type)" label="激活路径">
            <Input v-model:value="form.activePath" placeholder="用于高亮侧边栏，如详情页激活列表菜单" />
          </FormItem>
          <FormItem v-if="[4, 5].includes(form.type)" label="链接地址" required>
            <Input v-model:value="form.linkSrc" :placeholder="form.type === 4 ? 'iframe 地址' : '外链地址'" />
          </FormItem>
          <FormItem v-if="form.type === 2" :label="$t('dev.menu.fields.component')" required>
            <Input v-model:value="form.component" :placeholder="$t('dev.menu.placeholder.component')" />
          </FormItem>
          <div class="grid grid-cols-2 gap-x-4">
            <FormItem :label="$t('dev.menu.fields.icon')">
              <IconPicker v-model="form.icon" prefix="lucide" />
            </FormItem>
            <FormItem label="激活图标">
              <IconPicker v-model="form.activeIcon" prefix="lucide" />
            </FormItem>
          </div>
        </template>
        <FormItem v-if="form.type === 3" :label="$t('dev.menu.fields.permission')" required>
          <Input v-model:value="form.permission" :placeholder="$t('dev.menu.placeholder.permission')" />
        </FormItem>
        <FormItem :label="$t('dev.menu.fields.sort')">
          <InputNumber v-model:value="form.sort" class="w-full" :min="0" />
        </FormItem>
        <template v-if="form.type !== 3">
          <div class="grid grid-cols-3 gap-x-4">
            <FormItem label="徽标类型">
              <Select v-model:value="form.badgeType" :options="BADGE_TYPE_OPTIONS" class="w-full" />
            </FormItem>
            <FormItem label="徽标内容">
              <Input v-model:value="form.badge" :disabled="form.badgeType !== 'normal'" placeholder="文字内容" />
            </FormItem>
            <FormItem label="徽标样式">
              <Select
                v-model:value="form.badgeVariants"
                :disabled="!form.badgeType"
                :options="[
                  { label: 'default（默认）', value: 'default' },
                  { label: 'primary（主色）', value: 'primary' },
                  { label: 'success（成功）', value: 'success' },
                  { label: 'warning（警告）', value: 'warning' },
                  { label: 'destructive（危险）', value: 'destructive' },
                ]"
                allow-clear
                class="w-full"
              />
            </FormItem>
          </div>
        </template>
        <div class="grid grid-cols-3 gap-x-4">
          <FormItem v-if="form.type !== 3">
            <Checkbox v-model:checked="form.isHidden">隐藏菜单</Checkbox>
          </FormItem>
          <FormItem v-if="[1, 2].includes(form.type)">
            <Checkbox v-model:checked="form.isHideChildren">隐藏子菜单</Checkbox>
          </FormItem>
          <FormItem v-if="form.type !== 3">
            <Checkbox v-model:checked="form.isHideBreadcrumb">隐藏面包屑</Checkbox>
          </FormItem>
          <FormItem v-if="form.type !== 3">
            <Checkbox v-model:checked="form.isHideTab">隐藏标签页</Checkbox>
          </FormItem>
          <FormItem v-if="form.type === 2">
            <Checkbox v-model:checked="form.isKeepAlive">缓存页面</Checkbox>
          </FormItem>
          <FormItem v-if="[2, 4].includes(form.type)">
            <Checkbox v-model:checked="form.isAffixTab">固定标签页</Checkbox>
          </FormItem>
        </div>
      </Form>
    </Modal>

    <!-- 移动节点弹窗 -->
    <Modal v-model:open="moveVisible" :title="`移动「${moveItem?.title}」到`" :confirm-loading="moveLoading" width="400px" @ok="handleMove">
      <div class="py-4">
        <TreeSelect v-model:value="moveParentId" :tree-data="moveTreeData" tree-default-expand-all class="w-full" />
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
