<!--
  字典管理页面
  ============
  左侧：字典分组与字典列表（点击选中字典）
  右侧：当前选中字典的字典项列表（支持排序、搜索、CRUD）

  逻辑拆分：
  - composables/useDict.ts      → 字典数据与选中状态
  - composables/useDictItems.ts → 字典项数据与排序
  - composables/useDictForm.ts  → 字典类型 CRUD 弹窗
  - composables/useItemForm.ts  → 字典项 CRUD 弹窗
  - components/dict-sidebar.vue → 左侧字典列表
  - components/dict-form.vue    → 字典类型弹窗
  - components/item-list.vue    → 右侧字典项列表
  - components/item-form.vue    → 字典项弹窗
-->
<script setup lang="ts">
import { ColPage } from '@vben/common-ui';

import { $t } from '#/locales';

import DictForm from './components/dict-form.vue';
import DictSidebar from './components/dict-sidebar.vue';
import ItemForm from './components/item-form.vue';
import ItemList from './components/item-list.vue';
import { useDict, useDictForm, useDictItems, useItemForm } from './composables';

const dict = useDict({ defaultGroupLabel: $t('sys.dict.defaultGroup') });
const items = useDictItems();
const dictForm = useDictForm({
  allDicts: dict.allDicts,
  activeDict: dict.activeDict,
  reload: dict.loadDicts,
  clearSelection: dict.clearSelection,
});
const itemForm = useItemForm({
  activeDict: dict.activeDict,
  itemList: items.list,
  reloadItems: items.loadItems,
});

function onSelectDict(dictItem: any) {
  dict.activeDict.value = dictItem;
  items.keyword.value = '';
  if (dictItem) {
    items.loadItems(dictItem.id);
  } else {
    items.list.value = [];
  }
}

// 页面初始化
dict.loadDicts();
</script>

<template>
  <ColPage auto-content-height :left-width="26" :right-width="74" :resizable="true" :split-line="true" :split-handle="true">
    <template #left>
      <DictSidebar
        :loading="dict.loading.value"
        :tree-data="dict.treeData.value"
        :groups="dict.groups.value"
        :keyword="dict.keyword.value"
        :expanded-keys="dict.expandedKeys.value"
        :active-dict="dict.activeDict.value"
        @update:keyword="dict.keyword.value = $event"
        @update:expanded-keys="dict.expandedKeys.value = $event"
        @select="onSelectDict"
        @create="dictForm.openCreate($event)"
        @edit="dictForm.openEdit"
        @delete="dictForm.handleDelete"
        @reload="dict.loadDicts()"
      />
    </template>

    <ItemList
      :active-dict="dict.activeDict.value"
      :items="items.list.value"
      :loading="items.loading.value"
      :keyword="items.keyword.value"
      @update:keyword="items.keyword.value = $event"
      @add="itemForm.openCreate"
      @edit="itemForm.openEdit"
      @delete="itemForm.handleDelete"
      @reload="dict.activeDict.value && items.loadItems(dict.activeDict.value.id)"
    />

    <DictForm
      v-model:visible="dictForm.visible.value"
      v-model:form="dictForm.form.value"
      :loading="dictForm.loading.value"
      :is-edit="!!dictForm.editing.value"
      :group-options="dictForm.groupOptions.value"
      @submit="dictForm.handleSubmit"
    />

    <ItemForm
      v-model:visible="itemForm.visible.value"
      v-model:form="itemForm.form.value"
      :loading="itemForm.loading.value"
      :is-edit="!!itemForm.editing.value"
      @submit="itemForm.handleSubmit"
    />
  </ColPage>
</template>
