<script setup lang="ts">
import type { SelectProps, TreeSelectProps } from 'ant-design-vue';

import type { OptionsType } from '#/components/page-select/configs';
import type { PageSelectConfig } from '#/components/page-select/types';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { get } from '@vben/utils';

import { Button, Input, Select, TreeSelect } from 'ant-design-vue';

import { getPageSelectConfig } from '#/components/page-select/configs';

interface Props {
  /** 数据接口 */
  api?: (params: any) => Promise<any | any[] | { items: any[]; total?: number }>;
  /** page-select 预设类型或完整配置 */
  config?: OptionsType | PageSelectConfig;
  /** 透传给 api 的固定参数 */
  params?: Record<string, any>;
  /** 显示标签字段 */
  labelField?: string;
  /** 值字段 */
  valueField?: string;
  /** 当 api 返回对象时，指定 options 数组所在字段 */
  resultField?: string;
  /** 每页条数，默认 10 */
  pageSize?: number;
  /** 搜索参数字段名，默认 keyword */
  keywordField?: string;
  /** 是否立即加载，默认 true */
  immediate?: boolean;
  /** 自动选择：first=首个，one=只有一个时自动选择 */
  autoSelect?: 'first' | 'one' | false;
  /** 是否为树形选择 */
  tree?: boolean;
  /** 树形平级数据转树时的父节点字段，默认 parentId */
  parentField?: string;
  /** 树形模式下父子节点是否独立勾选 */
  checkStrictly?: boolean;
  /** 树形模式下是否默认展开全部节点 */
  treeDefaultExpandAll?: boolean;
  /** 本地兜底选项 */
  options?: any[];
  /** 是否显示下拉搜索按钮；为 true 时关闭输入实时搜索，改为在弹层内点击搜索按钮触发 */
  showSearchButton?: boolean;
  /** 透传给 Ant Design Vue Select / TreeSelect 的原生属性 */
  componentProps?: SelectProps | TreeSelectProps;
}

const props = withDefaults(defineProps<Props>(), {
  keywordField: 'keyword',
  immediate: true,
  pageSize: 10,
  parentField: 'parentId',
  autoSelect: false,
  tree: false,
  checkStrictly: false,
  treeDefaultExpandAll: false,
  showSearchButton: false,
  api: undefined,
  config: undefined,
  params: undefined,
  labelField: undefined,
  valueField: undefined,
  resultField: undefined,
  options: undefined,
  componentProps: undefined,
});

const emit = defineEmits<{
  optionsChange: [any[]];
}>();

const modelValue = defineModel<any>('value', { default: undefined });

// ---------------- 配置解析 ----------------
const resolvedConfig = computed<null | PageSelectConfig>(() => {
  if (!props.config) return null;
  return typeof props.config === 'string' ? getPageSelectConfig(props.config) : props.config;
});

const resolvedApi = computed(() => props.api || resolvedConfig.value?.api);
const resolvedLabelField = computed(() => props.labelField ?? resolvedConfig.value?.labelField ?? 'label');
const resolvedValueField = computed(() => props.valueField ?? resolvedConfig.value?.valueField ?? 'value');
const resolvedPageSize = computed(() => props.pageSize ?? resolvedConfig.value?.pageSize ?? 10);
const resolvedTree = computed(() => props.tree || resolvedConfig.value?.type === 'tree');

// ---------------- 状态 ----------------
const options = ref<any[]>(props.options ?? []);
const loading = ref(false);
const finished = ref(false);
const keyword = ref('');
const page = ref(1);
const isFirstLoaded = ref(false);
const pendingRefresh = ref(false);
const lastParamsKey = ref<string>();

// ---------------- 数据归一化 ----------------
function normalizeNode(row: any): any {
  const value = get(row, resolvedValueField.value);
  return {
    ...row,
    label: get(row, resolvedLabelField.value),
    value,
    key: value,
  };
}

