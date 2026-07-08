import type { DeptApi } from '#/api/sys/userDept';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { createDeptApi, getDeptDetailApi, getDeptTreeApi, updateDeptApi } from '#/api/sys/userDept';

import { buildParentTreeData, createDefaultForm, findTreePathKeys } from '../data';

export interface UseDeptFormOptions {
  gridApi: any;
  t: (key: string) => string;
}

export function useDeptForm(options: UseDeptFormOptions) {
  const { gridApi, t } = options;

  const visible = ref(false);
  const loading = ref(false);
  const isEdit = ref(false);
  const isDetail = ref(false);
  const treeLoading = ref(false);
  const form = ref<DeptApi.SaveParams & { id?: string }>(createDefaultForm());
  const treeData = ref<{ children: any[]; label: string; value: string }[]>([]);
  const treeExpandedKeys = ref<string[]>([]);

  const title = computed(() => {
    if (isDetail.value) return t('sys.user-dept.detail');
    if (isEdit.value) return t('sys.user-dept.edit');
    return form.value.parentId ? t('sys.user-dept.addChild') : t('sys.user-dept.addRoot');
  });

  async function loadTreeData(excludeId?: string) {
    treeLoading.value = true;
    try {
      const { items } = await getDeptTreeApi();
      treeData.value = buildParentTreeData(items, excludeId);
      // 默认展开到当前选中的父节点（包含父节点本身），没有选中则不展开
      const parentId = form.value.parentId;
      treeExpandedKeys.value = parentId ? findTreePathKeys(treeData.value, parentId) : [];
    } finally {
      treeLoading.value = false;
    }
  }

  async function loadDetailForm(id: string) {
    const detail = await getDeptDetailApi(id);
    form.value = {
      id: detail.id,
      parentId: detail.parentId,
      name: detail.name,
      code: detail.code ?? undefined,
      leaderId: detail.leaderId ?? undefined,
      phone: detail.phone ?? undefined,
      email: detail.email ?? undefined,
      status: detail.status,
    };
  }

  function openCreate(parentId: null | string = null) {
    isDetail.value = false;
    isEdit.value = false;
    form.value = { ...createDefaultForm(), parentId };
    loadTreeData();
    visible.value = true;
  }

  async function openEdit(id: string) {
    isDetail.value = false;
    isEdit.value = true;
    await loadDetailForm(id);
    await loadTreeData(id);
    visible.value = true;
  }

  async function openDetail(id: string) {
    isDetail.value = true;
    isEdit.value = false;
    await loadDetailForm(id);
    await loadTreeData(id);
    visible.value = true;
  }

  function validate(): boolean {
    if (!form.value.name?.trim()) {
      message.warning(t('sys.user-dept.placeholder.name'));
      return false;
    }
    return true;
  }

  async function refreshParent() {
    const grid = gridApi.grid as any;
    if (!grid) return;

    const parentId = form.value.parentId;
    if (parentId) {
      const parentRow = grid.getRowById?.(parentId);
      if (parentRow) {
        // 新增/编辑都会让父节点至少存在一个子节点，确保 hasChild 为 true，
        // 以通过 reloadTreeExpand 的懒加载门控（此前删除最后一个子节点可能将其置为 false）
        parentRow.hasChild = true;
        await grid.reloadTreeExpand?.(parentRow);
        // 显式恢复/保持父节点展开状态，确保展示新增/编辑后的子节点
        if (!grid.isTreeExpandByRow?.(parentRow)) {
          await grid.setTreeExpand?.([parentRow], true);
        }
        return;
      }
    }

    // 根节点或父节点未加载时：保存展开状态 → 刷新 → 恢复展开状态
    const expandedRows = grid.getTreeExpandRecords?.() ?? [];
    await gridApi.query();
    if (expandedRows.length > 0) {
      await grid.setTreeExpand?.(expandedRows, true);
    }
  }

  async function handleSubmit() {
    if (isDetail.value) {
      visible.value = false;
      return;
    }
    if (!validate()) return;

    loading.value = true;
    try {
      const data: DeptApi.SaveParams & { id?: string } = {
        ...form.value,
        name: form.value.name.trim(),
        leaderId: form.value.leaderId?.trim() || undefined,
        phone: form.value.phone?.trim() || undefined,
        email: form.value.email?.trim() || undefined,
      };

      if (isEdit.value && data.id) {
        // 编辑时不允许修改编码
        delete (data as any).code;
        await updateDeptApi(data as DeptApi.SaveParams & { id: string });
        message.success(t('sys.user-dept.updateSuccess'));
      } else {
        data.code = form.value.code?.trim();
        await createDeptApi(data);
        message.success(t('sys.user-dept.createSuccess'));
      }
      await refreshParent();
      visible.value = false;
    } finally {
      loading.value = false;
    }
  }

  return {
    visible,
    loading,
    isEdit,
    isDetail,
    treeLoading,
    form,
    treeData,
    treeExpandedKeys,
    title,
    openCreate,
    openEdit,
    openDetail,
    handleSubmit,
  };
}
