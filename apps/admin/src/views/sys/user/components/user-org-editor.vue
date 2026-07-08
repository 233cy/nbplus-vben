<script setup lang="ts">
import type { UserApi } from '#/api/sys/user';

import { ref, watch } from 'vue';

import { Button, Table, Tag } from 'ant-design-vue';

import { $t } from '#/locales';

import UserOrgModal from './user-org-modal.vue';

interface Props {
  modelValue?: UserApi.UserOrgValue;
  isReadonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  isReadonly: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: UserApi.UserOrgValue];
}>();

const items = ref<UserApi.UserOrgItem[]>([]);
const modalVisible = ref(false);
const isInternalUpdate = ref(false);

function normalizeItems(value?: UserApi.UserOrgValue): UserApi.UserOrgItem[] {
  const list = value?.deptDuties || [];
  return list.map((item, index) => ({
    ...item,
    sort: item.sort ?? (index + 1) * 10,
  }));
}

function findMainItem(): undefined | UserApi.UserOrgItem {
  return items.value.find(item => item.isMain === 1);
}

function buildValue(): UserApi.UserOrgValue {
  const main = findMainItem();
  return {
    deptId: main?.deptId,
    dutyId: main?.dutyId,
    deptDuties: [...items.value],
  };
}

function syncFromProps() {
  if (isInternalUpdate.value) {
    isInternalUpdate.value = false;
    return;
  }

  items.value = normalizeItems(props.modelValue);
}

function emitUpdate(nextItems: UserApi.UserOrgItem[]) {
  items.value = nextItems;
  isInternalUpdate.value = true;
  emit('update:modelValue', buildValue());
}

watch(() => props.modelValue, syncFromProps, { deep: true, immediate: true });

function ensureHasMain(nextItems: UserApi.UserOrgItem[]): UserApi.UserOrgItem[] {
  if (nextItems.length === 0) {
    return nextItems;
  }

  const hasMain = nextItems.some(item => item.isMain === 1);
  if (!hasMain) {
    const sorted = nextItems.map((item, index) => ({ item, index })).sort((a, b) => (a.item.sort ?? 0) - (b.item.sort ?? 0));
    const mainIndex = sorted[0]?.index ?? 0;

    return nextItems.map((item, index) => ({
      ...item,
      isMain: index === mainIndex ? (1 as const) : (2 as const),
    }));
  }

  return nextItems;
}

function handleSetMain(index: number) {
  const nextItems = items.value.map((item, i) => ({
    ...item,
    isMain: i === index ? (1 as const) : (2 as const),
  }));

  emitUpdate(nextItems);
}

function handleDelete(index: number) {
  const nextItems = [...items.value];
  nextItems.splice(index, 1);

  emitUpdate(ensureHasMain(nextItems));
}

function handleAddItem(item: UserApi.UserOrgItem) {
  const nextItems = ensureHasMain([
    ...items.value,
    {
      ...item,
      sort: (items.value.length + 1) * 10,
    },
  ]);
  emitUpdate(nextItems);
}

const columns = [
  {
    title: $t('sys.user.fields.deptName'),
    dataIndex: 'deptName',
    key: 'deptName',
  },
  {
    title: $t('sys.user.fields.dutyName'),
    dataIndex: 'dutyName',
    key: 'dutyName',
  },
  {
    title: $t('sys.user.fields.isMain'),
    dataIndex: 'isMain',
    key: 'isMain',
    width: 80,
  },
];
if (!props.isReadonly) {
  columns.push({
    title: $t('common.operation'),
    dataIndex: 'action',
    key: 'action',
    width: 80,
  });
}
</script>

<template>
  <div class="w-full space-y-3">
    <div class="flex items-center justify-between">
      <div class="text-base font-medium">{{ $t('sys.user.userOrg.listTitle') }}</div>
      <Button v-if="!props.isReadonly" type="primary" size="small" @click="modalVisible = true">
        {{ $t('sys.user.userOrg.add') }}
      </Button>
    </div>

    <Table :columns="columns" :data-source="items" :pagination="false" size="small" bordered class="w-full">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'isMain'">
          <div class="text-center">
            <Tag v-if="record.isMain === 1" color="blue">{{ $t('sys.user.userOrg.main') }}</Tag>
            <span v-else class="text-muted-foreground">{{ $t('sys.user.userOrg.secondary') }}</span>
          </div>
        </template>

        <template v-if="column.key === 'action'">
          <div class="text-center">
            <Button v-if="record.isMain !== 1" type="link" size="small" @click="handleSetMain(index)">
              {{ $t('sys.user.userOrg.setMain') }}
            </Button>
          </div>
          <div class="text-center">
            <Button type="link" danger size="small" @click="handleDelete(index)">
              {{ $t('common.delete') }}
            </Button>
          </div>
        </template>
      </template>

      <template #emptyText>
        <div class="py-4 text-center text-muted-foreground">
          {{ $t('sys.user.userOrg.empty') }}
        </div>
      </template>
    </Table>

    <UserOrgModal v-model:visible="modalVisible" :existing-items="items" @submit="handleAddItem" />
  </div>
</template>
