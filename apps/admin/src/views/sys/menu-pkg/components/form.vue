<script setup lang="ts">
import type { MenuPkgApi } from '#/api/sys/menuPkg';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createMenuPkgApi, getMenuPkgDetailApi, updateMenuPkgApi } from '#/api/sys/menuPkg';
import { $t } from '#/locales';

import { useMenuPkgPermission } from '../permissions';
import { useFormSchema } from '../schema/form';

const emit = defineEmits<{ success: [] }>();

const permission = useMenuPkgPermission();
const canUpdate = computed(() => permission.canUpdate);
const rowId = ref<string | undefined>();
const isReadonly = ref(false);
const isEdit = computed(() => !!rowId.value);

const [Form, formApi] = useVbenForm(
  reactive({
    schema: computed(() => useFormSchema(isEdit.value)),
    showDefaultActions: false,
  }) as any,
);

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
    :title="isReadonly ? $t('sys.menu-pkg.detail') : rowId ? $t('sys.menu-pkg.edit') : $t('sys.menu-pkg.create')"
    :show-confirm-button="!isReadonly && (!!rowId ? canUpdate : true)"
  >
    <Form :disabled="isReadonly" />
  </Drawer>
</template>
