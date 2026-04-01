<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { DictApi } from '#/api/system/dict';

import { computed, h, ref } from 'vue';

import { ColPage } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Card, Form, FormItem, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Spin, Table, Tag, Textarea, Tooltip, Tree } from 'ant-design-vue';

import {
  createDictApi,
  createDictItemApi,
  deleteDictApi,
  deleteDictItemApi,
  getAllDictsApi,
  getDictItemsApi,
  sortDictApi,
  sortDictItemApi,
  updateDictApi,
  updateDictItemApi,
} from '#/api/system/dict';
import CreatableSelect from '#/components/creatableSelect/index.vue';
import { $t } from '#/locales';

// =========================================================================
// Tree
// =========================================================================
interface GroupNode {
  key: string;
  title: string;
  isGroup: true;
  children: DictNode[];
  selectable: false;
}
interface DictNode {
  key: string;
  title: string;
  isGroup: false;
  dict: DictApi.DictItem;
  selectable: true;
}
type TreeNode = DictNode | GroupNode;

const dictLoading = ref(false);
const allDicts = ref<DictApi.DictItem[]>([]);
const treeKeyword = ref('');
const selectedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const activeDict = ref<DictApi.DictItem | null>(null);

const treeData = computed<TreeNode[]>(() => {
  const kw = treeKeyword.value.toLowerCase();
  const filtered = kw
    ? allDicts.value.filter((d) => d.name.toLowerCase().includes(kw) || d.code.toLowerCase().includes(kw))
    : allDicts.value;

  const groupMap = new Map<string, DictApi.DictItem[]>();
  for (const d of filtered) {
    const g = d.groups || $t('system/dict.defaultGroup');
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(d);
  }

  return [...groupMap.entries()].map(([groupName, dicts]) => ({
    key: `group::${groupName}`,
    title: groupName,
    isGroup: true as const,
    selectable: false as const,
    children: dicts.map((d) => ({
      key: d.id,
      title: d.name,
      isGroup: false as const,
      selectable: true as const,
      dict: d,
    })),
  }));
});

async function loadDicts() {
  dictLoading.value = true;
  try {
    allDicts.value = await getAllDictsApi();
    expandedKeys.value = [...new Set(allDicts.value.map((d) => `group::${d.groups || $t('system/dict.defaultGroup')}`))];
  } finally {
    dictLoading.value = false;
  }
}

function onTreeSelect(keys: string[], { node }: { node: TreeNode }) {
  if (node.isGroup) return;
  selectedKeys.value = keys;
  activeDict.value = node.dict;
  loadItems(node.dict.id);
}

