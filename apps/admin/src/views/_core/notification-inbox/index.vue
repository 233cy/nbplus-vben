<script setup lang="ts">
import type { NotificationInboxApi } from '#/api/sys/notificationInbox';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Checkbox,
  Empty,
  InputSearch,
  message,
  Popconfirm,
  Segmented,
  Spin,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  batchDeleteNotificationInboxApi,
  clearNotificationInboxApi,
  deleteNotificationInboxApi,
  getNotificationInboxListApi,
  getNotificationInboxUnreadCountApi,
  markAllNotificationInboxReadApi,
  markNotificationInboxReadApi,
} from '#/api/sys/notificationInbox';
import { $t } from '#/locales';
import { useTableBatchAction } from '#/utils/table';

import DetailContent from './shared/detail-content.vue';

type Item = NotificationInboxApi.MessageItem;
type ReadFilter = 'all' | 'read' | 'unread';

const PAGE_SIZE = 20;

const items = ref<Item[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const keyword = ref('');
const readFilter = ref<ReadFilter>('all');
const selectedId = ref('');
const checkedIds = ref<string[]>([]);
const unreadCount = ref(0);

const hasMore = computed(() => items.value.length < total.value);
const selectedItem = computed(() =>
  items.value.find((i) => i.id === selectedId.value),
);
const selectedIndex = computed(() =>
  items.value.findIndex((i) => i.id === selectedId.value),
);
const allChecked = computed(
  () =>
    items.value.length > 0 && checkedIds.value.length === items.value.length,
);
const indeterminate = computed(
  () => checkedIds.value.length > 0 && !allChecked.value,
);

const filterOptions = computed(() => [
  { label: $t('common.all'), value: 'all' },
  {
    label: `${$t('core.notification-inbox.unread')}(${unreadCount.value})`,
    value: 'unread',
  },
  { label: $t('core.notification-inbox.read'), value: 'read' },
]);

async function loadUnreadCount() {
  const res = await getNotificationInboxUnreadCountApi();
  unreadCount.value = res.count;
}

async function fetchList(reset = false) {
  if (loading.value) return;
  loading.value = true;
  try {
    if (reset) page.value = 1;
    const res = await getNotificationInboxListApi({
      page: page.value,
      pageSize: PAGE_SIZE,
      keyword: keyword.value || undefined,
      isRead:
        readFilter.value === 'all'
          ? undefined
          : (readFilter.value === 'read'
            ? 1
            : 0),
    });
    items.value = reset ? res.items : [...items.value, ...res.items];
    total.value = res.meta?.total ?? res.items.length;
    if (reset) {
      checkedIds.value = [];
      // 默认选中第一封，便于直接进入阅读
      selectedId.value = res.items[0]?.id ?? '';
    }
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  fetchList(true);
}

function onFilterChange(value: number | string) {
  readFilter.value = value as ReadFilter;
  fetchList(true);
}

function onRefresh() {
  loadUnreadCount();
  fetchList(true);
}

function loadMore() {
  page.value += 1;
  fetchList();
}

/** 选中一封：未读时顺手标记已读 */
async function onSelect(item: Item) {
  selectedId.value = item.id;
  if (item.isRead === 1) return;
  item.isRead = 1;
  unreadCount.value = Math.max(0, unreadCount.value - 1);
  await markNotificationInboxReadApi(item.id);
}

async function onMarkAllRead() {
  await markAllNotificationInboxReadApi();
  message.success($t('core.notification-inbox.markAllRead'));
  onRefresh();
}

async function onClear() {
  useTableBatchAction(
    () => clearNotificationInboxApi(),
    items.value.map(i => i.id),
    $t('core.notification-inbox.clear'),
    onRefresh,
    { content: $t('core.notification-inbox.clearConfirm') },
  );
}

async function onBatchDelete() {
  useTableBatchAction(batchDeleteNotificationInboxApi, checkedIds.value, $t('common.delete'), onRefresh);
}

async function onRemoveOne(item: Item) {
  await deleteNotificationInboxApi(item.id);
  message.success($t('common.deleteSuccess'));
  onRefresh();
}

function onCheckAll(checked: boolean) {
  checkedIds.value = checked ? items.value.map((i) => i.id) : [];
}

function onCheckOne(id: string, checked: boolean) {
  checkedIds.value = checked
    ? [...checkedIds.value, id]
    : checkedIds.value.filter((i) => i !== id);
}

function selectByOffset(offset: number) {
  const next = items.value[selectedIndex.value + offset];
  if (next) onSelect(next);
}

/** 列表时间：今天显示时分，今年显示月-日，更早显示完整日期 */
function formatTime(ts: number) {
  const d = dayjs.unix(ts);
  const now = dayjs();
  if (d.isSame(now, 'day')) return d.format('HH:mm');
  if (d.isSame(now, 'year')) return d.format('MM-DD');
  return d.format('YYYY-MM-DD');
}

onMounted(() => {
  loadUnreadCount();
  fetchList(true);
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex size-full gap-4">
      <!-- 左栏：消息列表 -->
      <Card
        class="h-full w-1/3 flex-none"
        :body-style="{ padding: '0', height: '100%' }"
      >
        <div class="flex h-full flex-col">
          <!-- 工具条 -->
          <div class="flex flex-col gap-2 border-b border-border p-3">
            <InputSearch
              v-model:value="keyword"
              :placeholder="$t('core.notification-inbox.searchPlaceholder')"
              allow-clear
              @search="onSearch"
            />
            <div class="flex items-center justify-between gap-2">
              <Segmented
                :value="readFilter"
                :options="filterOptions"
                @change="onFilterChange"
              />
              <div class="flex items-center">
                <Tooltip :title="$t('common.refresh')">
                  <Button type="text" @click="onRefresh">
                    <IconifyIcon icon="lucide:rotate-cw" />
                  </Button>
                </Tooltip>
                <Tooltip :title="$t('core.notification-inbox.markAllRead')">
                  <Button type="text" @click="onMarkAllRead">
                    <IconifyIcon icon="lucide:mail-check" class="size-4" />
                  </Button>
                </Tooltip>
                <Tooltip :title="$t('core.notification-inbox.clear')">
                  <Button type="text" danger @click="onClear">
                    <IconifyIcon icon="lucide:trash-2" class="size-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>
            <!-- 批量操作条 -->
            <div
              class="flex items-center justify-between text-xs text-gray-400"
            >
              <Checkbox
                :checked="allChecked"
                :indeterminate="indeterminate"
                @change="(e: any) => onCheckAll(e.target.checked)"
              >
                {{ $t('common.all') }}
              </Checkbox>
              <Button
                v-if="checkedIds.length > 0"
                type="link"
                danger
                class="p-0"
                @click="onBatchDelete"
              >
                {{ $t('common.batchDelete') }}({{ checkedIds.length }})
              </Button>
            </div>
          </div>

          <!-- 列表 -->
          <div class="flex-1 overflow-y-auto">
            <Spin :spinning="loading && items.length === 0">
              <Empty
                v-if="items.length === 0 && !loading"
                class="mt-16"
                :description="$t('common.noDataAvailable')"
              />
              <div
                v-for="item in items"
                :key="item.id"
                class="group flex cursor-pointer items-start gap-2 border-b border-border px-3 py-3 hover:bg-accent"
                :class="{
                  'bg-primary/10! hover:bg-primary/10!': item.id === selectedId,
                }"
                @click="onSelect(item)"
              >
                <Checkbox
                  :checked="checkedIds.includes(item.id)"
                  class="mt-1"
                  @click.stop
                  @change="(e: any) => onCheckOne(item.id, e.target.checked)"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <span
                      class="truncate text-sm"
                      :class="
                        item.isRead === 1 ? 'text-gray-500' : 'font-semibold'
                      "
                    >
                      {{ item.title }}
                    </span>
                    <span class="shrink-0 text-xs text-gray-400">{{
                      formatTime(item.createdAt)
                    }}</span>
                  </div>
                  <div class="mt-0.5 flex items-center justify-between gap-2">
                    <span class="truncate text-xs text-gray-400">{{
                      item.summary
                    }}</span>
                    <span class="flex shrink-0 items-center gap-1">
                      <span
                        v-if="item.isRead !== 1"
                        class="size-2 rounded-full bg-primary"
                      ></span>
                      <Popconfirm
                        :title="$t('common.confirmDelete')"
                        :ok-text="$t('common.confirm')"
                        :cancel-text="$t('common.cancel')"
                        @confirm="onRemoveOne(item)"
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          class="invisible size-5 p-0 group-hover:visible"
                          @click.stop
                        >
                          <IconifyIcon icon="lucide:x" class="size-3.5" />
                        </Button>
                      </Popconfirm>
                    </span>
                  </div>
                </div>
              </div>
              <div v-if="items.length > 0" class="py-2 text-center">
                <Button
                  v-if="hasMore"
                  type="link"
                  :loading="loading"
                  @click="loadMore"
                >
                  {{ $t('common.loadMore') }}
                </Button>
              </div>
            </Spin>
          </div>
        </div>
      </Card>

      <!-- 右栏：阅读面板 -->
      <Card
        class="h-full min-w-0 flex-auto"
        :body-style="{ padding: '0', height: '100%' }"
      >
        <div class="flex h-full flex-col">
          <template v-if="selectedItem">
            <div
              class="flex items-center justify-between border-b border-border px-4 py-2"
            >
              <span class="text-sm text-gray-400">
                {{ selectedIndex + 1 }} / {{ total }}
                <template v-if="unreadCount > 0">
                  （{{ $t('core.notification-inbox.unread') }}
                  {{ unreadCount }}）
                </template>
              </span>
              <div class="flex gap-1">
                <Button
                  :disabled="selectedIndex <= 0"
                  @click="selectByOffset(-1)"
                >
                  <template #icon>
                    <IconifyIcon icon="lucide:chevron-up" class="relative -top-px" />
                  </template>
                  {{ $t('core.notification-inbox.prev') }}
                </Button>
                <Button
                  :disabled="selectedIndex >= items.length - 1"
                  @click="selectByOffset(1)"
                >
                  <template #icon>
                    <IconifyIcon icon="lucide:chevron-down" class="relative -top-px" />
                  </template>
                  {{ $t('core.notification-inbox.next') }}
                </Button>
              </div>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto p-4">
              <DetailContent :data="selectedItem" />
            </div>
          </template>
          <div
            v-else
            class="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400"
          >
            <IconifyIcon icon="lucide:mail-open" class="size-12" />
            <span>{{ $t('core.notification-inbox.selectToRead') }}</span>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>
