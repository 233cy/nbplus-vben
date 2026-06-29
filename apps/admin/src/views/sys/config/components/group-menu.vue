<script setup lang="ts">
import type { ConfigApi } from '#/api/sys/config';

import { ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { Spin } from 'ant-design-vue';
import vuedraggable from 'vuedraggable';

import { getConfigListApi, sortConfigApi } from '#/api/sys/config';
import { $t } from '#/locales';

interface Props {
  groups: ConfigApi.GroupItem[];
  activeGroup: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:activeGroup': [value: string];
  reload: [];
}>();

/** 拖拽用的可变副本，跟随 props.groups 同步 */
const sortableGroups = ref<ConfigApi.GroupItem[]>([]);
watch(() => props.groups, (val) => { sortableGroups.value = [...val]; }, { immediate: true });

const sorting = ref(false);

function groupsLabel(item: ConfigApi.GroupItem): string {
  return item.groupsLabel || item.groups;
}

/** 分组拖拽结束后，按新顺序重建所有配置项的层级 sort */
async function onGroupDragEnd() {
  sorting.value = true;
  try {
    const payload: Array<{ id: string; sort: number }> = [];
    for (let gi = 0; gi < sortableGroups.value.length; gi++) {
      const group = sortableGroups.value[gi]!;
      const items = await getConfigListApi(group.groups);
      // 组内按当前 sort 排序，保持原有顺序
      const sorted = [...items].sort((a, b) => a.sort - b.sort);
      for (let ii = 0; ii < sorted.length; ii++) {
        // 分组序号 * 1000 + 组内序号 + 1 → 1001, 1002, 2001, 2002...
        payload.push({ id: sorted[ii]!.id, sort: (gi + 1) * 1000 + ii + 1 });
      }
    }
    if (payload.length > 0) {
      await sortConfigApi(payload);
    }
    emit('reload');
  } finally {
    sorting.value = false;
  }
}
</script>

<template>
  <div class="flex w-48 shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
    <Spin :spinning="sorting" />
    <div class="shrink-0 border-b px-4 py-3 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {{ $t('system.config.groupTitle') }}
    </div>

    <vuedraggable
      v-model="sortableGroups"
      item-key="groups"
      handle=".drag-handle"
      class="flex-1 overflow-y-auto py-1"
      :scroll="true"
      :scroll-sensitivity="60"
      @end="onGroupDragEnd"
    >
      <template #item="{ element: group }">
        <div
          :key="group.groups"
          class="flex cursor-pointer items-center gap-1.5 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          :class="{ 'bg-blue-50 font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400': activeGroup === group.groups }"
          @click="emit('update:activeGroup', group.groups)"
        >
          <IconifyIcon icon="ant-design:menu-outlined" class="drag-handle shrink-0 cursor-grab text-gray-400" />
          <span class="flex-1 truncate">{{ groupsLabel(group) }}</span>
        </div>
      </template>
    </vuedraggable>
  </div>
</template>
