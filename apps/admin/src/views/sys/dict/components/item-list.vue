<script setup lang="ts">
import type { DictApi } from '#/api/sys/dict';

import { computed, ref, watch } from 'vue';

import { Button, Card, Empty, Input, Spin, Tag } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import vuedraggable from 'vuedraggable';

import { sortDictItemApi } from '#/api/sys/dict';
import TableActions, { type TableActionItem } from '#/components/vxe-table/TableActions.vue';
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
  reload: [];
}>();

const isFiltering = computed(() => props.keyword.trim().length > 0);

const filteredItems = computed(() => {
  const kw = props.keyword.trim().toLowerCase();
  if (!kw) return props.items;
  return props.items.filter(
    (i) => i.label.toLowerCase().includes(kw) || i.value.toLowerCase().includes(kw),
  );
});

/** 拖拽用的可变副本，跟随 props.items 同步 */
const sortableItems = ref<DictApi.DictItemData[]>([]);
watch(() => props.items, (val) => { sortableItems.value = [...val]; }, { immediate: true });

/** 拖拽落库中的加载状态 */
const sorting = ref(false);

async function onDragEnd() {
  sorting.value = true;
  try {
    const payload = sortableItems.value.map((item, i) => ({
      id: item.id,
      sort: (i + 1) * 10,
    }));
    await sortDictItemApi(payload);
    emit('reload');
  } finally {
    sorting.value = false;
  }
}
</script>

<template>
  <Card class="ml-2 h-full" :body-style="{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 16px', overflow: 'hidden' }">
    <!-- 未选中字典 -->
    <div v-if="!activeDict" class="flex h-full items-center justify-center text-gray-400">
      <div class="text-center">
        <IconifyIcon icon="lucide:book-marked" class="mx-auto mb-2 text-gray-300" style="font-size: 2.5rem" />
        <p>{{ $t('sys.dict.selectDictTip') }}</p>
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
        <Button type="primary" @click="$emit('add')"> + {{ $t('sys.dict.addItem') }} </Button>
      </div>

      <div class="mb-2">
        <Input
          :value="keyword"
          :placeholder="$t('sys.dict.itemSearchPlaceholder')"
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
        <Spin :spinning="loading || sorting">
          <template v-if="filteredItems.length > 0">
            <!-- 无关键字时：可拖拽排序 -->
            <table v-if="!isFiltering" class="w-full text-sm">
              <thead>
                <tr class="border-b text-left text-gray-500">
                  <th class="w-8 py-2" />
                  <th class="py-2">{{ $t('sys.dict.itemFields.label') }}</th>
                  <th class="py-2">{{ $t('sys.dict.itemFields.value') }}</th>
                  <th class="py-2 text-center">{{ $t('sys.dict.fields.status') }}</th>
                  <th class="py-2">{{ $t('sys.dict.fields.remark') }}</th>
                  <th class="py-2 text-center">{{ $t('common.operation') }}</th>
                </tr>
              </thead>
              <vuedraggable v-model="sortableItems" tag="tbody" item-key="id" handle=".drag-handle" @end="onDragEnd">
                <template #item="{ element: item }">
                  <tr :key="item.id" class="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="drag-handle w-8 cursor-grab py-2 text-center text-gray-400">
                      <IconifyIcon icon="ant-design:menu-outlined" />
                    </td>
                    <td class="py-2">
                      <Tag v-if="item.color" :color="item.color">{{ item.label }}</Tag>
                      <span v-else>{{ item.label }}</span>
                    </td>
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
                      <TableActions
                        :actions="[
                          {
                            key: 'edit',
                            label: $t('common.edit'),
                            icon: 'ant-design:edit-outlined',
                            onClick: () => $emit('edit', item),
                          },
                          {
                            key: 'delete',
                            label: $t('common.delete'),
                            icon: 'ant-design:delete-outlined',
                            danger: true,
                            confirmTitle: $t('common.confirmDelete'),
                            onClick: () => $emit('delete', item),
                          },
                        ] as TableActionItem[]"
                      />
                    </td>
                  </tr>
                </template>
              </vuedraggable>
            </table>

            <!-- 有关键字搜索时：只读列表，禁止拖拽 -->
            <table v-else class="w-full text-sm">
              <thead>
                <tr class="border-b text-left text-gray-500">
                  <th class="py-2">{{ $t('sys.dict.itemFields.label') }}</th>
                  <th class="py-2">{{ $t('sys.dict.itemFields.value') }}</th>
                  <th class="py-2 text-center">{{ $t('sys.dict.fields.status') }}</th>
                  <th class="py-2">{{ $t('sys.dict.fields.remark') }}</th>
                  <th class="py-2 text-center">{{ $t('common.operation') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredItems" :key="item.id" class="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
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
                    <TableActions
                      :actions="[
                        {
                          key: 'edit',
                          label: $t('common.edit'),
                          icon: 'ant-design:edit-outlined',
                          onClick: () => $emit('edit', item),
                        },
                        {
                          key: 'delete',
                          label: $t('common.delete'),
                          icon: 'ant-design:delete-outlined',
                          danger: true,
                          confirmTitle: $t('common.confirmDelete'),
                          onClick: () => $emit('delete', item),
                        },
                      ] as TableActionItem[]"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <div v-else class="flex h-full items-center justify-center">
            <Empty :description="$t('sys.dict.itemsEmpty')">
              <Button type="primary" @click="$emit('add')">{{ $t('sys.dict.addItem') }}</Button>
            </Empty>
          </div>
        </Spin>
      </div>
    </template>
  </Card>
</template>
