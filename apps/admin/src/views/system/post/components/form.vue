<script setup lang="ts">
import type { PostApi } from '#/api/system/post';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createPostApi, getPostDetailApi, updatePostApi } from '#/api/system/post';
import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import { useFormSchema } from '../schema/form';

const emit = defineEmits<{ success: [] }>();

const { hasAccessByCodes } = useAccess();
const canUpdate = computed(() => hasAccessByCodes(['system:post:update']));
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
    const values = await formApi.getValues<PostApi.SaveParams>();
    drawerApi.lock();
    try {
      await (rowId.value ? updatePostApi({ id: rowId.value, ...values }) : createPostApi(values));
      emit('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<PostApi.PostItem & { readonly?: boolean }>();
      formApi.resetForm();
      isReadonly.value = data?.readonly ?? false;
      if (data?.id) {
        rowId.value = data.id;
        await nextTick();
        // 优先使用传入的完整数据，缺失字段再调用详情接口补齐
        const detail = data.code ? data : await getPostDetailApi(data.id);
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
    :title="isReadonly ? $t('system.post.detail') : rowId ? $t('system.post.edit') : $t('system.post.create')"
    :show-confirm-button="!isReadonly && (!!rowId ? canUpdate : true)"
  >
    <Form :disabled="isReadonly" />
  </Drawer>
</template>
