<script setup lang="ts">
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed, ref, watch } from 'vue';

import { IconPicker } from '@vben/common-ui';

import { Button, Checkbox, Form, FormItem, Input, InputNumber, Modal, RadioButton, RadioGroup, TreeSelect } from 'ant-design-vue';

import { getMenuTreeApi } from '#/api/sys/menuAdmin';
import DictSelect from '#/components/dict/DictSelect.vue';
import { $t } from '#/locales';

import { createDefaultForm, ROOT_PARENT } from '../composables/useMenuForm';

const props = defineProps<{
  availableTypes: { label: string; value: MenuAdminApi.MenuType }[];
  isEdit: boolean;
  loading: boolean;
  title: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  openPickMethod: [];
  submit: [];
  'update:visible': [visible: boolean];
}>();

const form = defineModel<MenuAdminApi.SaveParams & { id?: string }>('form', {
  required: true,
  default: () => createDefaultForm(),
});

const treeData = ref<MenuAdminApi.MenuItem[]>([]);

const showVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
});

const treeSelectData = computed(() => {
  const excludeId = props.isEdit ? form.value.id : undefined;
  return buildTreeData(treeData.value, excludeId);
});

watch(
  () => props.visible,
  visible => {
    if (visible) {
      getMenuTreeApi()
        .then(res => {
          treeData.value = res;
        })
        .catch(() => {
          treeData.value = [];
        });
    }
  },
);

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
  emit('openPickMethod');
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
        <FormItem :label="$t('sys.menu.fields.type')" required>
          <RadioGroup v-model:value="form.type" button-style="solid" @change="onTypeChange">
            <RadioButton v-for="opt in availableTypes" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem :label="$t('sys.menu.fields.status')">
          <DictSelect v-model:value="form.status" code="is_enable" value-type="number" class="w-full" />
        </FormItem>
      </div>

      <FormItem :label="$t('sys.menu.fields.parentId')">
        <TreeSelect
          v-model:value="form.parentId"
          :tree-data="[{ label: $t('sys.menu.rootLevel'), value: ROOT_PARENT, children: treeSelectData }]"
          :placeholder="$t('sys.menu.placeholder.parentId')"
          allow-clear
          tree-default-expand-all
          class="w-full"
        />
      </FormItem>

      <FormItem :label="$t('sys.menu.fields.title')" required>
        <Input v-model:value="form.title" />
      </FormItem>

      <template v-if="form.type !== 3">
        <div class="grid grid-cols-2 gap-x-4">
          <FormItem :label="$t('sys.menu.fields.name')" required>
            <Input v-model:value="form.name" placeholder="如：SystemUser" />
          </FormItem>
          <FormItem :label="$t('sys.menu.fields.path')" required>
            <Input v-model:value="form.path" placeholder="如：/org/user" />
          </FormItem>
        </div>

        <FormItem v-if="[2, 4].includes(form.type)" :label="$t('sys.menu.fields.activePath')">
          <Input v-model:value="form.activePath" :placeholder="$t('sys.menu.placeholder.activePath')" />
        </FormItem>

        <FormItem v-if="[4, 5].includes(form.type)" :label="$t('sys.menu.fields.linkSrc')" required>
          <Input v-model:value="form.linkSrc" :placeholder="form.type === 4 ? 'iframe 地址' : '外链地址'" />
        </FormItem>

        <FormItem v-if="form.type === 2" :label="$t('sys.menu.fields.component')" required>
          <Input v-model:value="form.component" :placeholder="$t('sys.menu.placeholder.component')" />
        </FormItem>

        <div class="grid grid-cols-2 gap-x-4">
          <FormItem :label="$t('sys.menu.fields.icon')">
            <IconPicker v-model="form.icon" prefix="lucide" />
          </FormItem>
          <FormItem :label="$t('sys.menu.fields.activeIcon')">
            <IconPicker v-model="form.activeIcon" prefix="lucide" />
          </FormItem>
        </div>
      </template>

      <FormItem v-if="form.type === 3" :label="$t('sys.menu.fields.permission')" required>
        <div class="flex gap-2">
          <Input v-model:value="form.permission" :placeholder="$t('sys.menu.placeholder.permission')" class="flex-1" />
          <Button @click="handlePickMethod">{{ $t('sys.menu.pickMethod') }}</Button>
        </div>
      </FormItem>

      <FormItem :label="$t('sys.menu.fields.sort')">
        <InputNumber v-model:value="form.sort" class="w-full" :min="0" />
      </FormItem>

      <template v-if="form.type !== 3">
        <div class="grid grid-cols-3 gap-x-4">
          <FormItem :label="$t('sys.menu.fields.badgeType')">
            <DictSelect v-model:value="form.badgeType" code="sys_badge_type" class="w-full" />
          </FormItem>
          <FormItem :label="$t('sys.menu.fields.badge')">
            <Input v-model:value="form.badge" :disabled="form.badgeType !== 'normal'" :placeholder="$t('sys.menu.placeholder.badge')" />
          </FormItem>
          <FormItem :label="$t('sys.menu.fields.badgeVariants')">
            <DictSelect v-model:value="form.badgeVariants" code="sys_badge_variant" :disabled="!form.badgeType" class="w-full" />
          </FormItem>
        </div>
      </template>

      <div class="grid grid-cols-3 gap-x-4">
        <FormItem v-if="form.type !== 3">
          <Checkbox v-model:checked="form.isHidden">{{ $t('sys.menu.fields.isHidden') }}</Checkbox>
        </FormItem>
        <FormItem v-if="[1, 2].includes(form.type)">
          <Checkbox v-model:checked="form.isHideChildren">{{ $t('sys.menu.fields.isHideChildren') }}</Checkbox>
        </FormItem>
        <FormItem v-if="form.type !== 3">
          <Checkbox v-model:checked="form.isHideBreadcrumb">{{ $t('sys.menu.fields.isHideBreadcrumb') }}</Checkbox>
        </FormItem>
        <FormItem v-if="form.type !== 3">
          <Checkbox v-model:checked="form.isHideTab">{{ $t('sys.menu.fields.isHideTab') }}</Checkbox>
        </FormItem>
        <FormItem v-if="form.type === 2">
          <Checkbox v-model:checked="form.isKeepAlive">{{ $t('sys.menu.fields.isKeepAlive') }}</Checkbox>
        </FormItem>
        <FormItem v-if="[2, 4].includes(form.type)">
          <Checkbox v-model:checked="form.isAffixTab">{{ $t('sys.menu.fields.isAffixTab') }}</Checkbox>
        </FormItem>
      </div>
    </Form>
  </Modal>
</template>
