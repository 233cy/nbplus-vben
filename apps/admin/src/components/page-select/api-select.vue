<script setup lang="ts">
import type { OptionsType } from './configs';
import type { PageSelectConfig } from './types';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { get } from '@vben/utils';

import { Button, Input, Select, TreeSelect } from 'ant-design-vue';

import { getPageSelectConfig } from './configs';

interface Props {
  /**
   * 数据接口，支持数组或分页对象 `{ items: [], total: number }`。
   * 也可以传 `config` 复用 page-select 的预设配置。
   */
  api?: (params: any) => Promise<any | any[] | { items: any[]; total?: number }>;
  /** 透传给 api 的固定参数 */
  params?: Record<string, any>;
  /**
   * page-select 预设类型或完整配置。
   * 传入时会优先使用配置中的 api/labelField/valueField/pageSize/multiple。
   */
  config?: OptionsType | PageSelectConfig;
  /** 显示标签字段 */
  labelField?: string;
  /** 值字段 */
  valueField?: string;
  /** 当 api 返回对象时，指定 options 数组所在字段（不填则按 page-select 分页对象解析） */
  resultField?: string;
  /** 每页条数，默认 10 */
  pageSize?: number;
  /** 搜索参数字段名，默认 keyword */
  keywordField?: string;
  /** 是否多选 */
  multiple?: boolean;
  /** Select mode，优先级高于 multiple */
  mode?: 'multiple' | 'tags';
  /** 是否立即加载，默认 true */
  immediate?: boolean;
  /** 自动选择：first=首个，one=只有一个时自动选择 */
  autoSelect?: 'first' | 'one' | false;
  allowClear?: boolean;
  placeholder?: string;
  dropdownMatchSelectWidth?: boolean;
  /** 是否显示下拉搜索按钮；为 true 时关闭输入实时搜索，改为在弹层内点击搜索按钮触发 */
  showSearchButton?: boolean;
  /** 本地兜底选项 */
  options?: any[];
  /** 树形模式下父子节点是否独立勾选，优先级高于 config 中的 checkStrictly */
  checkStrictly?: boolean;
  /** 树形平级数据转树时的父节点字段，默认 parentId */
  parentField?: string;
  /** 树形模式下是否默认展开全部节点，默认 false */
  treeDefaultExpandAll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  keywordField: 'keyword',
  allowClear: true,
  dropdownMatchSelectWidth: false,
  immediate: true,
  autoSelect: false,
  showSearchButton: true,
  parentField: 'parentId',
  treeDefaultExpandAll: false,
  api: undefined,
  params: undefined,
  config: undefined,
  labelField: undefined,
  valueField: undefined,
  resultField: undefined,
  pageSize: undefined,
  multiple: undefined,
  mode: undefined,
  placeholder: undefined,
  options: undefined,
  checkStrictly: undefined,
});

const emit = defineEmits<{
  optionsChange: [any[]];
}>();

const modelValue = defineModel<any>('value', { default: undefined });

const resolvedConfig = computed<null | PageSelectConfig>(() => {
  if (!props.config) {
    return null;
  }
  return typeof props.config === 'string' ? getPageSelectConfig(props.config) : props.config;
});

const resolvedApi = computed(() => resolvedConfig.value?.api || props.api);
const resolvedLabelField = computed(() => props.labelField ?? (resolvedConfig.value?.labelField as string) ?? 'label');
const resolvedValueField = computed(() => props.valueField ?? (resolvedConfig.value?.valueField as string) ?? 'value');
const resolvedPageSize = computed(() => props.pageSize ?? resolvedConfig.value?.pageSize ?? 10);
const isTree = computed(() => resolvedConfig.value?.type === 'tree');

const isMultiple = computed(() => {
  if (props.mode === 'multiple' || props.mode === 'tags') {
    return true;
  }
  // 严格判断：只有显式 true 或字符串 'true' 才启用多选
  const propMultiple = props.multiple === true || String(props.multiple) === 'true';
  const configMultiple = resolvedConfig.value?.multiple === true || String(resolvedConfig.value?.multiple) === 'true';
  return propMultiple || configMultiple;
});

