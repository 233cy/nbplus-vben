import type { CurdAdminApi } from '#/api/dev/curdAdmin';

import { computed, onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { createCurdTableApi, getCurdConnectionsApi, getCurdTablesApi, updateCurdTableApi } from '#/api/dev/curdAdmin';
import { $t } from '#/locales';

import { createDefaultTableForm } from '../data';

export interface UseTableFormOptions {
  onSuccess: () => void;
}

/**
 * useTableForm - 表配置新增/编辑业务逻辑
 *
 * 负责：
 * 1. 加载数据库连接与表名选项
 * 2. 提供表单初始值
 * 3. 提交表单（新增/编辑）并触发成功回调
 */
export function useTableForm(options: UseTableFormOptions) {
  const { onSuccess } = options;

  const isEdit = ref(false);
  const connectionOptions = ref<{ label: string; value: string }[]>([]);
  const tableNameOptions = ref<{ label: string; value: string }[]>([]);
  const tableNamesLoading = ref(false);

  const title = computed(() => (isEdit.value ? $t('dev.curd.table.edit') : $t('dev.curd.table.add')));

  onMounted(loadConnections);

  async function loadConnections() {
    const connections = await getCurdConnectionsApi();
    connectionOptions.value = connections.map(c => ({ label: c, value: c }));
  }

  async function loadTableNames(connection: string) {
    tableNamesLoading.value = true;
    try {
      const tables = await getCurdTablesApi(connection);
      tableNameOptions.value = tables.map(t => ({ label: t, value: t }));
    } finally {
      tableNamesLoading.value = false;
    }
  }

  function onConnectionChange(connection: string, formApi: { setFieldValue: (field: string, value: any) => void }) {
    formApi.setFieldValue('tableName', '');
    return loadTableNames(connection);
  }

  async function getCreateValues() {
    isEdit.value = false;
    await loadTableNames('default');
    return createDefaultTableForm();
  }

  async function getEditValues(row: CurdAdminApi.CurdTable) {
    isEdit.value = true;
    await loadTableNames(row.dbConnection || 'default');
    return {
      id: row.id,
      title: row.title,
      tableName: row.tableName,
      dbConnection: row.dbConnection,
      module: row.module,
      className: row.className,
      routePrefix: row.routePrefix,
      author: row.author ?? '',
      remark: row.remark ?? '',
      status: row.status,
    };
  }

  async function handleSubmit(values: CurdAdminApi.TableSaveParams & { id?: string }) {
    if (isEdit.value && values.id) {
      await updateCurdTableApi(values as CurdAdminApi.TableSaveParams & { id: string });
      message.success($t('dev.curd.updateSuccess'));
    } else {
      await createCurdTableApi(values);
      message.success($t('dev.curd.createSuccess'));
    }
    onSuccess();
  }

  return {
    isEdit,
    title,
    connectionOptions,
    tableNameOptions,
    tableNamesLoading,
    loadConnections,
    loadTableNames,
    onConnectionChange,
    getCreateValues,
    getEditValues,
    handleSubmit,
  };
}
