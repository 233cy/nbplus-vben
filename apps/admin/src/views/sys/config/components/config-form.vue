<script setup lang="ts">
import type { ConfigApi } from '#/api/sys/config';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { Form, FormItem, Input, Select, Switch, Textarea } from 'ant-design-vue';

import { createConfigApi, getConfigOptionsApi, updateConfigApi } from '#/api/sys/config';
import CreatableSelect from '#/components/creatable-select/index.vue';
import { $t } from '#/locales';

import { COMPONENT_OPTIONS } from '../data';
import ConfigValueInput from './config-value-input.vue';

const emit = defineEmits<{
  success: [];
}>();

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const row = drawerApi.getData<ConfigApi.ConfigItem>();
    allOptions.value = await getConfigOptionsApi();
    if (row?.id) {
      form.value = {
        groups: row.groups,
        key: row.key,
        label: row.label,
        value: row.value ?? '',
        component: row.component,
        isEncrypted: row.isEncrypted,
        isPublic: row.isPublic,
        isSys: row.isSys,
        sort: row.sort,
        remark: row.remark ?? '',
      };
      rowId.value = row.id;
    } else {
      form.value = {
        groups: '',
        key: '',
        label: '',
        value: '',
        component: 'Input',
        isEncrypted: false,
        isPublic: false,
        isSys: false,
        sort: 0,
        remark: '',
      };
      rowId.value = undefined;
    }
  },
});

const loading = ref(false);
const rowId = ref<string | undefined>();
const allOptions = ref<ConfigApi.GroupOption[]>([]);

const form = ref<ConfigApi.CreateParams & { isSys?: boolean }>({
  groups: '',
  key: '',
  label: '',
  value: '',
  component: 'Input',
  isEncrypted: false,
  isPublic: false,
  isSys: false,
  sort: 0,
  remark: '',
});

const isEdit = computed(() => !!rowId.value);

const groupOptions = computed(() => allOptions.value);

const valueInputItem = computed(() => ({
  component: form.value.component ?? 'Input',
  isEncrypted: form.value.isEncrypted ?? false,
  key: form.value.key,
  label: form.value.label,
  value: form.value.value,
  groups: form.value.groups,
  groupsLabel: form.value.groups,
  isPublic: form.value.isPublic ?? false,
  isSys: false,
  sort: form.value.sort ?? 0,
  remark: form.value.remark ?? null,
  id: rowId.value ?? '',
  createdAt: 0,
  updatedAt: 0,
} as ConfigApi.ConfigItem));

const groupRules = [{ required: true, message: $t('sys.config.placeholder.groups'), trigger: 'change' }];

async function handleSubmit() {
  loading.value = true;
  drawerApi.lock();
  try {
    if (isEdit.value && rowId.value) {
      await updateConfigApi({ id: rowId.value, ...form.value });
    } else {
      const data = { ...form.value };
      delete (data as any).isSys;
      await createConfigApi(data);
    }
    emit('success');
    drawerApi.close();
  } finally {
    loading.value = false;
    drawerApi.unlock();
  }
}
</script>

<template>
  <Drawer :title="isEdit ? $t('sys.config.editItem') : $t('sys.config.addItem')" :loading="loading" width="520">
    <Form :model="form" layout="vertical" class="mt-4">
      <FormItem :label="$t('sys.config.fields.groups')" required :rules="groupRules">
        <CreatableSelect
          v-model:value="form.groups"
          :options="groupOptions"
          :placeholder="$t('sys.config.placeholder.groups')"
        />
      </FormItem>

      <FormItem :label="$t('sys.config.fields.key')" required>
        <Input v-model:value="form.key" :disabled="isEdit" />
      </FormItem>

      <FormItem :label="$t('sys.config.fields.label')" required>
        <Input v-model:value="form.label" />
      </FormItem>

      <FormItem :label="$t('sys.config.fields.value')">
        <ConfigValueInput v-model:value="form.value" :item="valueInputItem" />
      </FormItem>

      <FormItem :label="$t('sys.config.fields.component')" required>
        <Select v-model:value="form.component" :options="COMPONENT_OPTIONS" />
      </FormItem>

      <div class="flex gap-6">
        <FormItem :label="$t('sys.config.fields.isEncrypted')">
          <Switch v-model:checked="form.isEncrypted" />
        </FormItem>
        <FormItem :label="$t('sys.config.fields.isPublic')">
          <Switch v-model:checked="form.isPublic" />
        </FormItem>
        <FormItem :label="$t('sys.config.fields.isSys')">
          <Switch v-model:checked="form.isSys" />
        </FormItem>
        <FormItem :label="$t('sys.config.fields.sort')">
          <Input v-model:value="form.sort" type="number" style="width: 80px" />
        </FormItem>
      </div>

      <FormItem :label="$t('sys.config.fields.remark')">
        <Textarea v-model:value="form.remark" :rows="2" />
      </FormItem>
    </Form>
  </Drawer>
</template>
