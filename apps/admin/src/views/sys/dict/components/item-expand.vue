<script setup lang="ts">
import type { DictApi } from '#/api/sys/dict';

import { computed, ref, watch } from 'vue';

import { Button, Checkbox, Empty, Input, Spin, Tag } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import {
  batchDeleteDictItemApi,
  batchUpdateDictItemApi,
  deleteDictItemApi,
  getDictItemListApi,
  updateDictItemApi,
} from '#/api/sys/dict';
import CellInlineEdit from '#/components/vxe-table/CellInlineEdit.vue';
import TableActions, { type TableActionItem } from '#/components/vxe-table/TableActions.vue';
import BatchActionDropdown from '#/components/vxe-table/BatchActionDropdown.vue';
import { $t } from '#/locales';
import { useTableDelete } from '#/utils/table';

import { useDictPermission } from '../permissions';
import ItemForm from './item-form.vue';

const props = defineProps<{
  dict: DictApi.DictItem;
}>();

const { canItemsUpdate, canItemsDelete, canItemsCreate } = useDictPermission();

const loading = ref(false);
const items = ref<DictApi.DictItemData[]>([]);
const keyword = ref('');
const selectedIds = ref<string[]>([]);

async function loadItems() {
  loading.value = true;
  try {
    items.value = await getDictItemListApi(props.dict.id);
    selectedIds.value = selectedIds.value.filter(id => items.value.some(i => i.id === id));
  } finally {
    loading.value = false;
  }
}

watch(() => props.dict.id, loadItems, { immediate: true });

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return items.value;
  return items.value.filter(
    i => i.label.toLowerCase().includes(kw) || i.value.toLowerCase().includes(kw),
  );
});

const allSelected = computed(() => {
  if (filteredItems.value.length === 0) return false;
  return filteredItems.value.every(i => selectedIds.value.includes(i.id));
});

const indeterminate = computed(() => {
  const selectedCount = filteredItems.value.filter(i => selectedIds.value.includes(i.id)).length;
  return selectedCount > 0 && selectedCount < filteredItems.value.length;
});

function toggleSelect(id: string, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value.push(id);
  } else {
    selectedIds.value = selectedIds.value.filter(i => i !== id);
  }
}

function toggleAll(checked: boolean) {
  if (checked) {
    selectedIds.value = [
      ...new Set([...selectedIds.value, ...filteredItems.value.map(i => i.id)]),
    ];
  } else {
    selectedIds.value = selectedIds.value.filter(id => !filteredItems.value.some(i => i.id === id));
  }
}

function getSelectedIds(): string[] {
  return selectedIds.value;
}

function itemActions(item: DictApi.DictItemData): TableActionItem[] {
  const actions: TableActionItem[] = [];
  if (canItemsUpdate) {
    actions.push({
      key: 'edit',
      label: $t('common.edit'),
      icon: 'lucide:pencil',
      onClick: () => openEditItem(item),
    });
  }
  if (canItemsDelete) {
    actions.push({
      key: 'delete',
      label: $t('common.delete'),
      icon: 'lucide:trash-2',
      danger: true,
      confirmTitle: $t('common.confirmDelete'),
      onClick: () => useTableDelete(deleteDictItemApi, item.id, item.label, loadItems),
    });
  }
  return actions;
}

const editingItem = ref<DictApi.DictItemData | null>(null);
const itemFormVisible = ref(false);

function openCreateItem() {
  editingItem.value = null;
  itemFormVisible.value = true;
}

function openEditItem(item: DictApi.DictItemData) {
  editingItem.value = item;
  itemFormVisible.value = true;
}

function onItemFormSuccess() {
  itemFormVisible.value = false;
  loadItems();
}

function onBatchSuccess() {
  selectedIds.value = [];
  loadItems();
}
</script>

