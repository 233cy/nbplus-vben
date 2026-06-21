/**
 * useItemForm - 字典项新增/编辑弹窗 composable
 *
 * 负责：
 * 1. 控制字典项弹窗的打开/关闭
 * 2. 新建字典项（自动计算 sort 值为当前最大值 +10）
 * 3. 编辑已有字典项
 * 4. 删除字典项
 */

import type { Ref } from 'vue';

import type { DictApi } from '#/api/system/dict';

import { ref } from 'vue';

import { createDictItemApi, deleteDictItemApi, updateDictItemApi } from '#/api/system/dict';
import { $t } from '#/locales';
import { message } from 'ant-design-vue';

/** composable 初始化参数 */
interface UseItemFormOptions {
  /** 当前激活的字典引用（用于获取 dictId） */
  activeDict: Ref<DictApi.DictItem | null>;
  /** 字典项列表引用（用于计算新建时的 sort 值） */
  itemList: Ref<DictApi.DictItemData[]>;
  /** 重新加载字典项的回调 */
  reloadItems: (dictId: string) => Promise<void>;
}

export function useItemForm({ activeDict, itemList, reloadItems }: UseItemFormOptions) {
  /** 弹窗是否可见 */
  const visible = ref(false);
  /** 提交按钮 loading 状态 */
  const confirmLoading = ref(false);
  /** 当前正在编辑的字典项（null 表示新建模式） */
  const editing = ref<DictApi.DictItemData | null>(null);
  /** 表单数据 */
  const formState = ref({ label: '', value: '', color: '', remark: '', sort: 0, status: 1 });

  /**
   * 打开新建字典项弹窗
   * sort 值自动设为当前列表中最大 sort + 10，保证新增项排在最后
   */
  function openCreate() {
    if (!activeDict.value) return;
    editing.value = null;
    const maxSort = itemList.value.length > 0 ? Math.max(...itemList.value.map((i) => i.sort)) : 0;
    formState.value = { label: '', value: '', color: '', remark: '', sort: maxSort + 10, status: 1 };
    visible.value = true;
  }

  /**
   * 打开编辑字典项弹窗
   * @param item 要编辑的字典项对象
   */
  function openEdit(item: DictApi.DictItemData) {
    editing.value = item;
    formState.value = {
      label: item.label,
      value: item.value,
      color: item.color ?? '',
      remark: item.remark ?? '',
      sort: item.sort,
      status: item.status,
    };
    visible.value = true;
  }

  /**
   * 弹窗确认按钮处理
   * 根据 editing 是否为空判断是新建还是编辑，成功后自动刷新列表
   */
  async function handleOk() {
    confirmLoading.value = true;
    try {
      if (editing.value) {
        // 编辑模式
        await updateDictItemApi({ id: editing.value.id, dictId: activeDict.value!.id, ...formState.value });
        message.success($t('system.dict.itemUpdateSuccess'));
      } else {
        // 新建模式
        await createDictItemApi({ dictId: activeDict.value!.id, ...formState.value });
        message.success($t('system.dict.itemCreateSuccess'));
      }
      visible.value = false;
      await reloadItems(activeDict.value!.id);
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 删除字典项
   * @param item 要删除的字典项对象
   */
  async function handleDelete(item: DictApi.DictItemData) {
    await deleteDictItemApi(item.id);
    message.success($t('system.dict.itemDeleteSuccess'));
    await reloadItems(activeDict.value!.id);
  }

  return {
    /** 弹窗可见状态 */
    visible,
    /** 提交 loading */
    confirmLoading,
    /** 当前编辑对象（null=新建） */
    editing,
    /** 表单状态 */
    formState,
    /** 打开新建弹窗 */
    openCreate,
    /** 打开编辑弹窗 */
    openEdit,
    /** 确认提交 */
    handleOk,
    /** 删除字典项 */
    handleDelete,
  };
}
