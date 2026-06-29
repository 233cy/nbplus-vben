import type { FileApi } from '#/api/sys/file';
import type { StorageApi } from '#/api/sys/storage';

import { batchDeleteFileApi, batchMoveFileApi, getFileListApi, moveFileApi } from '#/api/sys/file';
import { getStorageOptionsApi } from '#/api/sys/storage';
import { $t } from '#/locales';
import { message } from 'ant-design-vue';
import { ref } from 'vue';

export function useFile() {
  const loading = ref(false);
  const list = ref<FileApi.FileItem[]>([]);
  const storageOptions = ref<StorageApi.StorageOptions[]>([]);

  async function loadList(params: FileApi.PageParams = {}) {
    loading.value = true;
    try {
      const res = await getFileListApi(params);
      list.value = res.items;
      return res;
    } finally {
      loading.value = false;
    }
  }

  async function loadStorageOptions() {
    storageOptions.value = await getStorageOptionsApi();
  }

  async function batchDelete(ids: string[]) {
    await batchDeleteFileApi(ids);
    message.success($t('common.deleteSuccess'));
  }

  async function move(id: string, storageCode: string) {
    await moveFileApi(id, storageCode);
    message.success($t('system.file.moveSuccess'));
  }

  async function batchMove(ids: string[], storageCode: string) {
    const res = await batchMoveFileApi(ids, storageCode);
    message.success($t('system.file.batchMoveSuccess', { count: res.count || ids.length }));
  }

  return {
    loading,
    list,
    storageOptions,
    loadList,
    loadStorageOptions,
    batchDelete,
    move,
    batchMove,
  };
}