function listToTree(rows: any[], idField: string, parentField: string): any[] {
  const map = new Map<number | string, any>();
  const roots: any[] = [];

  for (const row of rows) {
    const id = get(row, idField);
    map.set(id, { ...row, children: [] });
  }

  for (const row of rows) {
    const id = get(row, idField);
    const parentId = get(row, parentField);
    const node = map.get(id);
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function normalizeTreeOptions(rows: any[]): any[] {
  if (rows.length > 0 && Array.isArray(rows[0]?.children)) {
    return rows.map(row => {
      const node = normalizeNode(row);
      if (row.children?.length) {
        node.children = normalizeTreeOptions(row.children);
      }
      return node;
    });
  }

  const tree = listToTree(rows, resolvedValueField.value, props.parentField);
  return tree.map(row => {
    const node = normalizeNode(row);
    if (row.children?.length) {
      node.children = normalizeTreeOptions(row.children);
    }
    return node;
  });
}

function normalizeOptions(rows: any[]): any[] {
  const list = rows.map(row => normalizeNode(row));
  return resolvedTree.value ? normalizeTreeOptions(rows) : list;
}

// ---------------- 请求 ----------------
function extractRows(res: any): { done: boolean; rows: any[] } {
  if (Array.isArray(res)) {
    return { rows: res, done: true };
  }
  if (props.resultField) {
    return { rows: get(res, props.resultField) || [], done: true };
  }
  if (res && Array.isArray(res.items)) {
    const total = res.total ?? res.meta?.total ?? 0;
    return { rows: res.items, done: page.value * resolvedPageSize.value >= total };
  }
  return { rows: [], done: true };
}

async function fetchData(append = false) {
  const api = resolvedApi.value;
  if (!api) return;

  if (loading.value) {
    pendingRefresh.value = true;
    return;
  }

  if (!append) {
    page.value = 1;
    finished.value = false;
  } else if (finished.value || resolvedTree.value) {
    return;
  }

  loading.value = true;
  pendingRefresh.value = false;

  try {
    const requestParams: Record<string, any> = {
      ...props.params,
      [props.keywordField]: keyword.value || undefined,
    };

    if (!resolvedTree.value) {
      requestParams.page = page.value;
      requestParams.pageSize = resolvedPageSize.value;
    }

    const res = await api(requestParams);
    const { rows, done } = extractRows(res);
    const list = normalizeOptions(rows);

    options.value = append ? [...options.value, ...list] : list;
    finished.value = resolvedTree.value || list.length === 0 || done;
    isFirstLoaded.value = true;

    emit('optionsChange', options.value);
    handleAutoSelect();
  } finally {
    loading.value = false;
    if (pendingRefresh.value) {
      fetchData(false);
    }
  }
}

function reload() {
  fetchData(false);
}

// ---------------- 自动选择 ----------------
function countNodes(nodes: any[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.children?.length) {
      count += countNodes(node.children);
    }
  }
  return count;
}

function findFirstNode(nodes: any[]): any | null {
  for (const node of nodes) {
    if (node.children?.length) {
      const found = findFirstNode(node.children);
      if (found) return found;
    }
    return node;
  }
  return null;
}

function handleAutoSelect() {
  if (!props.autoSelect || options.value.length === 0) return;

  const hasValue = Array.isArray(modelValue.value) ? modelValue.value.length > 0 : modelValue.value !== undefined && modelValue.value !== null && modelValue.value !== '';
  if (hasValue) return;

  let first: any;
  if (resolvedTree.value) {
    const total = countNodes(options.value);
    if (props.autoSelect === 'one' && total !== 1) return;
    first = findFirstNode(options.value)?.value;
  } else {
    if (props.autoSelect === 'one' && options.value.length !== 1) return;
    first = options.value[0]?.value;
  }

  if (first === undefined || first === null) return;
  modelValue.value = Array.isArray(modelValue.value) ? [first] : first;
}

// ---------------- 事件 ----------------
function handlePopupScroll(e: Event) {
  if (resolvedTree.value) return;
  const target = e.target as HTMLElement;
  const bottom = target.scrollHeight - target.scrollTop - target.clientHeight;
  if (bottom < 20 && !loading.value && !finished.value) {
    page.value += 1;
    fetchData(true);
  }
}

function handleDropdownVisibleChange(visible: boolean) {
  if (visible && !isFirstLoaded.value) {
    fetchData(false);
  }
}

function handleSearch(value: string) {
  keyword.value = value;
  fetchData(false);
}

const selectListeners = computed(() => {
  return props.showSearchButton ? {} : { search: handleSearch };
});

// ---------------- 防抖工具 ----------------
function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
}

