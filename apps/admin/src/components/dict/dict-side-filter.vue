<script setup lang="ts">
import type { TreeProps } from 'ant-design-vue';

import { computed, ref } from 'vue';

import { InputSearch, Tree } from 'ant-design-vue';

import { useDict } from '#/utils/dict';
import { $t } from '#/locales';

/**
 * 字典分组侧栏筛选（Tree 形态：搜索过滤 + 单选，点击即触发筛选）.
 *
 * 用法：`<DictSideFilter v-model:value="activeGroup" code="sys_config_groups" @update:value="onSelect" />`
 */
const props = defineProps<{ code: string }>();

const modelValue = defineModel<string>('value', { default: '' });

const { items } = useDict(props.code);
const keyword = ref('');

const treeData = computed<TreeProps['treeData']>(() => {
  const kw = keyword.value.trim().toLowerCase();
  const filtered = kw ? items.value.filter(item => item.label.toLowerCase().includes(kw)) : items.value;

  return [
    { title: $t('common.all'), key: '' },
    ...filtered.map(item => ({ title: item.label, key: item.value })),
  ];
});

const selectedKeys = computed(() => (modelValue.value === '' ? [] : [modelValue.value]));

function onSelect(keys: (number | string)[]) {
  // 点击已选中项时 antd Tree 自动反选（keys 为空），等同回到"全部"
  modelValue.value = (keys[0] as string) ?? '';
}
</script>

<template>
  <div class="flex w-[220px] shrink-0 flex-col rounded-lg bg-white p-3">
    <InputSearch
      v-model:value="keyword"
      allow-clear
      :placeholder="$t('common.search')"
      class="mb-3"
    />
    <Tree
      :tree-data="treeData"
      :selected-keys="selectedKeys"
      default-expand-all
      block-node
      @select="onSelect"
    />
  </div>
</template>
