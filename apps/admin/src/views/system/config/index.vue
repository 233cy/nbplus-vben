<script setup lang="ts">
import type { ConfigApi } from '#/api/system/config';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  InputPassword,
  Menu,
  MenuItem,
  message,
  Modal,
  Popconfirm,
  RadioGroup,
  Select,
  Spin,
  Switch,
  Tag,
  Textarea,
  TimePicker,
  Tooltip,
  Tree,
  Typography,
} from 'ant-design-vue';

import { createConfigApi, deleteConfigApi, getConfigGroupsApi, getConfigListApi, reorderConfigApi, saveConfigApi, toggleConfigApi, updateConfigApi } from '#/api/system/config';
import CreatableSelect from '#/components/creatableSelect/index.vue';
import UpImg from '#/components/upload/upImg.vue';
import { $t } from '#/locales';

const { Text } = Typography;

// =========================================================================
// 分组
// =========================================================================
const groups = ref<ConfigApi.GroupItem[]>([]);
const activeGroup = ref('');
const loading = ref(false);

const selectedKeys = computed(() => (activeGroup.value ? [activeGroup.value] : []));

function groupLabel(item: ConfigApi.GroupItem): string {
  return item.groupLabel || item.group;
}

async function loadGroups() {
  groups.value = await getConfigGroupsApi();
  if (groups.value.length > 0 && !activeGroup.value) {
    activeGroup.value = groups.value[0]!.group;
  }
}

// =========================================================================
// 配置列表
// =========================================================================
const configItems = ref<ConfigApi.ConfigItem[]>([]);
const editValues = ref<Record<string, string>>({});

async function loadConfig(group: string) {
  loading.value = true;
  try {
    configItems.value = await getConfigListApi(group);
    const vals: Record<string, string> = {};
    for (const item of configItems.value) {
      vals[item.key] = item.value ?? '';
    }
    editValues.value = vals;
  } finally {
    loading.value = false;
  }
}

watch(activeGroup, (group) => {
  if (group) loadConfig(group);
});

loadGroups();

// =========================================================================
// 批量保存
// =========================================================================
const saving = ref(false);

async function handleSave() {
  saving.value = true;
  try {
    const items = configItems.value.map((item) => ({
      key: item.key,
      value: editValues.value[item.key] ?? '',
    }));
    await saveConfigApi(items);
    message.success($t('system/config.saveSuccess'));
    await loadConfig(activeGroup.value);
  } finally {
    saving.value = false;
  }
}

// =========================================================================
// 一键复制
// =========================================================================
function copyKey(key: string) {
  navigator.clipboard.writeText(key).then(() => {
    message.success($t('system/config.copySuccess'));
  });
}

// =========================================================================
// 标记为系统参数
// =========================================================================
async function handleMarkAsSys(item: ConfigApi.ConfigItem) {
  await toggleConfigApi(item.id, 'isSys');
  message.success($t('system/config.markAsSysSuccess'));
  await loadConfig(activeGroup.value);
}

async function handleTogglePublic(item: ConfigApi.ConfigItem) {
  await toggleConfigApi(item.id, 'isPublic');
  await loadConfig(activeGroup.value);
}

// =========================================================================
// 新增 / 编辑弹窗
// =========================================================================
const COMPONENT_KEYS = ['Input', 'InputPassword', 'Textarea', 'InputNumber', 'Switch', 'UpImg', 'Edit'] as const;

const COMPONENT_OPTIONS = computed(() =>
  COMPONENT_KEYS.map((key) => ({
    label: `${$t(`system/config.components.${key}` as any)} (${key})`,
    value: key,
  })),
);

const modalVisible = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const modalLoading = ref(false);
const editingItem = ref<ConfigApi.ConfigItem | null>(null);

const formState = ref({
  group: '',
  key: '',
  label: '',
  component: 'Input',
  isEncrypted: false,
  isPublic: true,
  sort: 0,
  remark: '',
});

// 编辑时是否为系统参数（锁定 key/group/component/isEncrypted）
const editingIsSys = computed(() => modalMode.value === 'edit' && !!editingItem.value?.isSys);

function openCreate() {
  modalMode.value = 'create';
  formState.value = {
    group: activeGroup.value,
    key: '',
    label: '',
    component: 'Input',
    isEncrypted: false,
    isPublic: true,
    sort: 0,
    remark: '',
  };
  editingItem.value = null;
  modalVisible.value = true;
}