<template>
  <div class="ml-12 bg-muted/30 px-4 py-3">
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm font-medium">
        <span>{{ $t('sys.dict.itemListTitle', { name: dict.name }) }}</span>
        <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-blue-600 dark:bg-gray-700 dark:text-blue-400">
          {{ dict.code }}
        </code>
      </div>
      <div class="flex items-center gap-2">
        <BatchActionDropdown
          v-if="canItemsDelete"
          type="direct"
          :action="$t('common.delete')"
          :api-fn="(ids: string[]) => batchDeleteDictItemApi(ids)"
          :get-ids="getSelectedIds"
          :on-success="onBatchSuccess"
        >
          <template #default="{ onClick }">
            <Button danger size="small" @click="onClick">
              <IconifyIcon icon="lucide:trash-2" class="size-4" />
              {{ $t('common.batchDelete') }}
            </Button>
          </template>
        </BatchActionDropdown>

        <BatchActionDropdown
          v-if="canItemsUpdate"
          type="dict"
          :action="$t('common.batchUpdate')"
          :api-fn="batchUpdateDictItemApi"
          :get-ids="getSelectedIds"
          :on-success="onBatchSuccess"
          field-name="status"
          dict-code="is_enable"
        >
          <template #default>
            <Button size="small">
              <IconifyIcon icon="lucide:layers" class="size-4" />
              {{ $t('common.batchUpdate') }}
              <IconifyIcon icon="lucide:chevron-down" class="size-4" />
            </Button>
          </template>
        </BatchActionDropdown>

        <Input
          v-model:value="keyword"
          :placeholder="$t('sys.dict.itemSearchPlaceholder')"
          allow-clear
          style="width: 220px"
        >
          <template #prefix>
            <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
          </template>
        </Input>
        <Button v-if="canItemsCreate" type="primary" size="small" @click="openCreateItem">
          <IconifyIcon icon="ant-design:plus-outlined" />
          {{ $t('sys.dict.addItem') }}
        </Button>
      </div>
    </div>

    <Spin :spinning="loading">
      <div v-if="filteredItems.length > 0" class="overflow-hidden rounded-[var(--radius)] border">
        <table class="w-full text-sm">
          <thead class="bg-muted text-left">
            <tr>
              <th class="w-10 px-3 py-2 text-center">
                <Checkbox
                  :checked="allSelected"
                  :indeterminate="indeterminate"
                  @update:checked="toggleAll"
                />
              </th>
              <th class="px-3 py-2">{{ $t('sys.dict.itemFields.label') }}</th>
              <th class="px-3 py-2">{{ $t('sys.dict.itemFields.value') }}</th>
              <th class="px-3 py-2 text-center">{{ $t('common.status') }}</th>
              <th class="px-3 py-2">{{ $t('sys.dict.fields.remark') }}</th>
              <th class="w-28 px-3 py-2">{{ $t('sys.dict.itemFields.sort') }}</th>
              <th class="px-3 py-2 text-center">{{ $t('common.operation') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredItems"
              :key="item.id"
              class="border-t bg-card hover:bg-muted/50"
            >
              <td class="px-3 py-2 text-center">
                <Checkbox
                  :checked="selectedIds.includes(item.id)"
                  @update:checked="(checked: boolean) => toggleSelect(item.id, checked)"
                />
              </td>
              <td class="px-3 py-2">
                <Tag v-if="item.color" :color="item.color">{{ item.label }}</Tag>
                <span v-else>{{ item.label }}</span>
              </td>
              <td class="px-3 py-2">
                <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-blue-600 dark:bg-gray-700 dark:text-blue-400">
                  {{ item.value }}
                </code>
              </td>
              <td class="px-3 py-2 text-center">
                <Tag :color="item.status === 1 ? 'success' : 'error'">
                  {{ item.status === 1 ? $t('common.enabled') : $t('common.disabled') }}
                </Tag>
              </td>
              <td class="max-w-xs truncate px-3 py-2">{{ item.remark || '-' }}</td>
              <td class="w-28 px-3 py-2">
                <div class="inline-flex w-20">
                  <CellInlineEdit
                    v-if="canItemsUpdate"
                    :row="item"
                    field="sort"
                    type="number"
                    :api-fn="(id: string, _field: string, value: any) => updateDictItemApi({ id, dictId: item.dictId, label: item.label, value: item.value, sort: value })"
                    :after-success="loadItems"
                  />
                  <span v-else>{{ item.sort }}</span>
                </div>
              </td>
              <td class="px-3 py-2 text-center">
                <TableActions :actions="itemActions(item)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Empty v-else :description="$t('sys.dict.itemsEmpty')">
        <Button v-if="canItemsCreate" type="primary" size="small" @click="openCreateItem">
          {{ $t('sys.dict.addItem') }}
        </Button>
      </Empty>
    </Spin>

    <ItemForm
      v-model:visible="itemFormVisible"
      :is-edit="!!editingItem"
      :dict-id="dict.id"
      :dict-name="dict.name"
      :data="editingItem"
      @success="onItemFormSuccess"
    />
  </div>
</template>
