<script setup lang="ts">
import type { StorageApi } from '#/api/system/storage';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Form, FormItem, Select } from 'ant-design-vue';

import { $t } from '#/locales';

const emit = defineEmits<{ confirm: [ids: string[], code: string] }>();

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  onConfirm: handleConfirm,
  onOpenChange: handleOpenChange,
});

const options = ref<StorageApi.StorageOptions[]>([]);
const targetCode = ref('');
const ids = ref<string[]>([]);

function handleOpenChange(isOpen: boolean) {
  if (!isOpen) {
    return;
  }

  const data = drawerApi.getData<{ options?: StorageApi.StorageOptions[]; ids?: string[] }>();
  options.value = data?.options || [];
  ids.value = data?.ids || [];
  targetCode.value = options.value[0]?.code || '';
}

function handleConfirm() {
  if (!targetCode.value) {
    return;
  }
  drawerApi.close();
  emit('confirm', ids.value, targetCode.value);
}
</script>

<template>
  <Drawer :title="ids.length > 1 ? $t('system.file.batchMove') : $t('system.file.move')">
    <Form layout="vertical">
      <FormItem :label="$t('system.file.fields.storageCode')" required>
        <Select v-model:value="targetCode" :options="options.map((o) => ({ label: o.name, value: o.code }))" class="w-full" />
      </FormItem>
    </Form>
  </Drawer>
</template>
