import type { StorageApi } from '#/api/system/storage';

import { message } from 'ant-design-vue';
import { ref } from 'vue';

import {
  batchDeleteStorageApi,
  getStorageDetailApi,
  getStorageDriverSchemasApi,
  getStorageListApi,
  setDefaultStorageApi,
  toggleStorageApi,
} from '#/api/system/storage';
import { $t } from '#/locales';

export function useStorage() {
  const loading = ref(false);
  const schemas = ref<StorageApi.DriverSchema[]>([]);

  async function loadList(params: StorageApi.PageParams = {}) {
    loading.value = true;
    try {
      const res = await getStorageListApi(params);
      return res;
    } finally {
      loading.value = false;
    }
  }

  async function loadSchemas() {
    schemas.value = await getStorageDriverSchemasApi();
  }

  async function detail(id: string) {
    return getStorageDetailApi(id);
  }

  async function toggle(id: string, status: number) {
    await toggleStorageApi(id, status);
  }

  async function setDefault(id: string) {
    await setDefaultStorageApi(id);
    message.success($t('system.storage.defaultSuccess'));
  }

  async function batchDelete(ids: string[]) {
    await batchDeleteStorageApi(ids);
    message.success($t('common.deleteSuccess'));
  }

  return {
    loading,
    schemas,
    loadList,
    loadSchemas,
    detail,
    toggle,
    setDefault,
    batchDelete,
  };
}
