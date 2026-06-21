/**
 * useDictForm - 字典类型新增/编辑弹窗 composable
 *
 * 负责：
 * 1. 控制弹窗的打开/关闭
 * 2. 新建字典（可指定分组）
 * 3. 编辑已有字典
 * 4. 删除字典
 * 5. 提供分组选项列表（从现有字典中提取去重）
 */

import type { Ref } from 'vue';

import type { DictApi } from '#/api/system/dict';

import { computed, ref } from 'vue';

import { createDictApi, deleteDictApi, updateDictApi } from '#/api/system/dict';
import { $t } from '#/locales';
import { message } from 'ant-design-vue';

/** composable 初始化参数 */
interface UseDictFormOptions {
  /** 当前激活的字典引用（编辑后需要同步更新） */
  activeDict: Ref<DictApi.DictItem | null>;
  /** 所有字典数据引用（用于提取分组选项） */
  allDicts: Ref<DictApi.DictItem[]>;
  /** 清除选中状态的回调（删除当前选中字典时调用） */
  clearSelection: () => void;
  /** 重新加载字典列表的回调 */
  reload: () => Promise<void>;
}

export function useDictForm({ allDicts, activeDict, reload, clearSelection }: UseDictFormOptions) {
  /** 弹窗是否可见 */
  const visible = ref(false);
  /** 提交按钮 loading 状态 */
  const confirmLoading = ref(false);
  /** 当前正在编辑的字典（null 表示新建模式） */
  const editing = ref<DictApi.DictItem | null>(null);
  /** 表单数据 */
  const formState = ref({ name: '', code: '', groups: '', remark: '', status: 1 });

  /**
   * 分组下拉选项
   * 从所有字典中提取已有的分组名称，去重后作为选项
   */
  const groupOptions = computed(() =>
    [...new Set(allDicts.value.map((d) => d.groups).filter(Boolean))].map((g) => ({
      label: g,
      value: g,
    })),
  );

  /**
   * 打开新建字典弹窗
   * @param groupName 可选，指定默认分组（从分组节点的"+"按钮触发时传入）
   */
  function openCreate(groupName?: string) {
    editing.value = null;
    formState.value = {
      name: '',
      code: '',
      groups: groupName && groupName !== $t('system.dict.defaultGroup') ? groupName : '',
      remark: '',
      status: 1,
    };
    visible.value = true;
  }

  /**
   * 打开编辑字典弹窗
   * @param dict 要编辑的字典对象
   */
  function openEdit(dict: DictApi.DictItem) {
    editing.value = dict;
    formState.value = {
      name: dict.name,
      code: dict.code,
      groups: dict.groups ?? '',
      remark: dict.remark ?? '',
      status: dict.status,
    };
    visible.value = true;
  }

  /**
   * 弹窗确认按钮处理
   * 根据 editing 是否为空判断是新建还是编辑
   */
  async function handleOk() {
    confirmLoading.value = true;
    try {
      if (editing.value) {
        // 编辑模式
        await updateDictApi({ id: editing.value.id, ...formState.value });
        message.success($t('system.dict.updateSuccess'));
        // 如果编辑的是当前激活的字典，同步更新右侧面板数据
        if (activeDict.value?.id === editing.value.id) {
          activeDict.value = { ...activeDict.value, ...formState.value };
        }
      } else {
        // 新建模式
        await createDictApi(formState.value);
        message.success($t('system.dict.createSuccess'));
      }
      visible.value = false;
      await reload();
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 删除字典
   * 如果删除的是当前选中的字典，会清除右侧面板状态
   * @param dict 要删除的字典对象
   */
  async function handleDelete(dict: DictApi.DictItem) {
    await deleteDictApi(dict.id);
    message.success($t('system.dict.deleteSuccess'));
    // 如果删除的是当前激活的字典，清除选中状态
    if (activeDict.value?.id === dict.id) {
      clearSelection();
    }
    await reload();
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
    /** 分组选项列表 */
    groupOptions,
    /** 打开新建弹窗 */
    openCreate,
    /** 打开编辑弹窗 */
    openEdit,
    /** 确认提交 */
    handleOk,
    /** 删除字典 */
    handleDelete,
  };
}
