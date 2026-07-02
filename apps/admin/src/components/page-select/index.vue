<script lang="ts" setup>
import type { OptionsType } from './configs';
import type { PageSelectConfig } from './types';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Input, Switch, Tag, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { getPageSelectConfig } from './configs';

interface RowType {
  [key: string]: any;
}

const props = withDefaults(
  defineProps<{
    /** 选择器配置：预设 key 或完整配置对象 */
    config: OptionsType | PageSelectConfig;
    /** 页面回显区域最多展示的 Tag 数量，默认 20 */
    maxEchoCount?: number;
    modelValue?: string;
    /** 是否展示页面回显区域（slot 区域），默认 true */
    showEchoSlot?: boolean;
  }>(),
  {
    maxEchoCount: 20,
    modelValue: '',
    showEchoSlot: true,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'confirm', v: any[]): void;
}>();

/* ============================================================
   配置解析
   ============================================================ */
const resolvedConfig = computed(() => {
  return typeof props.config === 'string' ? getPageSelectConfig(props.config as OptionsType) : props.config;
});

const api = computed(() => resolvedConfig.value.api);
const columns = computed(() => resolvedConfig.value.columns);
const labelField = computed(() => String(resolvedConfig.value.labelField));
const valueField = computed(() => String(resolvedConfig.value.valueField));
const multiple = computed(() => resolvedConfig.value.multiple ?? true);
const pageSize = computed(() => resolvedConfig.value.pageSize ?? 10);
const title = computed(() => resolvedConfig.value.title ?? $t('common.selectData'));
const tree = computed(() => resolvedConfig.value.type === 'tree');
const checkStrictly = computed(() => resolvedConfig.value.checkStrictly ?? false);

/* ============================================================
   状态
   ============================================================ */
const keyword = ref('');
const loading = ref(false);
const echoLoading = ref(false);
const showSelectedOnly = ref(false);
const echoPage = ref(1);

const selectedMap = ref(new Map());
const tempSelectedMap = ref(new Map());
// 记录当前弹窗会话中用户明确取消的 ID，防止 query 后把这些项又补选上
const uncheckedInSession = ref(new Set<string>());
// 默认 IDS 经过用户增减后的完整集合，用于"只看已选"查询和最终提交
const processedSelectedIds = ref(new Set<string>());

function initProcessedSelectedIds() {
  processedSelectedIds.value = new Set(allSelectedIds.value.map(String));
}

const allSelectedIds = computed(() => {
  return props.modelValue ? props.modelValue.split(',').filter(Boolean) : [];
});

const exceededEchoCount = computed(() => Math.max(0, allSelectedIds.value.length - props.maxEchoCount));

const visibleTags = computed(() => {
  return [...selectedMap.value.values()].slice(0, props.maxEchoCount);
});

// 已选数据回显的总页数，用于限制加载更多不会超出分页 meta 的最大页码
const echoTotalPages = computed(() => (props.maxEchoCount > 0 ? Math.max(1, Math.ceil(allSelectedIds.value.length / props.maxEchoCount)) : 1));

const hasMoreEcho = computed(() => echoPage.value < echoTotalPages.value);

function clearAll() {
  selectedMap.value.clear();
  tempSelectedMap.value.clear();
  echoPage.value = 1;
  emit('update:modelValue', '');
}

/* ============================================================
   弹窗
   ============================================================ */
const [Modal, modalApi] = useVbenModal({
  onCancel: () => modalApi.close(),
  onConfirm: async () => await confirmSelect(),
});

/* ============================================================
   API
   ============================================================ */
async function fetchData(params: Record<string, any>): Promise<{ items: any[]; total: number } | any[]> {
  const res = await api.value(params);
  if (Array.isArray(res)) {
    return { items: res, total: res.length };
  }
  // 树形模式下 vxe-grid 禁用分页后，proxy 会走 list/数组 分支，直接返回 items 数组
  if (tree.value && res && Array.isArray(res.items)) {
    return res.items;
  }
  return res;
}

