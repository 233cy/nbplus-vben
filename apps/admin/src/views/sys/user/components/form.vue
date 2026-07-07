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

function buildUserOrgValue(data?: UserApi.UserItem): UserApi.UserOrgValue {
  if (!data) {
    return {};
  }

  return {
    deptId: data.deptId,
    dutyId: data.dutyId,
    deptDuties: data.deptDuties || [],
  };
}

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues<UserApi.SaveParams & { userOrg?: UserApi.UserOrgValue }>();
    const { userOrg, ...rest } = values;
    const payload: UserApi.SaveParams = {
      ...rest,
      deptId: userOrg?.deptId,
      dutyId: userOrg?.dutyId,
      deptDuties: userOrg?.deptDuties,
    };

    drawerApi.lock();
    try {
      await (rowId.value ? updateUserApi({ id: rowId.value, ...payload }) : createUserApi(payload));
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
        formApi.setValues({
          ...data,
          userOrg: buildUserOrgValue(data),
        });
      } else {
        rowId.value = undefined;
      }
    }
  },
});
</script>

<template>
  <Drawer :title="isReadonly ? $t('sys.user.detail') : rowId ? $t('sys.user.edit') : $t('sys.user.create')" :show-confirm-button="!isReadonly && (!!rowId ? canUpdate : true)">
    <Form :disabled="isReadonly" />
  </Drawer>
</template>
