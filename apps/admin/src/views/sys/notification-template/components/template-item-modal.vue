<script setup lang="ts">
import type { NotificationChannelApi } from '#/api/sys/notificationChannel';
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, Select, Switch } from 'ant-design-vue';

import { getNotificationChannelDriverSchemasApi } from '#/api/sys/notificationChannel';
import { $t } from '#/locales';

import { getChannelTemplateComponent } from './channel-templates';

interface ModalData {
  data?: NotificationTemplateApi.TemplateItemSave | null;
  existingItems?: NotificationTemplateApi.TemplateItemSave[];
  variables?: Record<string, string>;
}

const emit = defineEmits<{
  submit: [value: NotificationTemplateApi.TemplateItemSave];
}>();

const schemas = ref<NotificationChannelApi.DriverSchema[]>([]);
const loading = ref(false);
const formData = ref<NotificationTemplateApi.TemplateItemSave>({
  channelType: '',
  remark: '',
  subject: '',
  content: '',
  extra: {},
  status: 1,
});
const existingList = ref<NotificationTemplateApi.TemplateItemSave[]>([]);
const templateVariables = ref<Record<string, string>>({});

const isEdit = computed(() => !!formData.value.channelType);

const modalClass = computed(() => {
  // 富文本渠道（邮件、站内信）弹窗加宽，给编辑器留足空间
  if (['email', 'station'].includes(formData.value.channelType)) {
    return 'sm:!w-[960px]';
  }
  return '';
});

const driverOptions = computed(() =>
  schemas.value.map(item => ({
    label: `${item.label}（${item.code}）`,
    value: item.code,
    disabled: !isEdit.value && existingList.value.some(i => i.channelType === item.code),
  })),
);

const activeComponent = computed(() => getChannelTemplateComponent(formData.value.channelType));

async function loadSchemas() {
  if (schemas.value.length > 0) return;
  loading.value = true;
  try {
    schemas.value = await getNotificationChannelDriverSchemasApi();
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    await loadSchemas();

    const payload = modalApi.getData<ModalData>();
    const data = payload?.data;
    existingList.value = payload?.existingItems || [];
    templateVariables.value = payload?.variables || {};

    formData.value = data
      ? { remark: '', subject: '', summary: '', content: '', extra: {}, status: 1, ...data }
      : { channelType: '', remark: '', subject: '', summary: '', content: '', extra: {}, status: 1 };
  },
});

function handleSubmit() {
  modalApi.close();
  emit('submit', {
    channelType: formData.value.channelType,
    remark: formData.value.remark ?? '',
    subject: formData.value.subject ?? '',
    summary: formData.value.summary ?? '',
    content: formData.value.content ?? '',
    extra: formData.value.extra || {},
    status: formData.value.status ?? 1,
  });
}

function filterOption(input: string | undefined, option: any) {
  return (option?.label || '').toLowerCase().includes((input || '').toLowerCase());
}
</script>

<template>
  <Modal
    :title="isEdit ? $t('sys.notification-template.items.edit') : $t('sys.notification-template.items.add')"
    :show-cancel-button="true"
    :class="modalClass"
  >
    <Form layout="vertical" :model="formData">
      <FormItem :label="$t('sys.notification-template.items.channelType')" required>
        <Select
          v-model:value="formData.channelType"
          :options="driverOptions"
          :disabled="isEdit"
          :placeholder="$t('common.pleaseSelect')"
          show-search
          :filter-option="filterOption"
        />
      </FormItem>

      <FormItem :label="$t('sys.notification-template.items.remark')">
        <Input v-model:value="formData.remark" :placeholder="$t('sys.notification-template.items.remarkPlaceholder')" />
      </FormItem>

      <FormItem v-if="formData.channelType" :label="$t('sys.notification-template.availableVariables')">
        <component :is="activeComponent" v-model="formData" :variables="templateVariables" />
      </FormItem>

      <FormItem :label="$t('common.status')">
        <Switch
          v-model:checked="formData.status"
          :checked-value="1"
          :un-checked-value="2"
          :checked-children="$t('common.enabled')"
          :un-checked-children="$t('common.disabled')"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
