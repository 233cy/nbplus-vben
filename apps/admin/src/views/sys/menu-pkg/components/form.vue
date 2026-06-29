<script setup lang="ts">
import type { MenuPkgApi } from '#/api/sys/menu-pkg';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createMenuPkgApi, getMenuPkgDetailApi, updateMenuPkgApi } from '#/api/sys/menu-pkg';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import { useFormSchema } from '../schema/form';

const emit = defineEmits<{ success: [] }>();

const { hasAccessByCodes } = useAccess();
const canUpdate = computed(() => hasAccessByCodes(['adm:sys:menuPkg:update']));
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
    const values = await formApi.getValues<MenuPkgApi.SaveParams>();
    drawerApi.lock();
    try {
      await (rowId.value ? updateMenuPkgApi({ id: rowId.value, ...values }) : createMenuPkgApi(values));
      emit('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<MenuPkgApi.MenuPkgItem & { readonly?: boolean }>();
      formApi.resetForm();
      isReadonly.value = data?.readonly ?? false;
      if (data?.id) {
        rowId.value = data.id;
        await nextTick();
        const detail = data.code ? data : await getMenuPkgDetailApi(data.id);
        formApi.setValues(detail);
      } else {
        rowId.value = undefined;
      }
    }
  },
});
</script>

<template>
  <Drawer
    :title="isReadonly ? $t('system.menuPkg.detail') : rowId ? $t('system.menuPkg.edit') : $t('system.menuPkg.create')"
    :show-confirm-button="!isReadonly && (!!rowId ? canUpdate : true)"
  >
    <Form :disabled="isReadonly" />
  </Drawer>
</template>
