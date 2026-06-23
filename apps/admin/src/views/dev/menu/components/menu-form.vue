<script setup lang="ts">
import type { MenuAdminApi } from '#/api/dev/menuAdmin';

import { computed } from 'vue';

import { IconPicker } from '@vben/common-ui';

import { Button, Checkbox, Form, FormItem, Input, InputNumber, Modal, RadioButton, RadioGroup, Select, TreeSelect } from 'ant-design-vue';

import { $t } from '#/locales';

import { createBadgeTypeOptions, createBadgeVariantOptions, createDefaultForm, createStatusOptions } from '../data';

const props = defineProps<{
  availableTypes: { label: string; value: MenuAdminApi.MenuType }[];
  isEdit: boolean;
  loading: boolean;
  title: string;
  treeData: MenuAdminApi.MenuItem[];
  visible: boolean;
}>();

const emit = defineEmits<{
  'open-pick-method': [];
  submit: [];
  'update:visible': [visible: boolean];
}>();

const form = defineModel<MenuAdminApi.SaveParams & { id?: string }>('form', {
  required: true,
  default: () => createDefaultForm(),
});

const showVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
});

const statusOptions = createStatusOptions($t);
const badgeTypeOptions = createBadgeTypeOptions($t);
const badgeVariantOptions = createBadgeVariantOptions($t);

const treeSelectData = computed(() => {
  const excludeId = props.isEdit ? form.value.id : undefined;
  return buildTreeData(props.treeData, excludeId);
});

function buildTreeData(nodes: MenuAdminApi.MenuItem[], excludeId?: string): { children: any[]; label: string; value: string }[] {
  const result: { children: any[]; label: string; value: string }[] = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    result.push({
      label: node.title,
      value: node.id,
      children: node.children?.length ? buildTreeData(node.children, excludeId) : [],
    });
  }
  return result;
}

function handlePickMethod() {
  emit('open-pick-method');
}

function handleCancel() {
  showVisible.value = false;
}

function handleOk() {
  emit('submit');
}

function onTypeChange() {
  // 切换类型时清空不适用字段，避免脏数据
  if (form.value.type === 3) {
    form.value.name = '';
    form.value.path = '';
    form.value.component = '';
    form.value.linkSrc = '';
  }
}
</script>

<template>
  <Modal v-model:open="showVisible" :title="title" :confirm-loading="loading" width="680px" @ok="handleOk" @cancel="handleCancel">
    <Form :model="form" layout="vertical" class="mt-4">
      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('dev.menu.fields.type')" required>
          <RadioGroup v-model:value="form.type" button-style="solid" @change="onTypeChange">
            <RadioButton v-for="opt in availableTypes" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem :label="$t('dev.menu.fields.status')">
          <Select v-model:value="form.status" :options="statusOptions" class="w-full" />
        </FormItem>
      </div>

      <FormItem :label="$t('dev.menu.fields.parentId')">
        <TreeSelect
          v-model:value="form.parentId"
          :tree-data="[{ label: $t('dev.menu.rootLevel'), value: null, children: treeSelectData }]"
          :placeholder="$t('dev.menu.placeholder.parentId')"
          allow-clear
          tree-default-expand-all
          class="w-full"
        />
      </FormItem>

      <FormItem :label="$t('dev.menu.fields.title')" required>
        <Input v-model:value="form.title" />
      </FormItem>

      <template v-if="form.type !== 3">
        <div class="grid grid-cols-2 gap-x-4">
          <FormItem :label="$t('dev.menu.fields.name')" required>
            <Input v-model:value="form.name" placeholder="如：SystemUser" />
          </FormItem>
          <FormItem :label="$t('dev.menu.fields.path')" required>
            <Input v-model:value="form.path" placeholder="如：/org/user" />
          </FormItem>
        </div>

        <FormItem v-if="[2, 4].includes(form.type)" :label="$t('dev.menu.fields.activePath')">
          <Input v-model:value="form.activePath" :placeholder="$t('dev.menu.placeholder.activePath')" />
        </FormItem>

        <FormItem v-if="[4, 5].includes(form.type)" :label="$t('dev.menu.fields.linkSrc')" required>
          <Input v-model:value="form.linkSrc" :placeholder="form.type === 4 ? 'iframe 地址' : '外链地址'" />
        </FormItem>

        <FormItem v-if="form.type === 2" :label="$t('dev.menu.fields.component')" required>
          <Input v-model:value="form.component" :placeholder="$t('dev.menu.placeholder.component')" />
        </FormItem>

        <div class="grid grid-cols-2 gap-x-4">
          <FormItem :label="$t('dev.menu.fields.icon')">
            <IconPicker v-model="form.icon" prefix="lucide" />
          </FormItem>
          <FormItem :label="$t('dev.menu.fields.activeIcon')">
            <IconPicker v-model="form.activeIcon" prefix="lucide" />
          </FormItem>
        </div>
      </template>

      <FormItem v-if="form.type === 3" :label="$t('dev.menu.fields.permission')" required>
        <div class="flex gap-2">
          <Input v-model:value="form.permission" :placeholder="$t('dev.menu.placeholder.permission')" class="flex-1" />
          <Button @click="handlePickMethod">{{ $t('dev.menu.pickMethod') }}</Button>
        </div>
      </FormItem>

      <FormItem :label="$t('dev.menu.fields.sort')">
        <InputNumber v-model:value="form.sort" class="w-full" :min="0" />
      </FormItem>

      <template v-if="form.type !== 3">
        <div class="grid grid-cols-3 gap-x-4">
          <FormItem :label="$t('dev.menu.fields.badgeType')">
            <Select v-model:value="form.badgeType" :options="badgeTypeOptions" class="w-full" />
          </FormItem>
          <FormItem :label="$t('dev.menu.fields.badge')">
            <Input v-model:value="form.badge" :disabled="form.badgeType !== 'normal'" :placeholder="$t('dev.menu.placeholder.badge')" />
          </FormItem>
          <FormItem :label="$t('dev.menu.fields.badgeVariants')">
            <Select v-model:value="form.badgeVariants" :disabled="!form.badgeType" :options="badgeVariantOptions" allow-clear class="w-full" />
          </FormItem>
        </div>
      </template>

      <div class="grid grid-cols-3 gap-x-4">
        <FormItem v-if="form.type !== 3">
          <Checkbox v-model:checked="form.isHidden">{{ $t('dev.menu.fields.isHidden') }}</Checkbox>
        </FormItem>
        <FormItem v-if="[1, 2].includes(form.type)">
          <Checkbox v-model:checked="form.isHideChildren">{{ $t('dev.menu.fields.isHideChildren') }}</Checkbox>
        </FormItem>
        <FormItem v-if="form.type !== 3">
          <Checkbox v-model:checked="form.isHideBreadcrumb">{{ $t('dev.menu.fields.isHideBreadcrumb') }}</Checkbox>
        </FormItem>
        <FormItem v-if="form.type !== 3">
          <Checkbox v-model:checked="form.isHideTab">{{ $t('dev.menu.fields.isHideTab') }}</Checkbox>
        </FormItem>
        <FormItem v-if="form.type === 2">
          <Checkbox v-model:checked="form.isKeepAlive">{{ $t('dev.menu.fields.isKeepAlive') }}</Checkbox>
        </FormItem>
        <FormItem v-if="[2, 4].includes(form.type)">
          <Checkbox v-model:checked="form.isAffixTab">{{ $t('dev.menu.fields.isAffixTab') }}</Checkbox>
        </FormItem>
      </div>
    </Form>
  </Modal>
</template>
