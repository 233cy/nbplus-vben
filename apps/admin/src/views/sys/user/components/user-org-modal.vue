<script setup lang="ts">
import type { UserApi } from '#/api/sys/user';
import type { DeptDutyValue } from '#/views/sys/user-duty/shared/dept-duty-select';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import { $t } from '#/locales';
import DeptDutySelect from '#/views/sys/user-duty/shared/dept-duty-select.vue';

interface Props {
  visible: boolean;
  existingItems?: UserApi.UserOrgItem[];
}

const props = withDefaults(defineProps<Props>(), {
  existingItems: () => [],
});

const emit = defineEmits<{
  submit: [item: UserApi.UserOrgItem];
  'update:visible': [value: boolean];
}>();

/** 部门+职务联动选择的当前值（部门/职务名称由共享组件一并回写） */
const org = ref<DeptDutyValue>({ deptId: '' });
const loading = ref(false);

const selectRef = ref<InstanceType<typeof DeptDutySelect> | null>(null);

const open = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
});

function reset() {
  org.value = { deptId: '' };
}

function handleRefresh() {
  selectRef.value?.reload();
}

function handleCancel() {
  open.value = false;
}

function handleOk() {
  if (!org.value.deptId) {
    message.warning($t('sys.user.userOrg.deptRequired'));
    return;
  }
  if (!org.value.dutyId) {
    message.warning($t('sys.user.userOrg.dutyRequired'));
    return;
  }

  const exists = props.existingItems.some(item => item.deptId === org.value.deptId && item.dutyId === org.value.dutyId);
  if (exists) {
    message.warning($t('sys.user.userOrg.duplicate'));
    return;
  }

  emit('submit', {
    deptId: org.value.deptId,
    deptName: org.value.deptName ?? '',
    dutyId: org.value.dutyId,
    dutyName: org.value.dutyName ?? '',
    isMain: 2,
    sort: (props.existingItems.length + 1) * 10,
  });

  open.value = false;
  reset();
}

// 组件首次挂载时初始化空白状态
reset();
</script>

<template>
  <Modal v-model:open="open" :confirm-loading="loading" :ok-text="$t('common.confirm')" :cancel-text="$t('common.cancel')" @ok="handleOk" @cancel="handleCancel">
    <template #title>
      <div class="flex w-full items-center justify-between pr-8">
        <span>{{ $t('sys.user.userOrg.addTitle') }}</span>
        <span @click.prevent.stop="handleRefresh">
          <IconifyIcon icon="mdi:refresh" class="size-5 cursor-pointer text-foreground/70 transition-colors hover:text-foreground" />
        </span>
      </div>
    </template>

    <DeptDutySelect ref="selectRef" v-model="org" dept-required duty-required class="mt-4" />
  </Modal>
</template>