async function onTreeDrop(info: any) {
  const dragNode: TreeNode = info.dragNode;
  const dropNode: TreeNode = info.node;
  const dropPosition: number = info.dropPosition;

  // A: 分组节点拖拽
  if (dragNode.isGroup) {
    if (!dropNode.isGroup) return;

    const groupNames = treeData.value.map((n) => n.title);
    const dragIdx = groupNames.indexOf(dragNode.title);
    const dropIdx = groupNames.indexOf(dropNode.title);
    if (dragIdx === -1 || dropIdx === -1 || dragIdx === dropIdx) return;

    const reorderedGroups = [...groupNames];
    const [movedGroup] = reorderedGroups.splice(dragIdx, 1);
    const insertAt = dropPosition < 0 ? dropIdx : dropIdx + 1;
    reorderedGroups.splice(Math.max(0, insertAt > dragIdx ? insertAt - 1 : insertAt), 0, movedGroup!);

    const groupMap = new Map<string, DictApi.DictItem[]>();
    for (const d of allDicts.value) {
      const g = d.groups || $t('system/dict.defaultGroup');
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(d);
    }

    const sortItems: DictApi.SortItem[] = [];
    let globalSort = 10;
    for (const g of reorderedGroups) {
      for (const d of groupMap.get(g) ?? []) {
        sortItems.push({ id: d.id, sort: globalSort });
        globalSort += 10;
      }
    }

    const newAllDicts: DictApi.DictItem[] = [];
    for (const g of reorderedGroups) {
      newAllDicts.push(...(groupMap.get(g) ?? []));
    }
    allDicts.value = newAllDicts;

    sortDictApi(sortItems).catch(() => loadDicts());
    return;
  }

  // B: 字典节点拖到分组节点上
  if (dropNode.isGroup && dropPosition === 0) {
    const targetGroup = dropNode.title === $t('system/dict.defaultGroup') ? '' : dropNode.title;
    if ((dragNode.dict.groups || '') === targetGroup) return;

    allDicts.value = allDicts.value.map((d) =>
      d.id === dragNode.dict.id ? { ...d, groups: targetGroup } : d,
    );

    const targetDicts = allDicts.value.filter((d) => (d.groups || '') === targetGroup);
    const sortItems = targetDicts.map((d, i) => ({ id: d.id, sort: (i + 1) * 10 }));

    try {
      await updateDictApi({ id: dragNode.dict.id, ...dragNode.dict, groups: targetGroup });
      await sortDictApi(sortItems);
    } catch {
      loadDicts();
    }
    return;
  }

  // C: 字典节点排序（同组或跨组）
  if (dropNode.isGroup) return;

  const dragGroup = dragNode.dict.groups || $t('system/dict.defaultGroup');
  const dropGroup = dropNode.dict.groups || $t('system/dict.defaultGroup');

  if (dragGroup === dropGroup) {
    const groupDicts = allDicts.value.filter(
      (d) => (d.groups || $t('system/dict.defaultGroup')) === dragGroup,
    );
    const dragIdx = groupDicts.findIndex((d) => d.id === dragNode.key);
    const dropIdx = groupDicts.findIndex((d) => d.id === dropNode.key);
    if (dragIdx === -1 || dropIdx === -1) return;

    const reordered = [...groupDicts];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropPosition <= 0 ? dropIdx : dropIdx + 1 > dragIdx ? dropIdx : dropIdx, 0, moved!);

    const otherDicts = allDicts.value.filter(
      (d) => (d.groups || $t('system/dict.defaultGroup')) !== dragGroup,
    );
    allDicts.value = [...otherDicts, ...reordered];

    const sortItems = reordered.map((d, i) => ({ id: d.id, sort: (i + 1) * 10 }));
    sortDictApi(sortItems).catch(() => loadDicts());
  } else {
    const targetGroup = dropNode.dict.groups || '';
    const targetDicts = allDicts.value.filter(
      (d) => (d.groups || '') === targetGroup && d.id !== dragNode.dict.id,
    );
    const dropIdx = targetDicts.findIndex((d) => d.id === dropNode.key);
    const insertAt = dropPosition <= 0 ? dropIdx : dropIdx + 1;
    targetDicts.splice(Math.max(0, insertAt), 0, { ...dragNode.dict, groups: targetGroup });

    allDicts.value = allDicts.value
      .filter((d) => d.id !== dragNode.dict.id)
      .map((d) => {
        const updated = targetDicts.find((t) => t.id === d.id);
        return updated ?? d;
      });

    if (!allDicts.value.some((d) => d.id === dragNode.dict.id)) {
      allDicts.value = [...allDicts.value, { ...dragNode.dict, groups: targetGroup }];
    }

    const sortItems = targetDicts.map((d, i) => ({ id: d.id, sort: (i + 1) * 10 }));
    try {
      await updateDictApi({ id: dragNode.dict.id, ...dragNode.dict, groups: targetGroup });
      await sortDictApi(sortItems);
    } catch {
      loadDicts();
    }
  }
}

// =========================================================================
// 字典类型 新增/编辑
// =========================================================================
const dictFormVisible = ref(false);
const dictFormLoading = ref(false);
const editingDict = ref<DictApi.DictItem | null>(null);
const dictFormState = ref({ name: '', code: '', groups: '', remark: '', status: 1 });

const groupOptions = computed(() =>
  [...new Set(allDicts.value.map((d) => d.groups).filter(Boolean))].map((g) => ({ value: g })),
);

function openDictCreate() {
  editingDict.value = null;
  dictFormState.value = { name: '', code: '', groups: '', remark: '', status: 1 };
  dictFormVisible.value = true;
}

function openDictCreateInGroup(groupName: string) {
  editingDict.value = null;
  dictFormState.value = {
    name: '',
    code: '',
    groups: groupName === $t('system/dict.defaultGroup') ? '' : groupName,
    remark: '',
    status: 1,
  };
  dictFormVisible.value = true;
}

function openDictEdit(dict: DictApi.DictItem) {
  editingDict.value = dict;
  dictFormState.value = {
    name: dict.name,
    code: dict.code,
    groups: dict.groups ?? '',
    remark: dict.remark ?? '',
    status: dict.status,
  };
  dictFormVisible.value = true;
}

async function handleDictFormOk() {
  dictFormLoading.value = true;
  try {
    if (editingDict.value) {
      await updateDictApi({ id: editingDict.value.id, ...dictFormState.value });
      message.success($t('system/dict.updateSuccess'));
      if (activeDict.value?.id === editingDict.value.id) {
        activeDict.value = { ...activeDict.value, ...dictFormState.value };
      }
    } else {
      await createDictApi(dictFormState.value);
      message.success($t('system/dict.createSuccess'));
    }
    dictFormVisible.value = false;
    await loadDicts();
  } finally {
    dictFormLoading.value = false;
  }
}

