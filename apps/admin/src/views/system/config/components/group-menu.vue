<script setup lang="ts">
import type { ConfigApi } from '#/api/system/config';

import { computed } from 'vue';

import { Menu, MenuItem } from 'ant-design-vue';

import { $t } from '#/locales';

interface Props {
  groups: ConfigApi.GroupItem[];
  activeGroup: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:activeGroup', value: string): void;
}>();

const selectedKeys = computed(() => (props.activeGroup ? [props.activeGroup] : []));

function groupsLabel(item: ConfigApi.GroupItem): string {
  return item.groupsLabel || item.groups;
}
</script>

<template>
  <div class="w-48 shrink-0 rounded-lg bg-white shadow-sm dark:bg-gray-800">
    <div class="border-b px-4 py-3 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {{ $t('system.config.groupTitle') }}
    </div>
    <Menu :selected-keys="selectedKeys" mode="inline" class="border-none" @click="({ key }) => emit('update:activeGroup', key as string)">
      <MenuItem v-for="g in groups" :key="g.groups">
        {{ groupsLabel(g) }}
      </MenuItem>
    </Menu>
  </div>
</template>
