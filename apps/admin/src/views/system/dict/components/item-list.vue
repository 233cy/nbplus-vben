<script setup lang="ts">
import type { DictApi } from '#/api/system/dict';

import { computed, ref } from 'vue';

import { Button, Card, Empty, Input, Space, Spin, Tag, Tooltip } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import { $t } from '#/locales';

const props = defineProps<{
  activeDict: DictApi.DictItem | null;
  items: DictApi.DictItemData[];
  loading: boolean;
  keyword: string;
}>();

const emit = defineEmits<{
  'update:keyword': [value: string];
  add: [];
  edit: [item: DictApi.DictItemData];
  delete: [item: DictApi.DictItemData];
  'sort-change': [items: DictApi.DictItemData[]];
}>();

const editingSortId = ref<string | null>(null);

const filteredItems = computed(() => {
  const kw = props.keyword.trim().toLowerCase();
  if (!kw) return props.items;
  return props.items.filter(
    (i) => i.label.toLowerCase().includes(kw) || i.value.toLowerCase().includes(kw),
  );
});

function updateSort(item: DictApi.DictItemData, sort: number) {
  const next = props.items.map((i) => (i.id === item.id ? { ...i, sort } : i)).sort((a, b) => a.sort - b.sort);
  emit('sort-change', next);
  editingSortId.value = null;
}
</script>

<template>
  <Card class="ml-2 h-full" :body-style="{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 16px', overflow: 'hidden' }">
    <!-- 未选中字典 -->
    <div v-if="!activeDict" class="flex h-full items-center justify-center text-gray-400">
      <div class="text-center">
        <IconifyIcon icon="lucide:book-marked" class="mx-auto mb-2 text-gray-300" style="font-size: 2.5rem" />
        <p>{{ $t('system.dict.selectDictTip') }}</p>
      </div>
    </div>

    <!-- 已选中字典 -->
    <template v-else>
      <div class="mb-2 flex items-center justify-between border-b pb-2.5">
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ activeDict.name }}</span>
          <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-blue-600 dark:bg-gray-700 dark:text-blue-400" style="font-size: 12px">
            {{ activeDict.code }}
          </code>
        </div>
        <Button type="primary" @click="$emit('add')"> + {{ $t('system.dict.addItem') }} </Button>
      </div>

      <div class="mb-2">
        <Input
          :value="keyword"
          :placeholder="$t('system.dict.itemSearchPlaceholder')"
          allow-clear
          style="max-width: 260px"
          @update:value="$emit('update:keyword', $event)"
        >
          <template #prefix>
            <IconifyIcon icon="ant-design:search-outlined" class="text-gray-400" />
          </template>
        </Input>
      </div>

      <!-- 字典项表格 -->
      <div class="flex-1 overflow-auto">
        <Spin :spinning="loading">
          <table v-if="filteredItems.length > 0" class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-gray-500">
                <th class="py-2">{{ $t('system.dict.itemFields.sort') }}</th>
                <th class="py-2">{{ $t('system.dict.itemFields.label') }}</th>
                <th class="py-2">{{ $t('system.dict.itemFields.value') }}</th>
                <th class="py-2 text-center">{{ $t('system.dict.fields.status') }}</th>
                <th class="py-2">{{ $t('system.dict.fields.remark') }}</th>
                <th class="py-2 text-center">{{ $t('common.operation') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id" class="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="py-2">
                  <span v-if="editingSortId !== item.id" class="cursor-pointer" @click="editingSortId = item.id">{{ item.sort }}</span>
                  <Input v-else :value="item.sort" type="number" size="small" style="width: 70px" @blur="updateSort(item, Number(($event.target as HTMLInputElement).value))" @press-enter="updateSort(item, Number(($event.target as HTMLInputElement).value))" />
                </td>
                <td class="py-2">{{ item.label }}</td>
                <td class="py-2">
                  <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-blue-600 dark:bg-gray-700 dark:text-blue-400">
                    {{ item.value }}
                  </code>
                </td>
                <td class="py-2 text-center">
                  <Tag :color="item.status === 1 ? 'success' : 'error'">
                    {{ item.status === 1 ? $t('common.enabled') : $t('common.disabled') }}
                  </Tag>
                </td>
                <td class="max-w-40 truncate py-2">{{ item.remark || '-' }}</td>
                <td class="py-2 text-center">
                  <Space :size="4">
                    <Tooltip :title="$t('common.edit')">
                      <Button type="text" @click="$emit('edit', item)">
                        <IconifyIcon icon="ant-design:edit-outlined" />
                      </Button>
                    </Tooltip>
                    <Tooltip :title="$t('common.delete')">
                      <Button type="text" danger @click="$emit('delete', item)">
                        <IconifyIcon icon="ant-design:delete-outlined" />
                      </Button>
                    </Tooltip>
                  </Space>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="flex h-full items-center justify-center">
            <Empty :description="$t('system.dict.itemsEmpty')">
              <Button type="primary" @click="$emit('add')">{{ $t('system.dict.addItem') }}</Button>
            </Empty>
          </div>
        </Spin>
      </div>
    </template>
  </Card>
</template>
