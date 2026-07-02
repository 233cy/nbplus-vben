<script setup lang="ts">
import type { PageSelectConfig } from './types';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { get } from '@vben/utils';

import { Button, Input, Select } from 'ant-design-vue';

import { getPageSelectConfig } from './configs';
import { type OptionsType } from './configs';

defineOptions({ name: 'ApiSelect' });

interface Props {
  /**
   * 数据接口，支持数组或分页对象 `{ items: [], total: number }`。
   * 也可以传 `config` 复用 page-select 的预设配置。
   */
  api?: (params: any) => Promise<any[] | { items: any[]; total?: number } | any>;
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
}

const props = withDefaults(defineProps<Props>(), {
  keywordField: 'keyword',
  allowClear: true,
  dropdownMatchSelectWidth: false,
  immediate: true,
  autoSelect: false,
  showSearchButton: true,
});

const emit = defineEmits<{
  optionsChange: [any[]];
}>();

const modelValue = defineModel<any>('value', { default: undefined });

const resolvedConfig = computed<PageSelectConfig | null>(() => {
  if (!props.config) {
    return null;
  }
  return typeof props.config === 'string' ? getPageSelectConfig(props.config) : props.config;
});

const resolvedApi = computed(() => resolvedConfig.value?.api || props.api);
const resolvedLabelField = computed(() => props.labelField ?? (resolvedConfig.value?.labelField as string) ?? 'label');
const resolvedValueField = computed(() => props.valueField ?? (resolvedConfig.value?.valueField as string) ?? 'value');
const resolvedPageSize = computed(() => props.pageSize ?? resolvedConfig.value?.pageSize ?? 10);
const resolvedMode = computed(() => {
  if (props.mode) {
    return props.mode;
  }
  if (props.multiple || resolvedConfig.value?.multiple) {
    return 'multiple';
  }
  return undefined;
});

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

function normalizeOptions(rows: any[]) {
  return rows.map((row) => {
    const value = get(row, resolvedValueField.value);
    return {
      ...row,
      label: get(row, resolvedLabelField.value),
      value,
      key: value,
    };
  });
}

function handleAutoSelect() {
  if (!props.autoSelect || options.value.length === 0) {
    return;
  }

  const hasValue = resolvedMode.value
    ? Array.isArray(modelValue.value) && modelValue.value.length > 0
    : modelValue.value !== undefined;
  if (hasValue) {
    return;
  }

  const first = options.value[0].value;
  modelValue.value = resolvedMode.value ? [first] : first;
}

function extractRows(res: any): { rows: any[]; done: boolean } {
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
  } else if (finished.value) {
    return;
  }

  loading.value = true;
  try {
    const res = await api({
      ...props.params,
      page: page.value,
      pageSize: resolvedPageSize.value,
      [props.keywordField]: keyword.value || undefined,
    });

    const { rows, done } = extractRows(res);
    const list = normalizeOptions(rows);

    options.value = append ? [...options.value, ...list] : list;
    finished.value = list.length === 0 || done;
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
  (val) => {
    if (Array.isArray(val)) {
      options.value = normalizeOptions(val);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Select
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
  >
    <template #suffixIcon>
      <IconifyIcon
        :class="loading ? 'animate-spin text-base' : 'text-base'"
        :icon="loading ? 'mdi:loading' : 'lucide:chevron-down'"
      />
    </template>
    <template v-if="showSearchButton" #dropdownRender="{ menuNode }">
      <div class="flex items-center gap-2 p-2">
        <Input
          v-model:value="keyword"
          class="flex-1"
          :placeholder="$t('common.search.keyword')"
          @press-enter="fetchData(false)"
        />
        <Button type="primary" :loading="loading" @click="fetchData(false)">
          <IconifyIcon icon="mdi:magnify" />
          {{ $t('common.search.button') }}
        </Button>
      </div>
      <component :is="menuNode" />
    </template>
  </Select>
</template>

<style scoped></style>