function openEdit(item: ConfigApi.ConfigItem) {
  modalMode.value = 'edit';
  editingItem.value = item;
  formState.value = {
    group: item.group,
    key: item.key,
    label: item.label,
    component: item.component,
    isEncrypted: item.isEncrypted,
    isPublic: item.isPublic,
    sort: item.sort,
    remark: item.remark ?? '',
  };
  modalVisible.value = true;
}

async function handleModalOk() {
  modalLoading.value = true;
  try {
    if (modalMode.value === 'create') {
      await createConfigApi(formState.value);
      message.success($t('system/config.createSuccess'));
    } else {
      await updateConfigApi({ id: editingItem.value!.id, ...formState.value });
      message.success($t('system/config.updateSuccess'));
    }
    modalVisible.value = false;
    await loadConfig(activeGroup.value);
    await loadGroups();
  } finally {
    modalLoading.value = false;
  }
}

// =========================================================================
// 删除
// =========================================================================
async function handleDelete(item: ConfigApi.ConfigItem) {
  await deleteConfigApi(item.id);
  message.success($t('system/config.deleteSuccess'));
  await loadConfig(activeGroup.value);
  await loadGroups();
}

// =========================================================================
// 拖拽排序弹窗
// =========================================================================
interface TreeNode {
  key: string; // item.id
  title: string; // item.label (key)
  isLeaf: true;
  _item: ConfigApi.ConfigItem;
}

const sortModalVisible = ref(false);
const sortLoading = ref(false);
const sortTreeData = ref<TreeNode[]>([]);

function openSortModal() {
  sortTreeData.value = [...configItems.value]
    .toSorted((a, b) => a.sort - b.sort)
    .map((item) => ({
      key: item.id,
      title: item.label,
      isLeaf: true as const,
      _item: item,
    }));
  sortModalVisible.value = true;
}

function onTreeDrop(info: any) {
  const dropKey = info.node.key;
  const dragKey = info.dragNode.key;
  const dropPos = info.node.pos.split('-');
  const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

  const data = [...sortTreeData.value];

  // 1. 找到并移除拖拽项
  const dragIdx = data.findIndex((n) => n.key === dragKey);
  if (dragIdx === -1) return;
  const [dragObj] = data.splice(dragIdx, 1);

  // 2. 找目标位置（splice 后重新找）  const targetIdx = data.findIndex((n) => n.key === dropKey);
  if (targetIdx === -1) {
    // 找不到目标（极端情况），放回原位
    data.splice(dragIdx, 0, dragObj!);
    sortTreeData.value = data;
    return;
  }

  if (!info.dropToGap || dropPosition === -1) {
    // 插到目标节点前面
    data.splice(targetIdx, 0, dragObj!);
  } else {
    // 插到目标节点后面
    data.splice(targetIdx + 1, 0, dragObj!);
  }

  sortTreeData.value = data;
}

async function handleSortOk() {
  sortLoading.value = true;
  try {
    const items = sortTreeData.value.map((node, idx) => ({
      id: node.key,
      sort: (idx + 1) * 5,
    }));
    await reorderConfigApi(items);
    message.success($t('system/config.sortSuccess'));
    sortModalVisible.value = false;
    await loadConfig(activeGroup.value);
  } finally {
    sortLoading.value = false;
  }
}

// =========================================================================
// 渲染辅助
// =========================================================================
const groupOptions = computed(() => groups.value.map((g) => ({ value: g.group, label: `${g.group} (${g.groupLabel})` })));

const activeGroupLabel = computed(() => {
  const found = groups.value.find((g) => g.group === activeGroup.value);
  return found ? groupLabel(found) : activeGroup.value;
});

function onSwitchChange(key: string, checked: boolean | string) {
  editValues.value[key] = checked ? '1' : '0';
}
</script>

