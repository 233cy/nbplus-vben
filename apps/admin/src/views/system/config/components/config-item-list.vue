<script setup lang="ts">
import type { ConfigApi } from '#/api/system/config';

import { ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Popconfirm, Spin, Tag, Tooltip } from 'ant-design-vue';
import vuedraggable from 'vuedraggable';

import { sortConfigApi } from '#/api/system/config';
import { $t } from '#/locales';

import ConfigValueInput from './config-value-input.vue';

interface Props {
  items: ConfigApi.ConfigItem[];
  editValues: Record<string, string>;
  /** 当前分组在所有分组中的位置索引（0 开始），用于计算层级 sort */
  groupIndex: number;
  loading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  copyKey: [key: string];
  delete: [item: ConfigApi.ConfigItem];
  edit: [item: ConfigApi.ConfigItem];
  markAsSys: [item: ConfigApi.ConfigItem];
  reload: [];
  togglePublic: [item: ConfigApi.ConfigItem];
  'update:editValue': [key: string, value: string];
}>();

/** 拖拽用的可变副本，跟随 props.items 同步 */
const sortableItems = ref<ConfigApi.ConfigItem[]>([]);
watch(
  () => props.items,
  val => {
    sortableItems.value = [...val];
  },
  { immediate: true },
);

const sorting = ref(false);

async function onDragEnd() {
  sorting.value = true;
  try {
    const payload = sortableItems.value.map((item, i) => ({
      id: item.id,
      sort: (props.groupIndex + 1) * 1000 + i + 1,
    }));
    await sortConfigApi(payload);
    emit('reload');
  } finally {
    sorting.value = false;
  }
}
</script>

<template>
  <div class="relative divide-y dark:divide-gray-700">
    <Spin :spinning="!!sorting" />

    <div v-if="items.length === 0 && !loading" class="py-16 text-center text-gray-400">
      {{ $t('system.config.empty') }}
    </div>

    <vuedraggable v-else v-model="sortableItems" item-key="id" handle=".drag-handle" @end="onDragEnd">
      <template #item="{ element: item }">
        <div :key="item.key" class="flex flex-col px-6 py-4">
          <!-- 第一行：拖拽 + 标签/KEY + 输入控件 + 操作 -->
          <div class="flex items-start gap-4">
            <!-- 拖拽手柄 -->
            <div class="drag-handle flex shrink-0 cursor-grab items-center self-stretch pt-1 text-gray-400">
              <IconifyIcon icon="ant-design:menu-outlined" />
            </div>

            <!-- 标签 + KEY -->
            <div class="w-150 shrink-0">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {{ item.label }}
                </span>
                <Tag v-if="item.isSys" color="gold" class="ml-1 text-xs">
                  {{ $t('system.config.isSysTag') }}
                </Tag>
              </div>
              <div class="mt-1 flex items-center gap-1">
                <code class="select-all truncate font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {{ item.key }}
                </code>
                <Tooltip :title="$t('system.config.copySuccess')">
                  <Button type="text" size="small" class="flex shrink-0 items-center p-0 text-gray-400 hover:text-blue-500" @click="emit('copyKey', item.key)">
                    <span class="i-ant-design:copy-outlined text-sm"></span>
                  </Button>
                </Tooltip>
              </div>
            </div>

            <!-- 输入控件 -->
            <div class="flex-1">
              <ConfigValueInput :model-value="editValues[item.key]" :item="item" @update:model-value="emit('update:editValue', item.key, $event)" />
            </div>

            <!-- 操作按钮 -->
            <div class="flex shrink-0 items-center gap-2">
              <Popconfirm v-if="!item.isSys" :title="$t('system.config.markAsSysConfirm')" @confirm="emit('markAsSys', item)">
                <Tooltip :title="$t('system.config.markAsSys')">
                  <Button>
                    <IconifyIcon icon="ant-design:lock-outlined" class="text-amber-500" />
                  </Button>
                </Tooltip>
              </Popconfirm>
              <Tooltip v-else :title="$t('system.config.isSysTag')">
                <Button disabled>
                  <IconifyIcon icon="ant-design:lock-outlined" />
                </Button>
              </Tooltip>

              <Tooltip :title="item.isPublic ? $t('system.config.togglePublicOff') : $t('system.config.togglePublicOn')">
                <Button :type="item.isPublic ? 'primary' : 'default'" @click="emit('togglePublic', item)">
                  <IconifyIcon :icon="item.isPublic ? 'ant-design:eye-outlined' : 'ant-design:eye-invisible-outlined'" />
                </Button>
              </Tooltip>

              <Tooltip :title="$t('system.config.editItem')">
                <Button @click="emit('edit', item)">
                  <IconifyIcon icon="ant-design:edit-outlined" />
                </Button>
              </Tooltip>

              <Popconfirm v-if="!item.isSys" :title="$t('system.config.confirmDelete')" @confirm="emit('delete', item)">
                <Button danger>
                  <IconifyIcon icon="ant-design:delete-outlined" />
                </Button>
              </Popconfirm>
              <Tooltip v-else :title="$t('system.config.isSysTag')">
                <Button danger disabled>
                  <IconifyIcon icon="ant-design:delete-outlined" />
                </Button>
              </Tooltip>
            </div>
          </div>

          <!-- 第二行：描述（独立一行，不挤在左侧窄列） -->
          <div v-if="item.remark" class="mt-1.5 pl-12 text-xs text-gray-400 dark:text-gray-500">
            {{ item.remark }}
          </div>
        </div>
      </template>
    </vuedraggable>
  </div>
</template>
