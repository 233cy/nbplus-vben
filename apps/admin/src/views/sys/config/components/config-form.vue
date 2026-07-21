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
        // 开关统一 1开/2关，与后端及列表保持一致
        isEncrypted: row.isEncrypted === 1 ? 1 : 2,
        isPublic: row.isPublic === 1 ? 1 : 2,
        isSys: row.isSys === 1 ? 1 : 2,
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
        isEncrypted: 2,
        isPublic: 2,
        isSys: 2,
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

interface ConfigFormState {
  groups: string;
  key: string;
  label: string;
  value: string;
  component?: string;
  /** 1开 2关 */
  isEncrypted: number;
  /** 1开 2关 */
  isPublic: number;
  /** 1开 2关 */
  isSys?: number;
  sort?: number;
  remark?: string;
}

const form = ref<ConfigFormState>({
  groups: '',
  key: '',
  label: '',
  value: '',
  component: 'Input',
  isEncrypted: 2,
  isPublic: 2,
  isSys: 2,
  sort: 0,
  remark: '',
});

const isEdit = computed(() => !!rowId.value);

/** 详情（只读）模式：列表点击配置键进入，不显示确认按钮、表单禁用 */
const readonly = computed(() => !!drawerApi.getData<ConfigApi.ConfigItem & { readonly?: boolean }>()?.readonly);

const drawerTitle = computed(() => {
  if (readonly.value) return $t('common.detail');
  return isEdit.value ? $t('sys.config.editItem') : $t('sys.config.addItem');
});

const groupOptions = computed(() => allOptions.value);

const valueInputItem = computed(() => ({
  component: form.value.component ?? 'Input',
  isEncrypted: form.value.isEncrypted ?? 2,
  key: form.value.key,
  label: form.value.label,
  value: form.value.value,
  groups: form.value.groups,
  groupsLabel: form.value.groups,
  isPublic: form.value.isPublic ?? 2,
  isSys: 2,
  sort: form.value.sort ?? 0,
  remark: form.value.remark ?? null,
  id: rowId.value ?? '',
  createdAt: 0,
  updatedAt: 0,
} as unknown as ConfigApi.ConfigItem));

const groupRules = [{ required: true, message: $t('sys.config.placeholder.groups'), trigger: 'change' }] as any;

function buildSaveData(): ConfigApi.CreateParams | ConfigApi.UpdateParams {
  const data: Record<string, any> = { ...form.value };
  // 加密占位符 ****** 不能作为真实值落库：
  // 保持加密时不传该字段（后端原样跳过）；关闭加密时置空而不是存占位符
  if (data.value === '******') {
    if (data.isEncrypted === 1) {
      delete data.value;
    } else {
      data.value = '';
    }
  }
  if (isEdit.value && rowId.value) {
    return { id: rowId.value, ...data } as ConfigApi.UpdateParams;
  }
  const { isSys: _isSys, ...createData } = data;
  return createData as ConfigApi.CreateParams;
}

async function handleSubmit() {
  loading.value = true;
  drawerApi.lock();
  try {
    const data = buildSaveData();
    await (isEdit.value && rowId.value ? updateConfigApi(data as ConfigApi.UpdateParams) : createConfigApi(data as ConfigApi.CreateParams));
    emit('success');
    drawerApi.close();
  } finally {
    loading.value = false;
    drawerApi.unlock();
  }
}
</script>

<template>
  <Drawer :title="drawerTitle" :loading="loading" :show-confirm-button="!readonly" width="520">
    <Form :model="form" layout="vertical" class="mt-4" :disabled="readonly">
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
        <ConfigValueInput v-model="form.value" :item="valueInputItem" :readonly="readonly" />
      </FormItem>

      <FormItem :label="$t('sys.config.fields.component')" required>
        <Select v-model:value="form.component" :options="COMPONENT_OPTIONS" />
      </FormItem>

      <div class="flex gap-6">
        <FormItem :label="$t('sys.config.fields.isEncrypted')">
          <Switch v-model:checked="form.isEncrypted" :checked-value="1" :un-checked-value="2" />
        </FormItem>
        <FormItem :label="$t('sys.config.fields.isPublic')">
          <Switch v-model:checked="form.isPublic" :checked-value="1" :un-checked-value="2" />
        </FormItem>
        <FormItem :label="$t('sys.config.fields.isSys')">
          <Switch v-model:checked="form.isSys" :checked-value="1" :un-checked-value="2" />
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
