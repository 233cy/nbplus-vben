<script setup lang="ts">
import type { DeptApi } from '#/api/sys/userDept';

import { computed, nextTick, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Button, Form, FormItem, Input, TreeSelect } from 'ant-design-vue';

import { createDeptApi, getDeptDetailApi, getDeptTreeApi, updateDeptApi } from '#/api/sys/userDept';
import { $t } from '#/locales';
import { stringToCode } from '#/utils/string-to-code';

import { useUserDeptPermission } from '../permissions';

import { buildParentTreeData, createDefaultForm, ROOT_PARENT } from '../data';

interface FormSuccessPayload {
  parentId?: null | string;
  originalParentId?: null | string;
}

const emit = defineEmits<{ success: [payload: FormSuccessPayload] }>();

const permission = useUserDeptPermission();
const canCreate = computed(() => permission.canCreate);
const canUpdate = computed(() => permission.canUpdate);

const form = ref<DeptApi.SaveParams & { id?: string }>(createDefaultForm());
const treeData = ref<{ children: any[]; label: string; value: string }[]>([]);
const treeExpandedKeys = ref<string[]>([]);
const treeLoading = ref(false);
const rowId = ref<string | undefined>();
const originalParentId = ref<null | string>(null);
const isReadonly = ref(false);
const isEdit = computed(() => !!rowId.value);

const title = computed(() => {
  if (isReadonly.value) return $t('sys.user-dept.detail');
  if (isEdit.value) return $t('sys.user-dept.edit');
  const parentId = form.value.parentId;
  const isRoot = !parentId || parentId === ROOT_PARENT;
  return isRoot ? $t('sys.user-dept.addRoot') : $t('sys.user-dept.addChild');
});

async function loadTreeData(excludeId?: string) {
  treeLoading.value = true;
  try {
    const { items } = await getDeptTreeApi();
    treeData.value = buildParentTreeData(items, excludeId);
    updateTreeExpandedKeys();
  } finally {
    treeLoading.value = false;
  }
}

async function loadDetailForm(id: string) {
  const detail = await getDeptDetailApi(id);
  form.value = {
    id: detail.id,
    parentId: detail.parentId ?? ROOT_PARENT,
    name: detail.name,
    code: detail.code ?? undefined,
    leaderId: detail.leaderId ?? undefined,
    phone: detail.phone ?? undefined,
    email: detail.email ?? undefined,
    status: detail.status,
  };
  originalParentId.value = detail.parentId ?? null;
}

function findPathToNode(nodes: { children?: any[]; value: string }[], targetValue: string): string[] {
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
  const rootNodes = [{ value: ROOT_PARENT, children: treeData.value }];
  treeExpandedKeys.value = findPathToNode(rootNodes, parentId);
}

function generateCodeFromName() {
  form.value.code = stringToCode(form.value.name ?? '');
}

function validate(): boolean {
  if (!form.value.name?.trim()) {
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (isReadonly.value) {
    drawerApi.close();
    return;
  }
  if (!validate()) return;

  drawerApi.lock();
  try {
    const data: DeptApi.SaveParams & { id?: string } = {
      ...form.value,
      parentId: form.value.parentId === ROOT_PARENT ? null : form.value.parentId,
      name: form.value.name.trim(),
      leaderId: form.value.leaderId?.trim() || undefined,
      phone: form.value.phone?.trim() || undefined,
      email: form.value.email?.trim() || undefined,
    };

    if (isEdit.value && data.id) {
      delete (data as any).code;
      await updateDeptApi(data as DeptApi.SaveParams & { id: string });
    } else {
      data.code = form.value.code?.trim();
      await createDeptApi(data);
    }

    emit('success', {
      parentId: data.parentId,
      originalParentId: originalParentId.value,
    });
    drawerApi.close();
  } finally {
    drawerApi.unlock();
  }
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
    } else {
      const parentId = data?.parentId ?? null;
      form.value = {
        ...createDefaultForm(),
        parentId: parentId ?? ROOT_PARENT,
      };
      updateTreeExpandedKeys();
    }

    await nextTick();
  },
});

watch(() => form.value.parentId, updateTreeExpandedKeys);
</script>

<template>
  <Drawer :title="title" :show-confirm-button="!isReadonly && (isEdit ? canUpdate : canCreate)" width="780px" placement="right">
    <Form :model="form" layout="vertical">
      <FormItem :label="$t('sys.user-dept.fields.parentId')">
        <TreeSelect
          v-model:value="form.parentId"
          v-model:tree-expanded-keys="treeExpandedKeys"
          :tree-data="[{ label: $t('sys.user-dept.rootLevel'), value: ROOT_PARENT, children: treeData }]"
          :loading="treeLoading"
          :allow-clear="true"
          :disabled="isReadonly"
          :placeholder="$t('sys.user-dept.placeholder.parentId')"
          class="w-full"
        />
      </FormItem>

      <FormItem :label="$t('sys.user-dept.fields.name')" required>
        <Input v-model:value="form.name" :disabled="isReadonly" :placeholder="$t('sys.user-dept.placeholder.name')" />
      </FormItem>

      <FormItem :label="$t('sys.user-dept.fields.code')">
        <Input v-model:value="form.code" :disabled="isReadonly || isEdit" :placeholder="$t('sys.user-dept.placeholder.code')">
          <template v-if="!isEdit && !isReadonly" #addonAfter>
            <Button type="link" size="small" @click="generateCodeFromName">
              {{ $t('sys.user-dept.generateCode') }}
            </Button>
          </template>
        </Input>
      </FormItem>

      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('sys.user-dept.fields.leaderId')">
          <Input v-model:value="form.leaderId" :disabled="isReadonly" :placeholder="$t('sys.user-dept.placeholder.leaderId')" />
        </FormItem>
        <FormItem :label="$t('common.status')">
          <DictSelect v-model:value="form.status" :disabled="isReadonly" code="is_enable" class="w-full" />
        </FormItem>
      </div>

      <div class="grid grid-cols-2 gap-x-4">
        <FormItem :label="$t('sys.user-dept.fields.phone')">
          <Input v-model:value="form.phone" :disabled="isReadonly" :placeholder="$t('sys.user-dept.placeholder.phone')" />
        </FormItem>
        <FormItem :label="$t('sys.user-dept.fields.email')">
          <Input v-model:value="form.email" :disabled="isReadonly" :placeholder="$t('sys.user-dept.placeholder.email')" />
        </FormItem>
      </div>
    </Form>
  </Drawer>
</template>