async function handleDictDelete(dict: DictApi.DictItem) {
  await deleteDictApi(dict.id);
  message.success($t('system/dict.deleteSuccess'));
  if (activeDict.value?.id === dict.id) {
    activeDict.value = null;
    itemList.value = [];
    selectedKeys.value = [];
  }
  await loadDicts();
}

// =========================================================================
// 字典项
// =========================================================================
const itemLoading = ref(false);
const itemList = ref<DictApi.DictItemData[]>([]);
const itemKeyword = ref('');

const filteredItemList = computed(() => {
  const kw = itemKeyword.value.toLowerCase();
  return kw
    ? itemList.value.filter((i) => i.label.toLowerCase().includes(kw) || i.value.toLowerCase().includes(kw))
    : itemList.value;
});

async function loadItems(dictId: string) {
  itemLoading.value = true;
  try {
    itemList.value = await getDictItemsApi(dictId);
  } finally {
    itemLoading.value = false;
  }
}

function onItemTableDrop(info: any) {
  const { dragIndex, dropIndex } = info;
  const data = [...itemList.value];
  const [moved] = data.splice(dragIndex, 1);
  data.splice(dropIndex, 0, moved!);
  itemList.value = data;

  const sortItems = data.map((item, i) => ({ id: item.id, sort: (i + 1) * 10 }));
  sortDictItemApi(sortItems).catch(() => loadItems(activeDict.value!.id));
}

// =========================================================================
// 字典项 Table 列
// =========================================================================
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

const itemColumns: TableColumnsType = [
  {
    key: 'sort',
    width: 40,
    customRender: () => h(IconifyIcon, { icon: 'ant-design:holder-outlined', class: 'cursor-grab text-gray-400' }),
  },
  { dataIndex: 'label', title: $t('system/dict.itemFields.label'), width: 120 },
  {
    dataIndex: 'value',
    title: $t('system/dict.itemFields.value'),
    width: 140,
    customRender: ({ text }) =>
      h('code', { class: 'rounded bg-gray-100 px-1.5 py-0.5 font-mono text-blue-600 dark:bg-gray-700 dark:text-blue-400' }, text),
  },
  {
    dataIndex: 'color',
    title: $t('system/dict.itemFields.color'),
    width: 110,
    customRender: ({ text }) => (text ? h(Tag, { color: text }, () => text) : h('span', { class: 'text-gray-400' }, '-')),
  },
  {
    dataIndex: 'status',
    title: $t('system/dict.fields.status'),
    width: 80,
    align: 'center',
    customRender: ({ text }) =>
      h(Tag, { color: text === 1 ? 'success' : 'error' }, () => (text === 1 ? $t('common.enabled') : $t('common.disabled'))),
  },
  {
    dataIndex: 'remark',
    title: $t('system/dict.fields.remark'),
    ellipsis: true,
  },
  {
    key: 'action',
    title: $t('common.operation'),
    width: 100,
    align: 'center',
    customRender: ({ record }) =>
      h(Space, { size: 4 }, () => [
        h(Tooltip, { title: $t('common.edit') }, () =>
          h(Button, { type: 'text', onClick: () => openItemEdit(record as DictApi.DictItemData) }, () =>
            h(IconifyIcon, { icon: 'ant-design:edit-outlined' }),
          ),
        ),
        h(
          Popconfirm,
          { title: $t('system/dict.confirmDeleteItem'), onConfirm: () => handleItemDelete(record as DictApi.DictItemData) },
          () => h(Button, { type: 'text', danger: true }, () => h(IconifyIcon, { icon: 'ant-design:delete-outlined' })),
        ),
      ]),
  },
];

// =========================================================================
// 字典项 新增/编辑
// =========================================================================
const itemFormVisible = ref(false);
const itemFormLoading = ref(false);
const editingItem = ref<DictApi.DictItemData | null>(null);
const itemFormState = ref({ label: '', value: '', color: '', remark: '', sort: 0, status: 1 });

function openItemCreate() {
  if (!activeDict.value) return;
  editingItem.value = null;
  itemFormState.value = { label: '', value: '', color: '', remark: '', sort: 0, status: 1 };
  itemFormVisible.value = true;
}

function openItemEdit(item: DictApi.DictItemData) {
  editingItem.value = item;
  itemFormState.value = {
    label: item.label,
    value: item.value,
    color: item.color ?? '',
    remark: item.remark ?? '',
    sort: item.sort,
    status: item.status,
  };
  itemFormVisible.value = true;
}

