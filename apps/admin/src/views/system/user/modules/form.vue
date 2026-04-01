<script setup lang="ts">
import type { UserApi } from '#/api/system/user';

import { nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createUserApi, updateUserApi } from '#/api/system/user';

import { useFormSchema } from '../data';

const emit = defineEmits<{ success: [] }>();

const rowId = ref<string | undefined>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues<UserApi.SaveParams>();
    drawerApi.lock();
    try {
      await (rowId.value
        ? updateUserApi({ id: rowId.value, ...values })
        : createUserApi(values));
      emit('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<UserApi.UserItem>();
      formApi.resetForm();
      if (data?.id) {
        rowId.value = data.id;
        formApi.updateSchema([{ fieldName: 'password', rules: '' }]);
        await nextTick();
        formApi.setValues(data);
      } else {
        rowId.value = undefined;
        formApi.updateSchema([{ fieldName: 'password', rules: 'required' }]);
      }
    }
  },
});
</script>

<template>
  <Drawer :title="rowId ? '编辑用户管理' : '新增用户管理'">
    <Form />
  </Drawer>
</template>