<template>
  <div class="flex h-full gap-4 p-4">
    <!-- 左侧分组菜单 -->
    <div class="w-48 shrink-0 rounded-lg bg-white shadow-sm dark:bg-gray-800">
      <div class="border-b px-4 py-3 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
        {{ $t('system/config.groupTitle') }}
      </div>
      <Menu :selected-keys="selectedKeys" mode="inline" class="border-none" @click="({ key }) => (activeGroup = key as string)">
        <MenuItem v-for="g in groups" :key="g.group">
          {{ groupLabel(g) }}
        </MenuItem>
      </Menu>
    </div>

    <!-- 右侧内容�?-->
    <div class="flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
      <!-- 顶部操作�?-->
      <div class="flex items-center justify-between border-b px-6 py-3 dark:border-gray-700">
        <span class="text-base font-medium">{{ activeGroupLabel }}</span>
        <div class="flex gap-2">
        <Button size="small" @click="openSortModal">⇅ {{ $t('system/config.sortModal') }}</Button>
          <Button type="primary" size="small" @click="openCreate"> + {{ $t('system/config.addItem') }} </Button>
        </div>
      </div>

      <!-- 配置列表 -->
      <Spin :spinning="loading" class="flex-1 overflow-auto">
        <div class="divide-y dark:divide-gray-700">
          <div v-for="item in configItems" :key="item.key" class="flex items-start gap-4 px-6 py-4">
            <!-- 标签 + KEY -->
            <div class="w-56 shrink-0">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ item.label }}</span>
                <Tag v-if="item.isSys" color="gold" class="ml-1 text-xs">{{ $t('system/config.isSysTag') }}</Tag>
              </div>
              <!-- KEY 放大 + 复制 -->
              <div class="mt-1 flex items-center gap-1">
                <Text code class="select-all font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {{ item.key }}
                </Text>
                <Tooltip :title="$t('system/config.copySuccess')">
                  <Button type="text" size="small" class="flex items-center p-0 text-gray-400 hover:text-blue-500" @click="copyKey(item.key)">
                    <span class="i-ant-design:copy-outlined text-sm"></span>
                  </Button>
                </Tooltip>
              </div>
              <div v-if="item.remark" class="mt-0.5 text-xs text-gray-400">{{ item.remark }}</div>
            </div>

            <!-- 输入控件 -->
            <div class="flex-1">
              <Switch
                v-if="item.component === 'Switch'"
                :checked="editValues[item.key] === '1' || editValues[item.key] === 'true'"
                @change="(checked) => onSwitchChange(item.key, checked as boolean)"
              />
              <InputNumber
                v-else-if="item.component === 'InputNumber'"
                :value="Number(editValues[item.key])"
                class="w-full"
                @change="(val) => (editValues[item.key] = String(val ?? ''))"
              />
              <Textarea
                v-else-if="item.component === 'Textarea'"
                v-model:value="editValues[item.key]"
                :placeholder="item.isEncrypted ? $t('system/config.encryptedPlaceholder') : ''"
                :rows="3"
              />
              <Select v-else-if="item.component === 'Select'" v-model:value="editValues[item.key]" class="w-full" allow-clear />
              <RadioGroup v-else-if="item.component === 'RadioGroup'" v-model:value="editValues[item.key]" />
              <DatePicker
                v-else-if="item.component === 'DatePicker'"
                :value="editValues[item.key] || undefined"
                class="w-full"
                @change="(_, ds) => (editValues[item.key] = ds as string)"
              />
              <TimePicker
                v-else-if="item.component === 'TimePicker'"
                :value="editValues[item.key] || undefined"
                class="w-full"
                @change="(_, ts) => (editValues[item.key] = ts as string)"
              />
              <UpImg v-else-if="item.component === 'UpImg'" :model-value="editValues[item.key]" @update:model-value="(val) => (editValues[item.key] = val ?? '')" />
              <InputPassword
                v-else-if="item.component === 'InputPassword' || item.isEncrypted"
                v-model:value="editValues[item.key]"
                :placeholder="item.isEncrypted ? $t('system/config.encryptedPlaceholder') : ''"
              />
              <wang-editor v-else-if="item.component === 'Edit'" v-model="editValues[item.key]" />
              <Input v-else v-model:value="editValues[item.key]" />
            </div>

            <!-- 操作按钮 -->
            <div class="flex shrink-0 items-center gap-2">
              <!-- 设为系统参数：已是系统参数则禁用 -->
              <Popconfirm v-if="!item.isSys" :title="$t('system/config.markAsSysConfirm')" @confirm="handleMarkAsSys(item)">
                <Tooltip :title="$t('system/config.markAsSys')">
                  <Button>
                    <IconifyIcon icon="ant-design:lock-outlined" class="text-amber-500" />
                  </Button>
                </Tooltip>
              </Popconfirm>
              <Tooltip v-else :title="$t('system/config.isSysTag')">
                <Button disabled>
                  <IconifyIcon icon="ant-design:lock-outlined" />
                </Button>
              </Tooltip>

              <!-- 是否公开访问：始终可点击切换 -->
              <Tooltip :title="item.isPublic ? $t('system/config.togglePublicOff') : $t('system/config.togglePublicOn')">
                <Button :type="item.isPublic ? 'primary' : 'default'" @click="handleTogglePublic(item)">
                  <IconifyIcon :icon="item.isPublic ? 'ant-design:eye-outlined' : 'ant-design:eye-invisible-outlined'" />
                </Button>
              </Tooltip>

              <!-- 编辑：始终可点击 -->
              <Tooltip :title="$t('system/config.editItem')">
                <Button @click="openEdit(item)">
                  <IconifyIcon icon="ant-design:edit-outlined" />
                </Button>
              </Tooltip>

              <!-- 删除：isSys 时禁用 -->
              <Popconfirm v-if="!item.isSys" :title="$t('system/config.confirmDelete')" @confirm="handleDelete(item)">
                <Button danger>
                  <IconifyIcon icon="ant-design:delete-outlined" />
                </Button>
              </Popconfirm>
              <Tooltip v-else :title="$t('system/config.isSysTag')">
                <Button danger disabled>
                  <IconifyIcon icon="ant-design:delete-outlined" />
                </Button>
              </Tooltip>
            </div>
          </div>

          <div v-if="configItems.length === 0 && !loading" class="py-16 text-center text-gray-400">
            {{ $t('system/config.empty') }}
          </div>
        </div>
      </Spin>

      <!-- 底部保存按钮 -->
      <div class="flex justify-end border-t px-6 py-3 dark:border-gray-700">
        <Button type="primary" :loading="saving" @click="handleSave">
          {{ $t('system/config.save') }}
        </Button>
      </div>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <Modal v-model:open="modalVisible" :title="modalMode === 'create' ? $t('system/config.addItem') : $t('system/config.editItem')" :confirm-loading="modalLoading" @ok="handleModalOk">
      <Form :model="formState" layout="vertical" class="mt-4">
        <FormItem :label="$t('system/config.fields.group')" required>
          <CreatableSelect v-model:value="formState.group" :options="groupOptions" :disabled="editingIsSys" :add-placeholder="$t('system/config.fields.group')" />
        </FormItem>
        <FormItem v-if="modalMode === 'create'" :label="$t('system/config.fields.key')" required>
          <Input v-model:value="formState.key" />
        </FormItem>
        <!-- 编辑�?key 只读展示 -->
        <FormItem v-else :label="$t('system/config.fields.key')">
          <Input :value="formState.key" disabled />
        </FormItem>
        <FormItem :label="$t('system/config.fields.label')" required>
          <Input v-model:value="formState.label" />
        </FormItem>
        <FormItem :label="$t('system/config.fields.component')">
          <Select v-model:value="formState.component" :options="COMPONENT_OPTIONS" />
        </FormItem>
        <div class="flex gap-6">
          <FormItem :label="$t('system/config.fields.isEncrypted')">
            <Switch v-model:checked="formState.isEncrypted" />
          </FormItem>
          <FormItem :label="$t('system/config.fields.isPublic')">
            <Switch v-model:checked="formState.isPublic" />
          </FormItem>
          <FormItem :label="$t('system/config.fields.sort')">
            <Input v-model:value="formState.sort" type="number" style="width: 80px" />
          </FormItem>
        </div>
        <FormItem :label="$t('system/config.fields.remark')">
          <Textarea v-model:value="formState.remark" :rows="2" />
        </FormItem>
      </Form>
    </Modal>
    <!-- 排序弹窗 -->
    <Modal v-model:open="sortModalVisible" :title="$t('system/config.sortModal')" :confirm-loading="sortLoading" width="520px" @ok="handleSortOk">
      <p class="mb-4 text-sm text-gray-400">{{ $t('system/config.sortModalTip') }}</p>
      <Tree :tree-data="sortTreeData" draggable block-node :show-icon="false" :selectable="false" @drop="onTreeDrop">
        <template #title="{ title, _item }">
          <div class="flex items-center gap-3 py-2">
            <IconifyIcon
              icon="ant-design:drag-outlined"
              class="shrink-0 cursor-grab text-xl font-black text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            />
            <span class="flex-1 text-base font-medium text-gray-800 dark:text-gray-200">{{ title }}</span>
            <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-blue-600 dark:bg-gray-700 dark:text-blue-400">{{ _item.key }}</code>
            <Tag v-if="_item.isSys" color="gold">{{ $t('system/config.isSysTag') }}</Tag>
          </div>
        </template>
      </Tree>
    </Modal>
  </div>
</template>
