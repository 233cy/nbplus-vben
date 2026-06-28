<script setup lang="ts">
import type { ConfigApi } from '#/api/admin/sys/config';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Drawer, Form, FormItem, message, Spin } from 'ant-design-vue';

import { getConfigListApi, saveConfigApi } from '#/api/admin/sys/config';
import { $t } from '#/locales';

import ConfigValueInput from '../components/config-value-input.vue';

export type SaveConfigApi = (items: ConfigApi.SaveItem[]) => Promise<any>;

interface Props {
  /** 配置分组标识 */
  group: string;
  /** 抽屉标题，默认取分组名 */
  title?: string;
  /** 只展示指定 key 的配置项 */
  keys?: string[];
  /** 自定义保存接口，默认使用系统参数批量保存 */
  saveApi?: SaveConfigApi;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  keys: undefined,
  saveApi: undefined,
});

const emit = defineEmits<{
  saved: [];
}>();

const open = defineModel<boolean>('open', { required: true });

const loading = ref(false);
const saving = ref(false);
const rawItems = ref<ConfigApi.ConfigItem[]>([]);
const editValues = ref<Record<string, string>>({});

const drawerTitle = computed(() => props.title || props.group);

const displayItems = computed(() => {
  if (!props.keys || props.keys.length === 0) {
    return rawItems.value;
  }
  return rawItems.value.filter(item => props.keys!.includes(item.key));
});

async function loadConfig() {
  if (!props.group) {
    return;
  }

  loading.value = true;
  try {
    const items = await getConfigListApi(props.group);
    rawItems.value = items;

    const values: Record<string, string> = {};
    for (const item of items) {
      values[item.key] = item.value ?? '';
    }
    editValues.value = values;
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    const payload: ConfigApi.SaveItem[] = displayItems.value.map(item => ({
      key: item.key,
      value: editValues.value[item.key] ?? '',
    }));

    const api = props.saveApi || saveConfigApi;
    await api(payload);
    message.success($t('system.config.saveSuccess'));
    emit('saved');
    open.value = false;
  } finally {
    saving.value = false;
  }
}

watch(open, val => {
  if (val) {
    loadConfig();
  }
});

watch(
  () => props.group,
  () => {
    if (open.value) {
      loadConfig();
    }
  },
);
</script>

<template>
  <Drawer v-model:open="open" :title="drawerTitle" width="420" :footer-style="{ textAlign: 'right' }">
    <Spin :spinning="loading">
      <Form layout="vertical">
        <FormItem v-for="item in displayItems" :key="item.key" :label="item.label">
          <ConfigValueInput v-model="editValues[item.key]" :item="item" />

          <p v-if="item.remark" class="mt-1 text-xs text-gray-400">
            {{ item.remark }}
          </p>
        </FormItem>
      </Form>
    </Spin>

    <template #footer>
      <Button class="mr-2" @click="open = false">
        {{ $t('common.cancel') }}
      </Button>
      <Button type="primary" :loading="saving" @click="handleSave">
        <IconifyIcon icon="ant-design:save-outlined" class="mr-1 size-4" />
        {{ $t('system.config.save') }}
      </Button>
    </template>
  </Drawer>
</template>