const resolvedMode = computed(() => {
  if (props.mode) {
    return props.mode;
  }
  if (isMultiple.value) {
    return 'multiple';
  }
  return undefined;
});

const resolvedCheckStrictly = computed(() => props.checkStrictly ?? (resolvedConfig.value?.checkStrictly as boolean) ?? false);
const resolvedParentField = computed(() => props.parentField ?? (resolvedConfig.value?.parentField as string) ?? 'parentId');

const showSearch = computed(() => !props.showSearchButton);

// 多选/标签模式下，v-model 必须是数组；外部传了字符串或 undefined 时自动归一化
watch(
  () => [resolvedMode.value, modelValue.value],
  ([mode, val]) => {
    if (!mode) {
      return;
    }
    if (!Array.isArray(val)) {
      modelValue.value = val === undefined || val === null ? [] : [val];
    }
  },
  { immediate: true },
);

const options = ref<any[]>(props.options || []);
const loading = ref(false);
const finished = ref(false);
const keyword = ref('');
const page = ref(1);
const isFirstLoaded = ref(false);

function normalizeNode(row: any): any {
  const value = get(row, resolvedValueField.value);
  return {
    ...row,
    label: get(row, resolvedLabelField.value),
    value,
    key: value,
  };
}

function normalizeTreeOptions(rows: any[]): any[] {
  // 如果后端已经返回嵌套 children，直接递归归一化
  if (rows.length > 0 && Array.isArray(rows[0]?.children)) {
    return rows.map(row => {
      const node = normalizeNode(row);
      if (row.children?.length) {
        node.children = normalizeTreeOptions(row.children);
      }
      return node;
    });
  }

  const tree = listToTree(rows, resolvedValueField.value, resolvedParentField.value);
  return tree.map(row => {
    const node = normalizeNode(row);
    if (row.children?.length) {
      node.children = normalizeTreeOptions(row.children);
    }
    return node;
  });
}

function normalizeOptions(rows: any[]) {
  if (isTree.value) {
    return normalizeTreeOptions(rows);
  }

  return rows.map(row => {
    const value = get(row, resolvedValueField.value);
    return {
      ...row,
      label: get(row, resolvedLabelField.value),
      value,
      key: value,
    };
  });
}

