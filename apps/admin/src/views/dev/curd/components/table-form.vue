<script setup lang="ts">
import type { CurdAdminApi } from '#/api/admin/dev/curdAdmin';

import { computed, nextTick } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';

import { useTableForm } from '../composables/useTableForm';
import { useTableFormSchema } from '../schema/form';

const emit = defineEmits<{ success: [] }>();

const tableForm = useTableForm({ onSuccess: () => emit('success') });

const [Form, formApi] = useVbenForm({
  schema: computed(() =>
    useTableFormSchema({
      connectionOptions: tableForm.connectionOptions.value,
      tableNameOptions: tableForm.tableNameOptions.value,
      tableNamesLoading: tableForm.tableNamesLoading.value,
      onConnectionChange: (connection: string) => tableForm.onConnectionChange(connection, formApi),
    }),
  ) as any,
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues<CurdAdminApi.TableSaveParams & { id?: string }>();
    await tableForm.handleSubmit(values);
    modalApi.close();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    modalApi.setState({ title: tableForm.title.value });
    const data = modalApi.getData<{ row?: CurdAdminApi.CurdTable }>();
    const values = data?.row ? await tableForm.getEditValues(data.row) : await tableForm.getCreateValues();
    await nextTick();
    formApi.resetForm();
    formApi.setValues(values);
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
