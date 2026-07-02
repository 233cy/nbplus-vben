<script setup lang="ts">
import type { ConfigApi } from '#/api/sys/config';

import { Form, FormItem, Input, Modal, Select, Switch, Textarea } from 'ant-design-vue';

import CreatableSelect from '#/components/creatable-select/index.vue';
import { $t } from '#/locales';

interface Props {
  mode: 'create' | 'edit';
  loading: boolean;
  editingIsSys: boolean;
  componentOptions: { label: string; value: string }[];
  groupOptions: { label: string; value: string }[];
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'submit'): void;
}>();
const visible = defineModel<boolean>('visible', { required: true });
const form = defineModel<ConfigApi.CreateParams>('form', { required: true });
</script>

<template>
  <Modal v-model:open="visible" :title="mode === 'create' ? $t('sys.config.addItem') : $t('sys.config.editItem')" :confirm-loading="loading" @ok="emit('submit')">
    <Form :model="form" layout="vertical" class="mt-4">
      <FormItem :label="$t('sys.config.fields.groups')" required>
        <CreatableSelect v-model:value="form.groups" :options="groupOptions" :disabled="editingIsSys" :add-placeholder="$t('sys.config.fields.groups')" />
      </FormItem>

      <FormItem v-if="mode === 'create'" :label="$t('sys.config.fields.key')" required>
        <Input v-model:value="form.key" />
      </FormItem>
      <FormItem v-else :label="$t('sys.config.fields.key')">
        <Input v-model:value="form.key" disabled />
      </FormItem>

      <FormItem :label="$t('sys.config.fields.label')" required>
        <Input v-model:value="form.label" />
      </FormItem>

      <FormItem :label="$t('sys.config.fields.component')">
        <Select v-model:value="form.component" :options="componentOptions" />
      </FormItem>

      <div class="flex gap-6">
        <FormItem :label="$t('sys.config.fields.isEncrypted')">
          <Switch v-model:checked="form.isEncrypted" />
        </FormItem>
        <FormItem :label="$t('sys.config.fields.isPublic')">
          <Switch v-model:checked="form.isPublic" />
        </FormItem>
        <FormItem :label="$t('sys.config.fields.sort')">
          <Input v-model:value="form.sort" type="number" style="width: 80px" />
        </FormItem>
      </div>

      <FormItem :label="$t('sys.config.fields.remark')">
        <Textarea v-model:value="form.remark" :rows="2" />
      </FormItem>
    </Form>
  </Modal>
</template>