// ---------------- 监听 ----------------
function buildParamsKey(): string {
  return JSON.stringify(props.params);
}

function shouldReloadByParams(): boolean {
  const key = buildParamsKey();
  if (key === lastParamsKey.value) return false;
  lastParamsKey.value = key;
  return true;
}

// params 连续变化时合并为一次请求（解决 Vben dependencies 先 reset 再赋值导致的重复请求）
const debouncedFetchByParams = debounce(() => {
  fetchData(false);
}, 30);

// 挂载时加载
if (props.immediate && shouldReloadByParams()) {
  fetchData(false);
}

// 配置或 api 变化时重新加载
watch(
  () => [resolvedApi.value, resolvedPageSize.value],
  () => fetchData(false),
  { deep: true },
);

// params 变化时按内容去重，并通过防抖合并连续变化
watch(
  () => props.params,
  () => {
    if (shouldReloadByParams()) {
      debouncedFetchByParams();
    }
  },
  { deep: true },
);

// 本地 options 兜底
watch(
  () => props.options,
  val => {
    if (Array.isArray(val)) {
      options.value = normalizeOptions(val);
    }
  },
  { immediate: true },
);

// ---------------- 暴露 ----------------
defineExpose({
  reload,
  get options() {
    return options.value;
  },
});
</script>

<template>
  <Select
    v-if="!resolvedTree"
    v-bind="componentProps"
    v-model:value="modelValue"
    :options="options"
    :loading="loading"
    :filter-option="false"
    :show-search="!props.showSearchButton"
    v-on="selectListeners"
    @dropdown-visible-change="handleDropdownVisibleChange"
    @popup-scroll="handlePopupScroll"
    style="min-width: 160px"
  >
    <template #suffixIcon>
      <IconifyIcon :class="loading ? 'animate-spin text-base' : 'text-base'" :icon="loading ? 'mdi:loading' : 'lucide:chevron-down'" />
    </template>

    <template v-if="props.showSearchButton" #dropdownRender="{ menuNode }">
      <div class="flex items-center gap-2 p-2">
        <Input v-model:value="keyword" class="flex-1" placeholder="请输入关键词" @press-enter="fetchData(false)" />
        <Button type="primary" :loading="loading" @click="fetchData(false)">
          <IconifyIcon icon="mdi:magnify" />
          搜索
        </Button>
      </div>
      <component :is="menuNode" />
    </template>
  </Select>

  <TreeSelect
    v-else
    v-bind="componentProps"
    :value="modelValue"
    :tree-data="options"
    :loading="loading"
    :tree-check-strictly="checkStrictly"
    :show-checked-strategy="TreeSelect.SHOW_ALL"
    :tree-default-expand-all="treeDefaultExpandAll"
    tree-node-filter-prop="label"
    @dropdown-visible-change="handleDropdownVisibleChange"
    @update:value="modelValue = $event"
    style="min-width: 160px"
  >
    <template #suffixIcon>
      <IconifyIcon :class="loading ? 'animate-spin text-base' : 'text-base'" :icon="loading ? 'mdi:loading' : 'lucide:chevron-down'" />
    </template>
  </TreeSelect>
</template>

<style scoped></style>