async function loadEchoPage(page: number, targetMap: Map<any, any>) {
  const ids = allSelectedIds.value;
  if (ids.length === 0 || props.maxEchoCount === 0) return;

  // 根据已选总数计算最大页码，防止超出分页 meta 范围
  page = Math.max(1, Math.min(page, echoTotalPages.value));

  const apiData = await fetchData({
    ids: ids.join(','),
    page,
    pageSize: props.maxEchoCount,
  });

  const rows = Array.isArray(apiData) ? apiData : apiData.items;
  rows.forEach((row: any) => {
    targetMap.set(row[valueField.value], row);
    selectedMap.value.set(row[valueField.value], row);
  });

  echoPage.value = page;
}

function cleanupSelectedMap() {
  const ids = new Set(allSelectedIds.value.map(String));
  for (const key of selectedMap.value.keys()) {
    if (!ids.has(String(key))) {
      selectedMap.value.delete(key);
    }
  }
}

/* ============================================================
   表格列
   ============================================================ */
const displayColumns = computed(() => {
  const dataColumns = [...(columns.value || [])];
  if (tree.value && dataColumns.length > 0) {
    dataColumns[0] = { ...dataColumns[0], treeNode: true };
  }
  return [{ type: multiple.value ? 'checkbox' : 'radio', width: 48 }, ...dataColumns] as VxeGridProps<RowType>['columns'];
});

/* ============================================================
   vxe-grid：使用 adapter 的 queryApi 模式
   ============================================================ */
const gridOptions: VxeGridProps<RowType> = {
  height: 420,
  border: true,
  showOverflow: true,

  checkboxConfig: {
    highlight: multiple.value,
    reserve: true,
    trigger: 'row',
    checkStrictly: checkStrictly.value,
  },
  radioConfig: { highlight: !multiple.value, reserve: true, trigger: 'row' },

  emptyText: $t('common.noDataAvailable'),
  pagerConfig: tree.value ? { enabled: false } : { pageSize: pageSize.value },
  rowConfig: { keyField: 'id' },

  treeConfig: tree.value
    ? {
        transform: true,
        rowField: 'id',
        parentField: 'parentId',
        showLine: true,
      }
    : undefined,

  proxyConfig: {
    autoLoad: false,
    ajax: {
      queryApi: async (params: any) => {
        const result = await fetchData({
          ...params,
          page: tree.value ? null : params.page,
          pageSize: tree.value ? null : params.pageSize,
          keyword: showSelectedOnly.value ? '' : keyword.value,
          ids: showSelectedOnly.value ? Array.from(processedSelectedIds.value).join(',') : undefined,
          selectedOnly: showSelectedOnly.value ? 1 : undefined,
        });
        return result;
      },
    } as any,
  },

  columns: displayColumns.value as any,
};

const gridEvents = {
  checkboxChange: ({ row, checked }: any) => {
    const id = String(row[valueField.value]);
    if (checked) {
      tempSelectedMap.value.set(row[valueField.value], row);
      processedSelectedIds.value.add(id);
      uncheckedInSession.value.delete(id);
    } else {
      tempSelectedMap.value.delete(row[valueField.value]);
      processedSelectedIds.value.delete(id);
      uncheckedInSession.value.add(id);
    }
  },

  radioChange: ({ row }: any) => {
    const id = String(row[valueField.value]);
    tempSelectedMap.value.clear();
    tempSelectedMap.value.set(row[valueField.value], row);
    processedSelectedIds.value.clear();
    processedSelectedIds.value.add(id);
    uncheckedInSession.value.clear();
  },

  checkboxAll: ({ checked }: any) => {
    if (!multiple.value) return;

    const table = gridApi.grid;
    if (!table) return;

    const rows = tree.value ? flattenTree(table.getTableData().fullData) : table.getTableData().fullData;
    rows.forEach((r: any) => {
      const id = String(r[valueField.value]);
      if (checked) {
        tempSelectedMap.value.set(r[valueField.value], r);
        processedSelectedIds.value.add(id);
        uncheckedInSession.value.delete(id);
      } else {
        tempSelectedMap.value.delete(r[valueField.value]);
        processedSelectedIds.value.delete(id);
        uncheckedInSession.value.add(id);
      }
    });
  },

  // proxy 查询完成后，自动勾选已选项（与手动调用形成双保险）
  'proxy-query': () => handleQuerySuccess(),
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, gridEvents } as any);

