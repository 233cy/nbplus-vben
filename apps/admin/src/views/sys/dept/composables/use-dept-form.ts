import type { DeptApi } from '#/api/sys/dept';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

import { createDeptApi, updateDeptApi } from '#/api/sys/dept';

import { createDefaultForm, findDeptTitle } from '../data';

export interface UseDeptFormOptions {
  treeData: { value: DeptApi.DeptItem[] };
  reload: () => Promise<void>;
  t: (key: string) => string;
}

export function useDeptForm(options: UseDeptFormOptions) {
  const { treeData, reload, t } = options;

  const visible = ref(false);
  const loading = ref(false);
  const isEdit = ref(false);
  const form = ref<DeptApi.SaveParams & { id?: string }>(createDefaultForm());

  const title = computed(() => {
    if (isEdit.value) return t('system.dept.edit');
    const parentId = form.value.parentId;
    const parentTitle = parentId ? findDeptTitle(treeData.value, parentId) : '';
    const actionKey = parentId ? 'system.dept.addChild' : 'system.dept.addRoot';
    return `${t(actionKey)}${parentTitle ? `「${parentTitle}」` : ''}`;
  });

  function openCreate(parentId: null | string = null) {
    isEdit.value = false;
    form.value = { ...createDefaultForm(), parentId };
    visible.value = true;
  }

  function openEdit(item: DeptApi.DeptItem) {
    isEdit.value = true;
    const { children: _children, ...rest } = item;
    form.value = { ...rest };
    visible.value = true;
  }

  function validate(): boolean {
    if (!form.value.name?.trim()) {
      message.warning(t('system.dept.placeholder.name'));
      return false;
    }
    return true;
  }

  async function handleSubmit() {
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
        message.success(t('system.dept.updateSuccess'));
      } else {
        data.code = form.value.code?.trim();
        await createDeptApi(data);
        message.success(t('system.dept.createSuccess'));
      }
      await reload();
      visible.value = false;
    } finally {
      loading.value = false;
    }
  }

  return {
    visible,
    loading,
    isEdit,
    form,
    title,
    openCreate,
    openEdit,
    handleSubmit,
  };
}
