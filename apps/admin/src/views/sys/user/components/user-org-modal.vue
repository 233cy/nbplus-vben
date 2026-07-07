<script setup lang="ts">
import type { UserApi } from '#/api/sys/user';

import { computed, nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Form, FormItem, message, Modal } from 'ant-design-vue';

import ApiSelect from '#/components/page-select/api-select.vue';
import { $t } from '#/locales';

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

const deptId = ref<string>('');
const dutyId = ref<string>('');
const loading = ref(false);

const deptSelectRef = ref<InstanceType<typeof ApiSelect> | null>(null);
const dutySelectRef = ref<InstanceType<typeof ApiSelect> | null>(null);

const postParams = computed(() => ({
  deptId: deptId.value || 'null',
}));

const open = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
});

function reset() {
  deptId.value = '';
  dutyId.value = '';
}

function findName(options: any[], id: string): string {
  for (const option of options) {
    if (String(option.value) === String(id) || String(option.id) === String(id)) {
      return option?.fullName || option?.label || option?.name || '';
    }
    if (option.children?.length) {
      const found = findName(option.children, id);
      if (found) return found;
    }
  }
  return '';
}

function handleRefresh() {
  deptSelectRef.value?.reload();
  dutySelectRef.value?.reload();
}

watch(deptId, async () => {
  dutyId.value = '';
  await nextTick();
  dutySelectRef.value?.reload();
});

function handleCancel() {
  open.value = false;
}

function handleOk() {
  if (!deptId.value) {
    message.warning($t('sys.user.userOrg.deptRequired'));
    return;
  }
  if (!dutyId.value) {
    message.warning($t('sys.user.userOrg.dutyRequired'));
    return;
  }

  const exists = props.existingItems.some(item => item.deptId === deptId.value && item.dutyId === dutyId.value);
  if (exists) {
    message.warning($t('sys.user.userOrg.duplicate'));
    return;
  }

  emit('submit', {
    deptId: deptId.value,
    deptName: findName(deptSelectRef.value?.options || [], deptId.value),
    dutyId: dutyId.value,
    dutyName: findName(dutySelectRef.value?.options || [], dutyId.value),
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

    <Form layout="vertical" class="mt-4">
      <FormItem :label="$t('sys.user.fields.deptId')" required>
        <ApiSelect
          ref="deptSelectRef"
          v-model:value="deptId"
          config="dept"
          :immediate="false"
          :placeholder="$t('ui.placeholder.select')"
          class="w-full"
        />
      </FormItem>

      <FormItem :label="$t('sys.user.fields.dutyId')" required>
        <ApiSelect
          ref="dutySelectRef"
          v-model:value="dutyId"
          config="post"
          :immediate="false"
          :params="postParams"
          :placeholder="$t('ui.placeholder.select')"
          class="w-full"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
