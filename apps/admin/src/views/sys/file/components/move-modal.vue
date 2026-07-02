<script setup lang="ts">
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Form, FormItem } from 'ant-design-vue';

import ApiSelect from '#/components/page-select/api-select.vue';
import { $t } from '#/locales';

const emit = defineEmits<{ confirm: [ids: string[], code: string] }>();

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  onConfirm: handleConfirm,
  onOpenChange: handleOpenChange,
});

const targetCode = ref('');
const ids = ref<string[]>([]);

function handleOpenChange(isOpen: boolean) {
  if (!isOpen) {
    return;
  }

  const data = drawerApi.getData<{ ids?: string[] }>();
  ids.value = Array.isArray(data?.ids) ? data.ids : [];
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
  <Drawer :title="ids.length > 1 ? $t('sys.file.batchMove') : $t('sys.file.move')">
    <Form layout="vertical">
      <FormItem :label="$t('sys.file.fields.storageCode')" required>
        <ApiSelect
          v-model:value="targetCode"
          config="storage"
          label-field="name"
          value-field="code"
          auto-select="first"
          class="w-full"
        />
      </FormItem>
    </Form>
  </Drawer>
</template>
