<script lang="ts" setup>
import type { VxeGridListeners, VxeGridProps } from '#/adapter/vxe-table';

import { computed, nextTick, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button as AButton, Input, Tag, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

/* ============================================================
   Props
   ============================================================ */
interface RowType {
  [key: string]: any;
}

export type InitEchoFunc = (ids: string[], apiData: { items: any[]; total: number }, ctx: { labelField: string; valueField: string }) => any[];

const props = withDefaults(
  defineProps<{
    api: (params: any) => Promise<{ items: any[]; total: number }>;
    columns: any[] | VxeGridProps<RowType>['columns'];
    initEcho?: InitEchoFunc | null;
    labelField: string;
    modelValue?: string;
    multiple?: boolean;
    pageSize?: number;
    title?: string;
    valueField: string;
  }>(),
  {
    modelValue: '',
    multiple: true,
    title: $t('common.selectData'),
    pageSize: 10,
    initEcho: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'confirm', v: any[]): void;
}>();

/* ============================================================
   状态
   ============================================================ */
const keyword = ref('');
const loading = ref(false);

const selectedMap = ref(new Map());
const tempSelectedMap = ref(new Map());

const maxDisplayTags = 5;
const isExpanded = ref(false);

const visibleTags = computed(() => {
  const rows = [...selectedMap.value.values()];
  return isExpanded.value ? rows : rows.slice(0, maxDisplayTags);
});

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function clearAll() {
  selectedMap.value.clear();
  tempSelectedMap.value.clear();
  emit('update:modelValue', '');
}

/* ============================================================
   弹窗
   ============================================================ */
const [Modal, modalApi] = useVbenModal({
  onCancel: () => modalApi.close(),
  onConfirm: () => confirmSelect(),
});

/* ============================================================
   API（无缓存）
   ============================================================ */
async function fetchData(params: Record<string, any>) {
  return await props.api(params);
}

/* ============================================================
   vxe-grid
   ============================================================ */
const gridOptions: VxeGridProps<RowType> = {
  height: 420,
  border: true,
  showOverflow: true,

  checkboxConfig: { highlight: props.multiple, reserve: true, trigger: 'row' },
  radioConfig: { highlight: !props.multiple, reserve: true, trigger: 'row' },

  emptyText: $t('common.noDataAvailable'),
  pagerConfig: { pageSize: props.pageSize },
  sortConfig: { remote: true },
  rowConfig: { keyField: 'id' },

  proxyConfig: {
    sort: true,
    ajax: {
      query: async ({ page, sort }: any) =>
        fetchData({
          page: page.currentPage,
          pageSize: page.pageSize,
          keyword: keyword.value,
          sortBy: sort.field,
          sortOrder: sort.order,
        }),
      querySuccess: () => handleQuerySuccess(),
    },
  },

  columns: [{ type: props.multiple ? 'checkbox' : 'radio', width: 48 }, ...(props.columns || [])] as VxeGridProps<RowType>['columns'],
};

const gridEvents: VxeGridListeners<RowType> = {
  checkboxChange: ({ row, checked }: any) => {
    if (props.multiple) {
      checked ? tempSelectedMap.value.set(row[props.valueField], row) : tempSelectedMap.value.delete(row[props.valueField]);
    } else {
      tempSelectedMap.value.clear();
      tempSelectedMap.value.set(row[props.valueField], row);
    }
  },

  checkboxAll: ({ checked }: any) => {
    const table = gridApi.grid;
    if (!table) return;

    const { fullData } = table.getTableData();
    checked ? fullData.forEach((r: any) => tempSelectedMap.value.set(r[props.valueField], r)) : fullData.forEach((r) => tempSelectedMap.value.delete(r[props.valueField]));
  },

  // radioChange: ({ row }: any) => {
  //   console.log('radioChange', row);
  //   tempSelectedMap.value.clear();
  //   tempSelectedMap.value.set(row[props.valueField], row);
  // },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, gridEvents });

/* ============================================================
   搜索
   ============================================================ */
async function handleSearch() {
  await gridApi.query();
}

/* ============================================================
   回显标记
   ============================================================ */
async function handleQuerySuccess() {
  const table = gridApi.grid;
  if (!table) return;

  await table.clearCheckboxRow();

  const selectedIds = new Set(tempSelectedMap.value.keys());
  const rows = table.getTableData().fullData;

  rows.forEach((row: any) => {
    if (selectedIds.has(row[props.valueField])) {
      table.setCheckboxRow(row, true);
      table.setRadioRow(row);
    }
  });
}

/* ============================================================
   打开弹窗
   ============================================================ */
async function openModal() {
  tempSelectedMap.value = new Map(selectedMap.value);
  await nextTick();
  modalApi.open();
}

/* ============================================================
   确认选择
   ============================================================ */
function confirmSelect() {
  selectedMap.value = new Map(tempSelectedMap.value);

  const rows = [...selectedMap.value.values()];
  const ids = [];
  for (const idsKey in rows) {
    const tempsRows = rows[idsKey];
    ids.push(tempsRows[props.valueField]);
  }

  emit('update:modelValue', ids.join(','));
  emit('confirm', rows);

  modalApi.close();
}

/* ============================================================
   删除标签
   ============================================================ */
function removeItem(item: any) {
  tempSelectedMap.value.delete(item[props.valueField]);

  const table = gridApi.grid;
  if (!table) return;

  const { fullData } = table.getTableData();
  const r = fullData.find((row: any) => row[props.valueField] === item[props.valueField]);
  if (r) table.setCheckboxRow(r, false);
}

/* ============================================================
   初始化回显
   ============================================================ */
onMounted(async () => {
  const ids = props.modelValue ? props.modelValue.split(',') : [];
  if (ids.length === 0) return;

  loading.value = true;

  try {
    const apiData = await fetchData({
      ids: props.modelValue,
      page: null,
      pageSize: null,
    });

    const rows = props.initEcho
      ? props.initEcho(ids, apiData, {
          valueField: props.valueField,
          labelField: props.labelField,
        })
      : ids.map(
          (id) =>
            apiData.items.find((row) => row[props.valueField] === id) || {
              [props.valueField]: id,
              [props.labelField]: `${props.valueField}:${id}`,
            },
        );

    selectedMap.value.clear();
    rows.forEach((r) => selectedMap.value.set(r[props.valueField], r));
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="select-data my-4 space-y-3">
    <!-- 主按钮 -->
    <AButton type="primary" @click="openModal">
      <template #icon>
        <IconifyIcon icon="mdi:cursor-default" />
      </template>
      {{ $t('common.selectData') }}
    </AButton>

    <!-- 加载提示 -->
    <div v-if="loading" class="flex items-center text-sm text-gray-500 dark:text-gray-400">
      <IconifyIcon icon="mdi:loading" class="mr-1 animate-spin text-base" />
      {{ $t('common.loadingSelectedData') }}...
    </div>

    <div
      v-else
      class="hover:text-regular hover:border-border-strong rounded-md border border-border bg-card px-3 py-2 text-primary transition-all hover:bg-gray-100 dark:bg-gray-800 hover:dark:bg-gray-900"
    >
      <!-- 已选项展示 -->
      <div v-if="selectedMap.size > 0">
        <div class="flex items-center">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            <i18n-t keypath="page.itemsSelect">
              <template #count>
                <b>{{ selectedMap.size }}</b>
              </template>
            </i18n-t>
          </div>

          <AButton type="link" danger class="ml-2" @click="clearAll">
            <template #icon>
              <IconifyIcon icon="mdi:trash-can-outline" class="text-base" />
            </template>
            {{ $t('common.clearAll') }}
          </AButton>
        </div>

        <div class="mb-2 flex flex-wrap">
          <Tag v-if="selectedMap.size > maxDisplayTags" color="processing" class="cursor-pointer" @click="toggleExpand">
            {{ isExpanded ? $t('common.foldUp') : `${$t('common.showMore')}（${selectedMap.size - maxDisplayTags}）` }}
          </Tag>

          <Tag v-for="item in visibleTags" :key="item[valueField]" color="blue" class="cursor-pointer transition hover:opacity-60">
            <Tooltip :title="item[labelField]">
              {{ item[labelField] }}
            </Tooltip>
          </Tag>
        </div>
      </div>

      <div v-else class="text-sm text-primary dark:text-gray-400">
        {{ $t('common.noSelectData') }}
      </div>
    </div>

    <!-- 弹窗 -->
    <Modal class="w-[900px]">
      <template #title>{{ title }}</template>

      <!-- 搜索栏 -->
      <div class="mb-3 flex items-center gap-2">
        <Input v-model:value="keyword" style="width: 260px" allow-clear :placeholder="$t('common.search.keyword')" @press-enter="handleSearch">
          <template #prefix>
            <IconifyIcon icon="mdi:magnify" class="text-base" />
          </template>
        </Input>

        <AButton @click="handleSearch">
          <template #icon>
            <IconifyIcon icon="mdi:magnify" class="text-base" />
          </template>
          {{ $t('common.search') }}
        </AButton>
      </div>

      <Grid />

      <!-- 弹窗内部 Tags -->
      <div
        v-if="tempSelectedMap.size > 0"
        class="hover:text-regular hover:border-border-strong rounded-md border border-border bg-card px-3 py-1 text-primary transition-all hover:bg-gray-100 dark:bg-gray-800 hover:dark:bg-gray-900"
      >
        <div class="mb-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ $t('common.itemsSelect', { count: tempSelectedMap.size }) }}
        </div>
        <Tag
          v-for="item in Array.from(tempSelectedMap.values())"
          :key="item[valueField]"
          closable
          color="blue"
          class="mb-2 mr-2 transition hover:opacity-80"
          @close="removeItem(item)"
        >
          {{ item[labelField] }}
        </Tag>
      </div>
    </Modal>
  </div>
</template>

<style scoped></style>
