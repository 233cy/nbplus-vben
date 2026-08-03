<script setup lang="ts">
import type { DeptDutyValue } from '#/views/sys/user-duty/shared/dept-duty-select';

import { ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, message, Modal, Table } from 'ant-design-vue';

import { getOptionsApi } from '#/api/core/options';
import { $t } from '#/locales';
import DeptDutySelect from '#/views/sys/user-duty/shared/dept-duty-select.vue';

/**
 * 职务挑选列表（任职列表形态）：新增职务 → 弹窗内部门+职务联动单选 → 确认追加；
 * 列表展示已选职务（部门/职务）+ 删除。契约仍为职务 id 数组（dutyIds）。
 * 审批人"指定职务"面板与发起人范围抽屉共用。
 */
interface DutyRow {
  deptId: string;
  deptName: string;
  dutyId: string;
  dutyName: string;
}

const props = defineProps<{
  /** 已选职务 id 数组 */
  modelValue: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const rows = ref<DutyRow[]>([]);
const pickerOpen = ref(false);
const picking = ref<DeptDutyValue>({ deptId: '' });

const columns = [
  { dataIndex: 'deptName', key: 'deptName', title: $t('sys.user.fields.deptId') },
  { dataIndex: 'dutyName', key: 'dutyName', title: $t('sys.user.fields.dutyId') },
  { key: 'action', title: $t('common.operation'), width: 80 },
];

// 回显：modelValue 变化时按 dutyIds 反查名称补齐行（新追加的行直接有名称，走缓存不重复查）
watch(
  () => props.modelValue,
  async ids => {
    await syncRows(Array.isArray(ids) ? ids : []);
  },
  { immediate: true },
);

async function syncRows(ids: string[]) {
  const known = new Map(rows.value.map(row => [row.dutyId, row]));
  const missing = ids.filter(id => !known.has(id));

  if (missing.length > 0) {
    try {
      const res: any = await getOptionsApi('post', { ids: missing.join(',') });
      const items = Array.isArray(res) ? res : (res?.items ?? []);
      for (const item of items) {
        const dutyId = String(item.id ?? item.value ?? '');
        if (dutyId === '') continue;
        known.set(dutyId, {
          deptId: String(item.deptId ?? ''),
          deptName: item.deptName ?? '',
          dutyId,
          dutyName: item.name ?? item.label ?? '',
        });
      }
    } catch {
      // 名称反查失败不阻塞，行内退化为显示 id
    }
  }

  rows.value = ids.map(id => known.get(id) ?? { deptId: '', deptName: '', dutyId: id, dutyName: id });
}

function openPicker() {
  picking.value = { deptId: '' };
  pickerOpen.value = true;
}

function confirmPick() {
  const value = picking.value;
  if (!value.dutyId) {
    message.warning($t('approval.designer.duty.required'));
    return;
  }
  if (props.modelValue.includes(value.dutyId)) {
    message.warning($t('approval.designer.duty.duplicate'));
    return;
  }

  rows.value = [
    ...rows.value,
    {
      deptId: value.deptId,
      deptName: value.deptName ?? '',
      dutyId: value.dutyId,
      dutyName: value.dutyName ?? '',
    },
  ];
  emit('update:modelValue', [...props.modelValue, value.dutyId]);
  pickerOpen.value = false;
}

function removeRow(dutyId: string) {
  rows.value = rows.value.filter(row => row.dutyId !== dutyId);
  emit('update:modelValue', props.modelValue.filter(id => id !== dutyId));
}
</script>

<template>
  <div class="w-full space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-foreground/60">{{ $t('approval.designer.duty.selected', { count: modelValue.length }) }}</span>
      <Button size="small" type="primary" ghost @click="openPicker">
        <IconifyIcon icon="lucide:plus" class="size-4" />
        {{ $t('approval.designer.duty.add') }}
      </Button>
    </div>

    <Table :columns="columns" :data-source="rows" :pagination="false" row-key="dutyId" size="small" :locale="{ emptyText: $t('approval.designer.duty.empty') }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Button size="small" type="link" danger @click="removeRow(record.dutyId)">
            {{ $t('common.delete') }}
          </Button>
        </template>
      </template>
    </Table>

    <Modal v-model:open="pickerOpen" :title="$t('approval.designer.duty.add')" :ok-text="$t('common.confirm')" :cancel-text="$t('common.cancel')" @ok="confirmPick">
      <DeptDutySelect v-model="picking" duty-required class="mt-4" />
    </Modal>
  </div>
</template>