async function handleItemFormOk() {
  itemFormLoading.value = true;
  try {
    if (editingItem.value) {
      await updateDictItemApi({ id: editingItem.value.id, dictId: activeDict.value!.id, ...itemFormState.value });
      message.success($t('system/dict.itemUpdateSuccess'));
    } else {
      await createDictItemApi({ dictId: activeDict.value!.id, ...itemFormState.value });
      message.success($t('system/dict.itemCreateSuccess'));
    }
    itemFormVisible.value = false;
    await loadItems(activeDict.value!.id);
  } finally {
    itemFormLoading.value = false;
  }
}

async function handleItemDelete(item: DictApi.DictItemData) {
  await deleteDictItemApi(item.id);
  message.success($t('system/dict.itemDeleteSuccess'));
  await loadItems(activeDict.value!.id);
}

loadDicts();
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
    <!-- 左侧 Tree -->
    <template #left>
      <div class="mr-2 flex h-full flex-col rounded-[var(--radius)] border border-border bg-card">
        <div class="flex items-center justify-between border-b px-3 py-2.5">
          <span class="font-medium">{{ $t('system/dict.pageTitle') }}</span>
          <Tooltip :title="$t('system/dict.addDict')">
            <Button type="primary" @click="openDictCreate">
              <IconifyIcon icon="ant-design:plus-outlined" />
            </Button>
          </Tooltip>
        </div>

        <div class="px-3 py-2">
          <Input v-model:value="treeKeyword" :placeholder="$t('system/dict.searchPlaceholder')" allow-clear>
            <template #prefix>
              <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
            </template>
          </Input>
        </div>

        <Spin :spinning="dictLoading" class="flex-1 overflow-y-auto px-1 pb-2">
          <Tree
            v-if="treeData.length > 0"
            :tree-data="treeData"
            :selected-keys="selectedKeys"
            :expanded-keys="expandedKeys"
            draggable
            block-node
            :show-icon="false"
            @select="onTreeSelect"
            @expand="(keys) => (expandedKeys = keys as string[])"
            @drop="onTreeDrop"
          >
            <template #title="node">
              <div v-if="node.isGroup" class="group flex w-full items-center gap-1.5 py-0.5 font-medium text-gray-500" @click.stop>
                <IconifyIcon icon="ant-design:folder-outlined" />
                <span class="flex-1">{{ node.title }}</span>
                <span class="text-gray-400">({{ node.children?.length ?? 0 }})</span>
                <Tooltip :title="$t('system/dict.addDictInGroup')">
                  <Button type="text" class="opacity-0 transition-opacity group-hover:opacity-100" @click.stop="openDictCreateInGroup(node.title)">
                    <IconifyIcon icon="ant-design:plus-outlined" />
                  </Button>
                </Tooltip>
              </div>

              <div v-else class="group flex w-full items-center gap-2 py-0.5">
                <div class="min-w-0 flex-1">
                  <div class="truncate">{{ node.title }}</div>
                  <div class="truncate font-mono text-gray-400" style="font-size: 11px">{{ node.dict.code }}</div>
                </div>
                <Tag v-if="node.dict.status === 2" color="error">{{ $t('common.disabled') }}</Tag>
                <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100" @click.stop>
                  <Button type="text" @click="openDictEdit(node.dict)">
                    <IconifyIcon icon="ant-design:edit-outlined" />
                  </Button>
                  <Popconfirm
                    :title="$t('system/dict.confirmDelete')"
                    :description="$t('system/dict.confirmDeleteContent', { name: node.dict.name })"
                    @confirm="handleDictDelete(node.dict)"
                  >
                    <Button type="text" danger>
                      <IconifyIcon icon="ant-design:delete-outlined" />
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            </template>
          </Tree>

          <div v-else-if="!dictLoading" class="py-10 text-center text-gray-400">
            {{ $t('system/dict.empty') }}
          </div>
        </Spin>
      </div>
    </template>

    <!-- 右侧字典项 -->
    <Card
      class="ml-2 h-full"
      :body-style="{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 16px', overflow: 'hidden' }"
    >
      <div v-if="!activeDict" class="flex h-full items-center justify-center text-gray-400">
        <div class="text-center">
          <IconifyIcon icon="lucide:book-marked" class="mx-auto mb-2 text-gray-300" style="font-size: 2.5rem" />
          <p>{{ $t('system/dict.selectDictTip') }}</p>
        </div>
      </div>

      <template v-else>
        <div class="mb-2 flex items-center justify-between border-b pb-2.5">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ activeDict.name }}</span>
            <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-blue-600 dark:bg-gray-700 dark:text-blue-400" style="font-size: 12px">
              {{ activeDict.code }}
            </code>
          </div>
          <Button type="primary" @click="openItemCreate">
            + {{ $t('system/dict.addItem') }}
          </Button>
        </div>

        <div class="mb-2">
          <Input v-model:value="itemKeyword" :placeholder="$t('system/dict.itemSearchPlaceholder')" allow-clear style="max-width: 260px">
            <template #prefix>
              <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
            </template>
          </Input>
        </div>

        <div class="flex-1 overflow-auto">
          <Table
            :columns="itemColumns"
            :data-source="filteredItemList"
            :loading="itemLoading"
            :pagination="false"
            row-key="id"
            size="small"
            :components="{ body: { row: 'tr' } }"
            :custom-row="
              (_, index) => ({
                draggable: true,
                style: 'cursor: default',
                onDragstart: (e: DragEvent) => { e.dataTransfer!.setData('dragIndex', String(index)); },
                onDragover: (e: DragEvent) => { e.preventDefault(); },
                onDrop: (e: DragEvent) => {
                  const dragIndex = Number(e.dataTransfer!.getData('dragIndex'));
                  onItemTableDrop({ dragIndex, dropIndex: index as number });
                },
              })
            "
          />
        </div>
      </template>
    </Card>

    <!-- 字典类型弹窗 -->
    <Modal
      v-model:open="dictFormVisible"
      :title="editingDict ? $t('system/dict.editDict') : $t('system/dict.addDict')"
      :confirm-loading="dictFormLoading"
      @ok="handleDictFormOk"
    >
      <Form :model="dictFormState" layout="vertical" class="mt-4">
        <FormItem :label="$t('system/dict.fields.name')" required>
          <Input v-model:value="dictFormState.name" :placeholder="$t('system/dict.placeholder.name')" />
        </FormItem>
        <FormItem :label="$t('system/dict.fields.code')" required>
          <Input v-model:value="dictFormState.code" :disabled="!!editingDict" :placeholder="$t('system/dict.placeholder.code')" />
        </FormItem>
        <FormItem :label="$t('system/dict.fields.groups')">
          <CreatableSelect
            v-model:value="dictFormState.groups"
            :options="groupOptions"
            :placeholder="$t('system/dict.placeholder.groups')"
            :add-placeholder="$t('system/dict.placeholder.groups')"
            allow-clear
          />
        </FormItem>
        <FormItem :label="$t('system/dict.fields.status')">
          <Select
            v-model:value="dictFormState.status"
            :options="[
              { label: $t('common.enabled'), value: 1 },
              { label: $t('common.disabled'), value: 2 },
            ]"
          />
        </FormItem>
        <FormItem :label="$t('system/dict.fields.remark')">
          <Textarea v-model:value="dictFormState.remark" :rows="2" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 字典项弹窗 -->
    <Modal
      v-model:open="itemFormVisible"
      :title="editingItem ? $t('system/dict.editItem') : $t('system/dict.addItem')"
      :confirm-loading="itemFormLoading"
      @ok="handleItemFormOk"
    >
      <Form :model="itemFormState" layout="vertical" class="mt-4">
        <FormItem :label="$t('system/dict.itemFields.label')" required>
          <Input v-model:value="itemFormState.label" />
        </FormItem>
        <FormItem :label="$t('system/dict.itemFields.value')" required>
          <Input v-model:value="itemFormState.value" />
        </FormItem>
        <FormItem :label="$t('system/dict.itemFields.color')">
          <Select v-model:value="itemFormState.color" :options="COLOR_OPTIONS" allow-clear>
            <template #option="{ label, value: val }">
              <Space>
                <Tag v-if="val" :color="val">{{ label }}</Tag>
                <span v-else>{{ label }}</span>
              </Space>
            </template>
          </Select>
        </FormItem>
        <div class="flex gap-4">
          <FormItem :label="$t('system/dict.itemFields.sort')" class="flex-1">
            <InputNumber v-model:value="itemFormState.sort" class="w-full" />
          </FormItem>
          <FormItem :label="$t('system/dict.fields.status')" class="flex-1">
            <Select
              v-model:value="itemFormState.status"
              :options="[
                { label: $t('common.enabled'), value: 1 },
                { label: $t('common.disabled'), value: 2 },
              ]"
            />
          </FormItem>
        </div>
        <FormItem :label="$t('system/dict.fields.remark')">
          <Textarea v-model:value="itemFormState.remark" :rows="2" />
        </FormItem>
      </Form>
    </Modal>
  </ColPage>
</template>
