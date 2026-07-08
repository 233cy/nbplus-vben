<script setup lang="ts">
import type { DictApi } from '#/api/sys/dict';

import { computed, ref, watch } from 'vue';

import { Form, FormItem, Input, Modal, Select, Tag } from 'ant-design-vue';

import { createDictItemApi, updateDictItemApi } from '#/api/sys/dict';
import { $t } from '#/locales';

import { createColorOptions } from '../data';

interface ItemFormModel {
  color: string;
  label: string;
  remark: string;
  sort: number;
  status: number;
  value: string;
}

const props = defineProps<{
  data: null | DictApi.DictItemData;
  dictId: string;
  dictName: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });

const loading = ref(false);
const form = ref<ItemFormModel>({
  label: '',
  value: '',
  color: '',
  remark: '',
  sort: 0,
  status: 1,
});

const isEdit = computed(() => !!props.data);

watch(
  () => props.data,
  (val) => {
    if (val) {
      form.value = {
        label: val.label,
        value: val.value,
        color: val.color ?? '',
        remark: val.remark ?? '',
        sort: val.sort,
        status: val.status,
      };
    } else {
      form.value = { label: '', value: '', color: '', remark: '', sort: 0, status: 1 };
    }
  },
  { immediate: true },
);

const statusOptions = [
  { label: $t('common.enabled'), value: 1 },
  { label: $t('common.disabled'), value: 2 },
];

const colorOptions = createColorOptions($t);

async function handleOk() {
  loading.value = true;
  try {
    if (isEdit.value && props.data) {
      await updateDictItemApi({ id: props.data.id, dictId: props.dictId, ...form.value });
    } else {
      await createDictItemApi({ dictId: props.dictId, ...form.value });
    }
    emit('success');
    visible.value = false;
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="isEdit ? $t('sys.dict.editItem') : $t('sys.dict.addItem')"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="mb-2 text-sm text-gray-500">
      {{ $t('sys.dict.itemFormBelong', { name: dictName }) }}
    </div>
    <Form :model="form" layout="vertical" class="mt-2">
      <FormItem :label="$t('sys.dict.itemFields.label')" required>
        <Input v-model:value="form.label" />
      </FormItem>
      <FormItem :label="$t('sys.dict.itemFields.value')" required>
        <Input v-model:value="form.value" />
      </FormItem>
      <FormItem :label="$t('sys.dict.itemFields.color')">
        <Select v-model:value="form.color" :options="colorOptions" allow-clear>
          <template #option="{ label, value: val }">
            <span v-if="val"><Tag :color="val">{{ label }}</Tag></span>
            <span v-else>{{ label }}</span>
          </template>
        </Select>
      </FormItem>
      <FormItem :label="$t('sys.dict.fields.status')">
        <Select v-model:value="form.status" :options="statusOptions" />
      </FormItem>
      <FormItem :label="$t('sys.dict.fields.remark')">
        <Input v-model:value="form.remark" />
      </FormItem>
      <FormItem :label="$t('sys.dict.itemFields.sort')">
        <Input v-model:value="form.sort" type="number" />
      </FormItem>
    </Form>
  </Modal>
</template>
