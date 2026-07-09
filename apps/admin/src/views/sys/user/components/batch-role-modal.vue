<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem } from 'ant-design-vue';

import ApiSelect from '#/components/page-select/api-select.vue';
import { $t } from '#/locales';

const emit = defineEmits<{
  confirm: [roleIds: string[]];
}>();

const roleIds = ref<string[]>([]);

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onConfirm: handleSubmit,
  onOpenChange: handleOpenChange,
});

function handleOpenChange(isOpen: boolean) {
  if (!isOpen) {
    return;
  }

  roleIds.value = [];
}

function handleSubmit() {
  modalApi.setState({ loading: true });
  try {
    emit('confirm', roleIds.value);
    modalApi.close();
  } finally {
    modalApi.setState({ loading: false });
  }
}
</script>

<template>
  <Modal :title="$t('sys.user.batchRole.title')" width="520px">
    <Form layout="vertical">
      <FormItem :label="$t('sys.user.fields.roleIds')">
        <ApiSelect v-model:value="roleIds" config="role" mode="multiple" value-field="id" label-field="name" class="w-full" />
      </FormItem>
    </Form>
  </Modal>
</template>