function listToTree(rows: any[], idField: string, parentField: string): any[] {
  const map = new Map<number | string, any>();
  const roots: any[] = [];

  rows.forEach(row => {
    const id = get(row, idField);
    map.set(id, { ...row, children: [] });
  });

  rows.forEach(row => {
    const id = get(row, idField);
    const parentId = get(row, parentField);
    const node = map.get(id);
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function findFirstNode(nodes: any[]): any | null {
  if (nodes.length === 0) {
    return null;
  }
  const [first, ...rest] = nodes;
  if (first.children?.length) {
    const found = findFirstNode(first.children);
    if (found) return found;
  }
  return first ?? findFirstNode(rest);
}

function handleAutoSelect() {
  if (!props.autoSelect || options.value.length === 0) {
    return;
  }

  const hasValue = isMultiple.value
    ? Array.isArray(modelValue.value) && modelValue.value.length > 0
    : modelValue.value !== undefined && modelValue.value !== null && modelValue.value !== '';
  if (hasValue) {
    return;
  }

  let first: any;
  if (isTree.value) {
    const total = countNodes(options.value);
    if (props.autoSelect === 'one' && total !== 1) {
      return;
    }
    first = findFirstNode(options.value)?.value;
  } else {
    if (props.autoSelect === 'one' && options.value.length !== 1) {
      return;
    }
    first = options.value[0].value;
  }

  if (first === undefined || first === null) {
    return;
  }

  modelValue.value = isMultiple.value ? [first] : first;
}

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
  if (!api || loading.value) {
    return;
  }

  if (!append) {
    page.value = 1;
    finished.value = false;
  } else if (finished.value || isTree.value) {
    return;
  }

  loading.value = true;
  try {
    const requestParams: Record<string, any> = {
      ...props.params,
      [props.keywordField]: keyword.value || undefined,
    };

    if (!isTree.value) {
      requestParams.page = page.value;
      requestParams.pageSize = resolvedPageSize.value;
    }

    const res = await api(requestParams);

    const { rows, done } = extractRows(res);
    const list = normalizeOptions(rows);

    options.value = append ? [...options.value, ...list] : list;
    finished.value = isTree.value || list.length === 0 || done;
    isFirstLoaded.value = true;

    emit('optionsChange', options.value);
    handleAutoSelect();
  } finally {
    loading.value = false;
  }
}

function handleSearch(value: string) {
  if (props.showSearchButton) {
    return;
  }
  keyword.value = value;
  fetchData(false);
}

function handlePopupScroll(e: Event) {
  if (isTree.value) {
    return;
  }
  const target = e.target as HTMLElement;
  const bottom = target.scrollHeight - target.scrollTop - target.clientHeight;
  if (bottom < 20 && !loading.value && !finished.value) {
    page.value += 1;
    fetchData(true);
  }
}

function handleDropdownVisibleChange(visible: boolean) {
  if (visible && !isFirstLoaded.value && !props.immediate) {
    fetchData(false);
  }
}

/**
 * 处理 TreeSelect 的值更新，确保多选时返回的是 value 数组而非对象数组.
 */
function handleTreeValueUpdate(val: any) {
  if (isTree.value && isMultiple.value && Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
    modelValue.value = val.map((item: any) => item?.value ?? item);
    return;
  }
  modelValue.value = val;
}

watch(
  () => [resolvedApi.value, props.params, resolvedPageSize.value],
  () => {
    if (props.immediate) {
      fetchData(false);
    }
  },
  { deep: true, immediate: true },
);

watch(
  () => props.options,
  val => {
    if (Array.isArray(val)) {
      options.value = normalizeOptions(val);
    }
  },
  { immediate: true },
);

defineExpose({
  reload: () => fetchData(false),
  get options() {
    return options.value;
  },
});
</script>

<template>
  <Select
    v-if="!isTree"
    v-model:value="modelValue"
    :allow-clear="allowClear"
    :dropdown-match-select-width="dropdownMatchSelectWidth"
    :mode="resolvedMode"
    :options="options"
    :placeholder="placeholder || $t('ui.placeholder.select')"
    :show-search="showSearch"
    :filter-option="false"
    :on-search="showSearch ? handleSearch : undefined"
    @dropdown-visible-change="handleDropdownVisibleChange"
    @popup-scroll="handlePopupScroll"
    style="min-width: 160px"
  >
    <template #suffixIcon>
      <IconifyIcon :class="loading ? 'animate-spin text-base' : 'text-base'" :icon="loading ? 'mdi:loading' : 'lucide:chevron-down'" />
    </template>
    <template v-if="showSearchButton" #dropdownRender="{ menuNode }">
      <div class="flex items-center gap-2 p-2">
        <Input v-model:value="keyword" class="flex-1" :placeholder="$t('common.search.keyword')" @press-enter="fetchData(false)" />
        <Button type="primary" :loading="loading" @click="fetchData(false)">
          <IconifyIcon icon="mdi:magnify" />
          {{ $t('common.search.button') }}
        </Button>
      </div>
      <component :is="menuNode" />
    </template>
  </Select>

  <TreeSelect
    v-else
    :value="modelValue"
    :allow-clear="allowClear"
    :dropdown-match-select-width="dropdownMatchSelectWidth"
    :field-names="{ label: 'label', value: 'value', children: 'children' }"
    :loading="loading"
    :placeholder="placeholder || $t('ui.placeholder.select')"
    :show-search="true"
    :show-checked-strategy="isMultiple ? TreeSelect.SHOW_ALL : undefined"
    :tree-checkable="isMultiple"
    :tree-check-strictly="isMultiple ? resolvedCheckStrictly : undefined"
    :tree-data="options"
    :tree-default-expand-all="treeDefaultExpandAll"
    tree-node-filter-prop="label"
    @dropdown-visible-change="handleDropdownVisibleChange"
    @update:value="handleTreeValueUpdate"
    style="min-width: 160px"
  >
    <template #suffixIcon>
      <IconifyIcon :class="loading ? 'animate-spin text-base' : 'text-base'" :icon="loading ? 'mdi:loading' : 'lucide:chevron-down'" />
    </template>
  </TreeSelect>
</template>

<style scoped></style>
