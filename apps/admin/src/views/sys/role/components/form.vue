<script setup lang="ts">
import type { RoleApi } from '#/api/sys/role';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createRoleApi, getRoleDetailApi, updateRoleApi } from '#/api/sys/role';
import { $t } from '#/locales';

import { useRolePermission } from '../permissions';
import { useFormSchema } from '../schema/form';

const emit = defineEmits<{ success: [] }>();

const permission = useRolePermission();
const canUpdate = computed(() => permission.canUpdate);
const rowId = ref<string | undefined>();
const isReadonly = ref(false);
const isEdit = computed(() => !!rowId.value);

const [Form, formApi] = useVbenForm({
  schema: computed(() => useFormSchema(isEdit.value)) as any,
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues<RoleApi.SaveParams>();
    drawerApi.lock();
    try {
      await (rowId.value ? updateRoleApi({ id: rowId.value, ...values }) : createRoleApi(values));
      emit('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<RoleApi.RoleItem & { readonly?: boolean }>();
      formApi.resetForm();
      isReadonly.value = data?.readonly ?? false;
      if (data?.id) {
        rowId.value = data.id;
        await nextTick();
        const detail = data.code ? data : await getRoleDetailApi(data.id);
        formApi.setValues(detail);
      } else {
        rowId.value = undefined;
      }
    }
  },
});
</script>

<template>
  <Drawer :title="isReadonly ? $t('sys.role.detail') : rowId ? $t('sys.role.edit') : $t('sys.role.create')" :show-confirm-button="!isReadonly && (!!rowId ? canUpdate : true)">
    <Form :disabled="isReadonly" />
  </Drawer>
</template>
