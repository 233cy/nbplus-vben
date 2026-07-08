<script setup lang="ts">
import type { MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed, nextTick, ref, watch } from 'vue';

import { IconPicker, useVbenDrawer } from '@vben/common-ui';

import { Button, Checkbox, Form, FormItem, Input, InputNumber, message, RadioButton, RadioGroup, TreeSelect } from 'ant-design-vue';

import { createMenuApi, getMenuDetailApi, getMenuTreeApi, updateMenuApi } from '#/api/sys/menuAdmin';
import DictSelect from '#/components/dict/DictSelect.vue';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';
import { getDictItems, useDict } from '#/utils/dict';

import { createDefaultForm, findNodeTitle, getAllowedTypes, ROOT_PARENT } from '../data';
import MenuPermissionModal from './menu-permission-modal.vue';

interface FormSuccessPayload {
  parentId?: string | null;
  originalParentId?: string | null;
}

const emit = defineEmits<{ success: [payload: FormSuccessPayload] }>();

const { hasAccessByCodes } = useAccess();
const canCreate = computed(() => hasAccessByCodes(['adm:sys:menu:create']));
const canUpdate = computed(() => hasAccessByCodes(['adm:sys:menu:update']));

const form = ref<MenuAdminApi.SaveParams & { id?: string }>(createDefaultForm());
const treeData = ref<MenuAdminApi.MenuItem[]>([]);
const treeExpandedKeys = ref<string[]>([]);
const rowId = ref<string | undefined>();
const originalParentId = ref<string | null>(null);
const isReadonly = ref(false);
const isEdit = computed(() => !!rowId.value);
const { items: typeItems } = useDict('sys_menu_type');

const availableTypes = computed(() => {
  const parentId = form.value.parentId;
  const resolvedParentId = parentId === ROOT_PARENT || parentId === undefined ? null : parentId;
  return getAllowedTypes(resolvedParentId, treeData.value, typeItems.value);
});

const title = computed(() => {
  if (isReadonly.value) return $t('sys.menu.detail');
  if (isEdit.value) return $t('sys.menu.edit');
  const parentId = form.value.parentId;
  const isRoot = !parentId || parentId === ROOT_PARENT;
  const parentTitle = isRoot ? '' : findNodeTitle(treeData.value, parentId);
  const actionKey = isRoot ? 'sys.menu.addRoot' : 'sys.menu.addChild';
  return `${$t(actionKey)}${parentTitle ? `「${parentTitle}」` : ''}`;
});

const treeSelectData = computed(() => buildTreeData(treeData.value, rowId.value));

function buildTreeData(nodes: MenuAdminApi.MenuItem[], excludeId?: string): { children: any[]; label: string; value: string }[] {
  const result: { children: any[]; label: string; value: string }[] = [];
  for (const node of nodes) {
    // 按钮为末级，不能作为父级菜单
    if (node.id === excludeId || node.type === 3) continue;
    result.push({
      label: node.title,
      value: node.id,
      children: node.children?.length ? buildTreeData(node.children, excludeId) : [],
    });
  }
  return result;
}

async function loadTreeData(excludeId?: string) {
  try {
    const tree = await getMenuTreeApi();
    treeData.value = excludeId ? filterTreeExclude(tree, excludeId) : tree;
  } catch {
    treeData.value = [];
  }
}

function findPathToNode(
  nodes: { children?: any[]; value: string }[],
  targetValue: string,
): string[] {
  for (const node of nodes) {
    if (node.value === targetValue) return [node.value];
    if (node.children?.length) {
      const childPath = findPathToNode(node.children, targetValue);
      if (childPath.length > 0) return [node.value, ...childPath];
    }
  }
  return [];
}

function updateTreeExpandedKeys() {
  const parentId = form.value.parentId;
  if (!parentId || parentId === ROOT_PARENT) {
    treeExpandedKeys.value = [];
    return;
  }
  const rootNodes = [{ value: ROOT_PARENT, children: treeSelectData.value }];
  treeExpandedKeys.value = findPathToNode(rootNodes, parentId);
}

function filterTreeExclude(nodes: MenuAdminApi.MenuItem[], excludeId?: string): MenuAdminApi.MenuItem[] {
  if (!excludeId) return nodes;
  return nodes
    .filter(node => node.id !== excludeId)
    .map(node => ({
      ...node,
      children: node.children?.length ? filterTreeExclude(node.children, excludeId) : [],
    }));
}

async function loadDetailForm(id: string) {
  const detail = await getMenuDetailApi(id);
  form.value = {
    ...detail,
    parentId: detail.parentId ?? ROOT_PARENT,
    badgeType: detail.badgeType ?? '',
    badgeVariants: detail.badgeVariants ?? '',
  };
}

