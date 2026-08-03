import type { CurdAdminApi } from '#/api/dev/curdAdmin';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { getCurdFieldListApi, saveCurdFieldsApi, syncCurdFieldsApi } from '#/api/dev/curdAdmin';
import { getDictOptionsApi } from '#/api/sys/dict';
import { $t } from '#/locales';

import { createDefaultField } from '../data';

/**
 * useFieldForm - 字段配置弹窗逻辑
 *
 * 负责：
 * 1. 控制字段配置弹窗状态
 * 2. 加载字段列表与字典选项
 * 3. 新增/删除字段、从数据库同步、保存字段
 */
export function useFieldForm() {
  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const currentTable = ref<CurdAdminApi.CurdTable | null>(null);
  const fields = ref<CurdAdminApi.CurdField[]>([]);
  const dictOptions = ref<{ label: string; value: string }[]>([]);

  const title = computed(() => (currentTable.value ? `${currentTable.value.title} - ${$t('dev.curd.field.title')}` : $t('dev.curd.field.title')));

  async function loadDicts() {
    const list = await getDictOptionsApi();
    dictOptions.value = list.map(d => ({
      label: `${d.name}（${d.code}）`,
      value: d.code,
    }));
  }

  async function open(row: CurdAdminApi.CurdTable) {
    currentTable.value = row;
    visible.value = true;
    loading.value = true;
    try {
      const [fieldList] = await Promise.all([getCurdFieldListApi(row.id), dictOptions.value.length === 0 ? loadDicts() : Promise.resolve()]);
      fields.value = fieldList;
    } finally {
      loading.value = false;
    }
  }

  function addField() {
    if (!currentTable.value) return;
    const sort = (fields.value.length + 1) * 10;
    fields.value.push(createDefaultField(currentTable.value.id, sort));
  }

  function removeField(index: number) {
    fields.value.splice(index, 1);
  }

  async function syncFields() {
    if (!currentTable.value) return;
    loading.value = true;
    try {
      const synced = await syncCurdFieldsApi(currentTable.value.id);
      fields.value = synced;
      message.success($t('dev.curd.syncSuccess'));
    } finally {
      loading.value = false;
    }
  }

  async function saveFields() {
    if (!currentTable.value) return;
    saving.value = true;
    try {
      await saveCurdFieldsApi(currentTable.value.id, fields.value);
      message.success($t('dev.curd.updateSuccess'));
    } finally {
      saving.value = false;
    }
  }

  return {
    visible,
    loading,
    saving,
    currentTable,
    fields,
    dictOptions,
    title,
    open,
    addField,
    removeField,
    syncFields,
    saveFields,
  };
}
