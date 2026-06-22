<script setup lang="ts">
import { computed } from 'vue';

import { IconPicker } from '@vben/common-ui';

import { Form, FormItem, Input, InputNumber, Modal, TreeSelect } from 'ant-design-vue';

import { $t } from '#/locales';

import { useMenuForm } from '../composables/useMenuForm';

const menuForm = useMenuForm();

const showVisible = computed({
  get: () => menuForm.visible.value,
  set: val => {
    menuForm.visible.value = val;
  },
});

defineExpose({
  open: menuForm.open,
});
</script>

<template>
  <Modal v-model:open="showVisible" :title="$t('dev.curd.menu.title')" :confirm-loading="menuForm.loading.value" width="520px" @ok="menuForm.handleSubmit">
    <Form :model="menuForm.form.value" layout="vertical" class="mt-4">
      <FormItem :label="$t('dev.curd.menu.parent')" required>
        <TreeSelect
          v-model:value="menuForm.form.value.menuParentId"
          :tree-data="menuForm.menuTreeData.value"
          :field-names="{ label: 'title', value: 'id', children: 'children' }"
          tree-default-expand-all
          class="w-full"
          :placeholder="$t('dev.curd.menu.parentPlaceholder')"
          @change="menuForm.onParentChange"
        />
        <div v-if="menuForm.form.value.menuParentId && menuForm.form.value.menuParentId !== '__root__'" class="mt-1 text-xs text-gray-400">
          {{ $t('dev.curd.menu.parentFullPath') }}：
          <span class="font-mono text-blue-500">{{ menuForm.parentNodePath.value }}</span>
        </div>
      </FormItem>
      <FormItem :label="$t('dev.curd.menu.path')" required>
        <Input v-model:value="menuForm.form.value.menuPath" :placeholder="$t('dev.curd.menu.pathPlaceholder')" />
        <div class="mt-1 text-xs text-gray-400">
          {{ $t('dev.curd.menu.preview') }}：<span class="font-mono text-green-600">{{ menuForm.menuPathPreview.value }}</span>
          <span class="ml-2">
            {{ menuForm.form.value.menuPath.startsWith('/') ? $t('dev.curd.menu.absolute') : $t('dev.curd.menu.relative') }}
          </span>
        </div>
      </FormItem>
      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('dev.curd.menu.icon')">
          <IconPicker v-model="menuForm.form.value.menuIcon" prefix="lucide" />
        </FormItem>
        <FormItem :label="$t('dev.curd.menu.sort')">
          <InputNumber v-model:value="menuForm.form.value.menuSort" :min="0" class="w-full" />
        </FormItem>
      </div>
      <div class="rounded bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">
        {{ $t('dev.curd.menu.hint') }}
      </div>
    </Form>
  </Modal>
</template>