function flattenTree(rows: any[]): any[] {
  const result: any[] = [];
  const walk = (list: any[]) => {
    for (const row of list) {
      result.push(row);
      if (row.children?.length) {
        walk(row.children);
      }
    }
  };
  walk(rows);
  return result;
}

/* ============================================================
   搜索
   ============================================================ */
async function handleSearch() {
  await gridApi.query();
  await handleQuerySuccess();
}

/* ============================================================
   回显标记：每次表格数据加载后，把已选项勾选上
   ============================================================ */
async function handleQuerySuccess() {
  const table = gridApi.grid;
  if (!table) return;

  // 等表格数据渲染完成后再读取，避免 proxy-query 事件触发时 fullData 还是旧数据
  await nextTick();
  await table.clearCheckboxRow();

  const rows = tree.value ? flattenTree(table.getTableData().fullData) : table.getTableData().fullData;

  // 勾选依据与 showSelectedOnly 查询依据保持一致：
  // - 全部数据模式：以默认 modelValue 的 IDS 为准
  // - 只看已选模式：以用户操作后的 processedSelectedIds 为准
  const baseIds = showSelectedOnly.value ? Array.from(processedSelectedIds.value) : allSelectedIds.value;
  const selectedIds = new Set(baseIds.map(String).filter(id => !uncheckedInSession.value.has(id)));

  rows.forEach((row: any) => {
    if (selectedIds.has(String(row[valueField.value]))) {
      if (multiple.value) {
        table.setCheckboxRow(row, true);
      } else {
        table.setRadioRow(row);
      }
    }
  });
}

/* ============================================================
   打开弹窗
   ============================================================ */
async function openModal() {
  // 每次打开弹窗清空会话内取消记录，并初始化处理后的已选集合
  uncheckedInSession.value.clear();
  initProcessedSelectedIds();
  // 清理已不在 modelValue 中的旧缓存，避免外部减少已选项后仍显示过期 tag
  cleanupSelectedMap();
  tempSelectedMap.value = new Map(selectedMap.value);
  showSelectedOnly.value = false;
  // echoPage 不再重置，保留上次底部已选内容的加载进度，下次打开可直接继续加载
  modalApi.open();
  await nextTick();

  // 重置表格分页到第一页，防止 gridApi.query() 沿用上次关闭时的页码
  const table = gridApi.grid as any;
  if (table) {
    const pager = table.getPager ? table.getPager() : null;
    if (pager) {
      pager.currentPage = 1;
    }
  }

  await gridApi.query();
  await nextTick();
  await handleQuerySuccess();
}

/* ============================================================
   只看已选切换时自动刷新表格
   ============================================================ */
watch(showSelectedOnly, async () => {
  await gridApi.query();
  await handleQuerySuccess();
});

/* ============================================================
   确认选择
   ============================================================ */
async function confirmSelect() {
  // 最终 IDS 以 processedSelectedIds 为准（默认 IDS 经过用户增减后的完整集合）
  const finalIdSet = new Set(processedSelectedIds.value);

  const rows = [...tempSelectedMap.value.values()].filter((row: any) => finalIdSet.has(String(row[valueField.value])));
  const ids = [...finalIdSet];

  emit('update:modelValue', ids.join(','));
  emit('confirm', rows);

  // 确认后取变动后的最新 modelValue 前 maxEchoCount 个 ID 重新反显给 slot
  await nextTick();
  selectedMap.value.clear();
  echoPage.value = 1;
  if (ids.length > 0) {
    await loadEchoPage(1, selectedMap.value);
  }

  uncheckedInSession.value.clear();
  processedSelectedIds.value.clear();
  modalApi.close();
}

/* ============================================================
   删除标签
   ============================================================ */
function removeItem(item: any) {
  const id = String(item[valueField.value]);
  uncheckedInSession.value.add(id);
  processedSelectedIds.value.delete(id);
  tempSelectedMap.value.delete(item[valueField.value]);

  const table = gridApi.grid;
  if (!table) return;

  const rows = tree.value ? flattenTree(table.getTableData().fullData) : table.getTableData().fullData;
  const r = rows.find((row: any) => row[valueField.value] === item[valueField.value]);
  if (!r) return;

  if (multiple.value) {
    table.setCheckboxRow(r, false);
  } else {
    table.clearRadioRow();
  }
}

