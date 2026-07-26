<script setup lang="ts">
import type { DictApi } from '#/api/sys/dict';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Form, FormItem, Input, Select } from 'ant-design-vue';

import { createDictApi, updateDictApi } from '#/api/sys/dict';
import DictSelect from '#/components/dict/DictSelect.vue';
import { $t } from '#/locales';

const emit = defineEmits<{
  success: [];
}>();

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const row = drawerApi.getData<DictApi.DictItem & { readonly?: boolean }>();
    isReadonly.value = row?.readonly ?? false;
    if (row?.id) {
      form.value = {
        name: row.name ?? '',
        code: row.code ?? '',
        groups: row.groups ?? undefined,
        remark: row.remark ?? undefined,
        status: row.status ?? 1,
      };
      rowId.value = row.id;
    } else {
      form.value = { name: '', code: '', groups: undefined, remark: undefined, status: 1 };
      rowId.value = undefined;
    }
  },
});

const loading = ref(false);
const rowId = ref<string | undefined>();
const isReadonly = ref(false);

const form = ref({
  name: '',
  code: '',
  groups: undefined as string | undefined,
  remark: undefined as string | undefined,
  status: 1,
});

const isEdit = computed(() => !!rowId.value);

const statusOptions = [
  { label: $t('common.enabled'), value: 1 },
  { label: $t('common.disabled'), value: 2 },
];

const groupRules = [{ required: true, message: $t('sys.dict.placeholder.groups'), trigger: 'change' }] as any;

async function handleSubmit() {
  loading.value = true;
  drawerApi.lock();
  try {
    await (isEdit.value && rowId.value ? updateDictApi({ id: rowId.value, ...form.value }) : createDictApi(form.value));
    emit('success');
    drawerApi.close();
  } finally {
    loading.value = false;
    drawerApi.unlock();
  }
}
</script>

<template>
  <Drawer
    :title="isReadonly ? $t('common.detail') : isEdit ? $t('sys.dict.editDict') : $t('sys.dict.addDict')"
    :loading="loading"
    :show-confirm-button="!isReadonly"
  >
    <Form :model="form" layout="vertical" class="mt-4" :disabled="isReadonly">
      <FormItem :label="$t('sys.dict.fields.name')" required>
        <Input v-model:value="form.name" :placeholder="$t('sys.dict.placeholder.name')" />
      </FormItem>
      <FormItem :label="$t('sys.dict.fields.code')" required>
        <Input
          v-model:value="form.code"
          :disabled="isEdit"
          :placeholder="$t('sys.dict.placeholder.code')"
        />
      </FormItem>
      <FormItem :label="$t('sys.dict.fields.groups')" required :rules="groupRules">
        <DictSelect
          v-model:value="form.groups"
          code="sys_dict_groups"
          :disabled="isReadonly"
          :placeholder="$t('sys.dict.placeholder.groups')"
        />
      </FormItem>
      <FormItem :label="$t('common.status')">
        <Select v-model:value="form.status" :options="statusOptions" />
      </FormItem>
      <FormItem :label="$t('sys.dict.fields.remark')">
        <Input v-model:value="form.remark" />
      </FormItem>
    </Form>
  </Drawer>
</template>
