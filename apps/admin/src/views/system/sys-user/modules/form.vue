<script setup lang="ts">
import type { SysUserApi } from '#/api/system/sys-user';

import { computed, nextTick, ref } from 'vue';

import { useAccess } from '#/composables/use-access';
import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createSysUserApi, updateSysUserApi } from '#/api/system/sys-user';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits<{ success: [] }>();

const { hasAccessByCodes } = useAccess();
const systemSysUserResource = 'system:sys-user';
const canUpdate = computed(() => hasAccessByCodes([systemSysUserResource + ':update']));

const rowId = ref<string | undefined>();
const isReadonly = ref(false);

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues<SysUserApi.SaveParams>();
    drawerApi.lock();
    try {
      await (rowId.value
        ? updateSysUserApi({ id: rowId.value, ...values })
        : createSysUserApi(values));
      emit('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<SysUserApi.SysUserItem & { readonly?: boolean }>();
      formApi.resetForm();
      isReadonly.value = data?.readonly ?? false;
      if (data?.id) {
        rowId.value = data.id;
        await nextTick();
        formApi.setValues(data);
      } else {
        rowId.value = undefined;
      }
    }
  },
});
</script>

<template>
  <Drawer
    :title="isReadonly ? $t('system.sys-user.detail') : (rowId ? $t('system.sys-user.edit') : $t('system.sys-user.create'))"
    :show-confirm-button="!isReadonly && (!!rowId ? canUpdate : true)"
  >
    <Form :disabled="isReadonly" />
  </Drawer>
</template>