/* ============================================================
   加载更多已选
   ============================================================ */
async function loadMoreEcho() {
  const nextPage = echoPage.value + 1;
  if (nextPage > echoTotalPages.value) return;

  echoLoading.value = true;
  try {
    await loadEchoPage(nextPage, tempSelectedMap.value);
  } finally {
    echoLoading.value = false;
  }
}

/* ============================================================
   初始化回显
   ============================================================ */
onMounted(async () => {
  const ids = allSelectedIds.value;
  if (ids.length === 0 || props.maxEchoCount === 0) return;

  loading.value = true;
  try {
    await loadEchoPage(1, selectedMap.value);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="select-data my-4 space-y-3">
    <!-- 主按钮 -->
    <Button type="primary" @click="openModal">
      <template #icon>
        <IconifyIcon icon="mdi:cursor-default" />
      </template>
      <template v-if="allSelectedIds.length > 0"> {{ $t('common.selectData') }}（{{ $t('common.itemsSelect', { count: allSelectedIds.length }) }}） </template>
      <template v-else>
        {{ $t('common.selectData') }}
      </template>
    </Button>

    <!-- 加载提示 -->
    <div v-if="loading" class="flex items-center text-sm text-gray-500 dark:text-gray-400">
      <IconifyIcon icon="mdi:loading" class="mr-1 animate-spin text-base" />
      {{ $t('common.loadingSelectedData') }}...
    </div>

    <div
      v-else-if="showEchoSlot"
      class="hover:text-regular hover:border-border-strong rounded-md border border-border bg-card px-3 py-2 text-primary transition-all hover:bg-gray-100 dark:bg-gray-800 hover:dark:bg-gray-900"
    >
      <!-- 已选项展示 -->
      <div v-if="selectedMap.size > 0">
        <div class="flex flex-wrap items-start gap-2">
          <Button type="link" danger class="flex-shrink-0" @click="clearAll">
            <template #icon>
              <IconifyIcon icon="mdi:trash-can-outline" class="text-base" />
            </template>
            {{ $t('common.clearAll') }}
          </Button>

          <Tag v-for="item in visibleTags" :key="item[valueField]" color="blue" class="cursor-pointer transition hover:opacity-60">
            <Tooltip :title="item[labelField]">
              {{ item[labelField] }}
            </Tooltip>
          </Tag>

          <Tag v-if="exceededEchoCount > 0" color="warning" class="cursor-pointer" @click="openModal">
            {{ $t('common.andMore', { count: exceededEchoCount }) }}
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
        <Input v-model:value="keyword" style="width: 260px" allow-clear :disabled="showSelectedOnly" :placeholder="$t('common.search.keyword')" @press-enter="handleSearch">
          <template #prefix>
            <IconifyIcon icon="mdi:magnify" class="text-base" />
          </template>
        </Input>

        <Button :disabled="showSelectedOnly" @click="handleSearch">
          <template #icon>
            <IconifyIcon icon="mdi:magnify" class="text-base" />
          </template>
          {{ $t('common.search.button') }}
        </Button>

        <Switch v-if="allSelectedIds.length > 0" v-model:checked="showSelectedOnly" :checked-children="$t('common.selectedOnly')" :un-checked-children="$t('common.allData')" />
      </div>

      <Grid />

      <!-- 弹窗内部 Tags -->
      <div
        v-if="tempSelectedMap.size > 0"
        class="hover:text-regular hover:border-border-strong rounded-md border border-border bg-card px-3 py-1 text-primary transition-all hover:bg-gray-100 dark:bg-gray-800 hover:dark:bg-gray-900"
      >
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

        <Button v-if="hasMoreEcho" size="small" :loading="echoLoading" :disabled="echoLoading" @click="loadMoreEcho"
          >{{ $t('common.loadMore') }} ({{ allSelectedIds.length - tempSelectedMap.size }})</Button
        >
      </div>
    </Modal>
  </div>
</template>

<style scoped></style>
