<script setup lang="ts">
import type { UserApi } from '#/api/sys/user';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createUserApi, updateUserApi } from '#/api/sys/user';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import { useFormSchema } from '../schema/form';

const emit = defineEmits<{ success: [] }>();

const { hasAccessByCodes } = useAccess();
const canUpdate = computed(() => hasAccessByCodes(['org:user:update']));
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
    const values = await formApi.getValues<UserApi.SaveParams>();
    drawerApi.lock();
    try {
      await (rowId.value ? updateUserApi({ id: rowId.value, ...values }) : createUserApi(values));
      emit('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<UserApi.UserItem & { readonly?: boolean }>();
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
    :title="isReadonly ? $t('system.user.detail') : rowId ? $t('system.user.edit') : $t('system.user.create')"
    :show-confirm-button="!isReadonly && (!!rowId ? canUpdate : true)"
  >
    <Form :disabled="isReadonly" />
  </Drawer>
</template>