function validate(): boolean {
  if (!form.value.title?.trim()) {
    message.warning($t('sys.menu.validate.titleRequired'));
    return false;
  }
  if (form.value.type !== 3 && !form.value.name?.trim()) {
    message.warning($t('sys.menu.validate.nameRequired'));
    return false;
  }
  if ([1, 2, 4, 5].includes(form.value.type) && !form.value.path?.trim()) {
    message.warning($t('sys.menu.validate.pathRequired'));
    return false;
  }
  if (form.value.type === 2 && !form.value.component?.trim()) {
    message.warning($t('sys.menu.validate.componentRequired'));
    return false;
  }
  if ([4, 5].includes(form.value.type) && !form.value.linkSrc?.trim()) {
    message.warning($t('sys.menu.validate.linkRequired'));
    return false;
  }
  if (form.value.type === 3 && !form.value.permission?.trim()) {
    message.warning($t('sys.menu.validate.permissionRequired'));
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validate()) return;

  drawerApi.lock();
  try {
    const submitData = {
      ...form.value,
      parentId: form.value.parentId === ROOT_PARENT ? null : form.value.parentId,
      badgeType: form.value.badgeType ?? '',
      badgeVariants: form.value.badgeVariants ?? '',
    };
    if (rowId.value) {
      await updateMenuApi({ id: rowId.value, ...submitData });
      message.success($t('sys.menu.updateSuccess'));
    } else {
      await createMenuApi(submitData);
      message.success($t('sys.menu.createSuccess'));
    }
    emit('success', {
      parentId: submitData.parentId,
      originalParentId: originalParentId.value,
    });
    drawerApi.close();
  } finally {
    drawerApi.unlock();
  }
}

function onTypeChange() {
  if (form.value.type === 3) {
    form.value.name = '';
    form.value.path = '';
    form.value.component = '';
    form.value.linkSrc = '';
  } else {
    form.value.permission = '';
  }
}

// ===== 权限码选择器（仅用于按钮类型表单） =====
const pickVisible = ref(false);

function openPickMethod() {
  pickVisible.value = true;
}

function handlePickSelect(payload: { permission: string; title: string }) {
  form.value.permission = payload.permission;
  if (payload.title && !form.value.title) {
    form.value.title = payload.title;
  }
  message.open({ type: 'success', content: $t('sys.menu.permission.picked', { permission: payload.permission }) });
}

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = drawerApi.getData<{ id?: string; isDetail?: boolean; parentId?: string }>();
    form.value = createDefaultForm();
    rowId.value = undefined;
    originalParentId.value = null;
    isReadonly.value = false;

    await loadTreeData(data?.id);

    if (data?.id) {
      rowId.value = data.id;
      isReadonly.value = data.isDetail ?? false;
      await loadDetailForm(data.id);
      originalParentId.value = form.value.parentId === ROOT_PARENT ? null : (form.value.parentId ?? null);
    } else {
      await getDictItems('sys_menu_type');
      const parentId = data?.parentId ?? null;
      const allowed = getAllowedTypes(parentId, treeData.value, typeItems.value);
      form.value = {
        ...createDefaultForm(),
        parentId: parentId ?? ROOT_PARENT,
        type: allowed[0]?.value ?? 1,
      };
    }

    updateTreeExpandedKeys();
    await nextTick();
  },
});

watch(() => form.value.parentId, updateTreeExpandedKeys);
</script>

<template>
  <Drawer :title="title" :show-confirm-button="!isReadonly && (isEdit ? canUpdate : canCreate)" width="780px" placement="right">
    <Form :model="form" layout="vertical">
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
          v-model:treeExpandedKeys="treeExpandedKeys"
          :tree-data="[{ label: $t('sys.menu.rootLevel'), value: ROOT_PARENT, children: treeSelectData }]"
          :placeholder="$t('sys.menu.placeholder.parentId')"
          allow-clear
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
          <Button @click="openPickMethod">{{ $t('sys.menu.pickMethod') }}</Button>
        </div>
      </FormItem>

      <FormItem :label="$t('sys.menu.fields.sort')">
        <InputNumber v-model:value="form.sort" class="w-full" :min="0" />
      </FormItem>

      <template v-if="form.type !== 3">
        <div class="grid grid-cols-3 gap-x-4">
          <FormItem :label="$t('sys.menu.fields.badgeType')">
            <DictSelect v-model:value="form.badgeType" code="sys_badge_type" allow-clear class="w-full" />
          </FormItem>
          <FormItem :label="$t('sys.menu.fields.badge')">
            <Input v-model:value="form.badge" :disabled="form.badgeType !== 'normal'" :placeholder="$t('sys.menu.placeholder.badge')" />
          </FormItem>
          <FormItem :label="$t('sys.menu.fields.badgeVariants')">
            <DictSelect v-model:value="form.badgeVariants" code="sys_badge_variant" allow-clear class="w-full" />
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

    <MenuPermissionModal
      v-model:visible="pickVisible"
      mode="single"
      @select="handlePickSelect"
    />
  </Drawer>
</template>
