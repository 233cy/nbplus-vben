import type { FileApi } from '#/api/sys/file';

import { batchDeleteFileApi, batchMoveFileApi, getFileListApi, moveFileApi } from '#/api/sys/file';
import { $t } from '#/locales';
import { message } from 'ant-design-vue';
import { ref } from 'vue';

export function useFile() {
  const loading = ref(false);
  const list = ref<FileApi.FileItem[]>([]);

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

  async function batchDelete(ids: string[]) {
    await batchDeleteFileApi(ids);
    message.success($t('common.deleteSuccess'));
  }

  async function move(id: string, storageCode: string) {
    await moveFileApi(id, storageCode);
    message.success($t('sys.file.moveSuccess'));
  }

  async function batchMove(ids: string[], storageCode: string) {
    // 异步任务化：接口仅创建任务，真实成败以任务中心执行结果为准
    await batchMoveFileApi(ids, storageCode);
    message.success($t('sys.file.batchMoveDispatched'));
  }

  return {
    loading,
    list,
    loadList,
    batchDelete,
    move,
    batchMove,
  };
}
