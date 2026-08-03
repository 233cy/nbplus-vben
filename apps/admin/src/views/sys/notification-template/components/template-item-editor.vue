<script setup lang="ts">
import type { NotificationChannelApi } from '#/api/sys/notificationChannel';
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { computed, onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Table, Tag } from 'ant-design-vue';

import { getNotificationChannelDriverSchemasApi } from '#/api/sys/notificationChannel';
import { $t } from '#/locales';

import TemplateItemModal from './template-item-modal.vue';

interface Props {
  modelValue?: NotificationTemplateApi.TemplateItemSave[];
  isReadonly?: boolean;
  variables?: Record<string, string>;
  /** 延迟合并窗口（秒），>0 时渠道编辑器的可用变量追加三个固定合并变量 */
  mergeWindow?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  isReadonly: false,
  mergeWindow: 0,
});

const emit = defineEmits<{
  'update:modelValue': [value: NotificationTemplateApi.TemplateItemSave[]];
}>();

const items = ref<NotificationTemplateApi.TemplateItemSave[]>([]);
const schemas = ref<NotificationChannelApi.DriverSchema[]>([]);

const channelNameMap = computed(() => {
  const map: Record<string, string> = {};
  schemas.value.forEach((item) => {
    map[item.code] = item.label;
  });
  return map;
});

function syncFromProps() {
  items.value = (props.modelValue || []).map((item) => ({
    ...item,
    extra: item.extra || {},
  }));
}

async function loadSchemas() {
  if (schemas.value.length > 0) return;
  schemas.value = await getNotificationChannelDriverSchemasApi();
}

onMounted(loadSchemas);

function emitUpdate(nextItems: NotificationTemplateApi.TemplateItemSave[]) {
  items.value = nextItems;
  emit('update:modelValue', nextItems);
}

watch(() => props.modelValue, syncFromProps, { deep: true, immediate: true });

const [TemplateItemModalComponent, templateItemModalApi] = useVbenModal({
  connectedComponent: TemplateItemModal,
  destroyOnClose: true,
});

function openModal(data?: any) {
  templateItemModalApi.setData({
    data: (data as NotificationTemplateApi.TemplateItemSave) ?? null,
    existingItems: items.value,
    variables: availableVariables.value,
  });
  templateItemModalApi.open();
}

/** 可用变量 = 模板声明变量 + （开启合并时）三个固定合并变量 */
const availableVariables = computed<Record<string, string>>(() => {
  if ((props.mergeWindow ?? 0) <= 0) {
    return { ...props.variables };
  }
  return {
    ...props.variables,
    temp_msg_count: $t('sys.notification-template.mergeVars.tempMsgCount'),
    temp_msg_labels: $t('sys.notification-template.mergeVars.tempMsgLabels'),
    temp_msg_one_label: $t(
      'sys.notification-template.mergeVars.tempMsgOneLabel',
    ),
  };
});

function handleDelete(index: number) {
  const nextItems = [...items.value];
  nextItems.splice(index, 1);
  emitUpdate(nextItems);
}

function handleSubmit(item: NotificationTemplateApi.TemplateItemSave) {
  const nextItems = [...items.value];
  const index = nextItems.findIndex((i) => i.channelType === item.channelType);
  if (index === -1) {
    nextItems.push(item);
  } else {
    nextItems[index] = item;
  }
  emitUpdate(nextItems);
}

const columns = [
  {
    title: $t('sys.notification-template.items.channelType'),
    dataIndex: 'channelType',
    key: 'channelType',
  },
  {
    title: $t('common.status'),
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: $t('common.operation'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
  },
];
</script>

<template>
  <div class="w-full space-y-3">
    <div class="flex items-center justify-between">
      <div class="text-base font-medium">
        {{ $t('sys.notification-template.items.title') }}
      </div>
      <Button v-if="!props.isReadonly" type="primary" @click="openModal()">
        {{ $t('sys.notification-template.items.add') }}
      </Button>
    </div>

    <Table
      :columns="columns"
      :data-source="items"
      :pagination="false"
      bordered
      class="w-full"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'channelType'">
          {{ channelNameMap[record.channelType] || record.channelType }}
        </template>
        <template v-if="column.key === 'status'">
          <Tag v-if="record.status === 1" color="blue">
{{
            $t('common.enabled')
          }}
</Tag>
          <Tag v-else>{{ $t('common.disabled') }}</Tag>
        </template>
        <template v-if="column.key === 'action'">
          <div class="flex gap-2">
            <Button
              type="link"
              :disabled="props.isReadonly"
              @click="openModal(record)"
            >
              {{ $t('common.edit') }}
            </Button>
            <Button
              type="link"
              danger
              :disabled="props.isReadonly"
              @click="handleDelete(index)"
            >
              {{ $t('common.delete') }}
            </Button>
          </div>
        </template>
      </template>

      <template #emptyText>
        <div class="py-4 text-center text-muted-foreground">
          {{ $t('common.noDataAvailable') }}
        </div>
      </template>
    </Table>

    <TemplateItemModalComponent @submit="handleSubmit" />
  </div>
</template>
