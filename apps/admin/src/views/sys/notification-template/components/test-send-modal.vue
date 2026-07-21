<script setup lang="ts">
import type { NotificationChannelApi } from '#/api/sys/notificationChannel';
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, message, Select } from 'ant-design-vue';

import { getNotificationChannelDriverSchemasApi } from '#/api/sys/notificationChannel';
import { testSendNotificationTemplateApi } from '#/api/sys/notificationTemplate';
import PageSelect from '#/components/page-select/index.vue';
import { $t } from '#/locales';

const emit = defineEmits<{
  success: [];
}>();

const template = ref<NotificationTemplateApi.Template | null>(null);
const userIds = ref<string[]>([]);
const channelType = ref('');
const variableValues = ref<Record<string, string>>({});
const schemas = ref<NotificationChannelApi.DriverSchema[]>([]);

const variableEntries = computed(() => Object.entries(template.value?.variables || {}));

const channelNameMap = computed(() => {
  const map: Record<string, string> = {};
  schemas.value.forEach(item => {
    map[item.code] = item.label;
  });
  return map;
});

const enabledItems = computed(() => (template.value?.items || []).filter(item => item.status === 1));

const channelOptions = computed(() => [
  { label: $t('sys.notification-template.testSendChannelAll'), value: '' },
  ...enabledItems.value.map(item => {
    const name = channelNameMap.value[item.channelType] || item.channelType;
    const display = item.remark || item.subject || '-';
    return {
      label: `${name} - ${display}`,
      value: item.channelType,
    };
  }),
]);

async function loadSchemas() {
  if (schemas.value.length > 0) return;
  schemas.value = await getNotificationChannelDriverSchemasApi();
}

onMounted(loadSchemas);

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    await handleConfirm();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<NotificationTemplateApi.Template>();
    template.value = data || null;
    userIds.value = [];
    channelType.value = '';

    const values: Record<string, string> = {};
    Object.keys(data?.variables || {}).forEach((key) => {
      values[key] = '';
    });
    variableValues.value = values;
  },
});

async function handleConfirm() {
  if (!template.value) {
    return;
  }

  if (userIds.value.length === 0) {
    message.error($t('sys.notification-template.testSendUserRequired'));
    return;
  }

  let result: NotificationTemplateApi.TestSendResult | null = null;
  modalApi.setState({ loading: true });
  try {
    result = await testSendNotificationTemplateApi({
      templateCode: template.value.code,
      userIds: userIds.value,
      channelType: channelType.value || undefined,
      variables: variableValues.value,
    });

    const errorMsg = result.results
      .filter(item => !item.success && !item.skipped)
      .map(item => item.errorMessage)
      .filter(Boolean)
      .join('; ');

    if (result.skippedCount > 0 && !errorMsg) {
      // 只有跳过、没有真正失败：提示已跳过
      message.warning(
        `${$t('sys.notification-template.testSendSkipped', { count: result.skippedCount })}：${result.skipped.join('; ')}`,
      );
      emit('success');
      modalApi.close();
      return;
    }

    if (result.allSuccess) {
      message.success($t('sys.notification-template.testSendSuccess'));
      emit('success');
      modalApi.close();
      return;
    }

    message.error(
      $t('sys.notification-template.testSendFailed', { msg: errorMsg || '' }),
    );
  } catch (error: any) {
    message.error(error?.message || $t('sys.notification-template.testSendFailed', { msg: '' }));
  } finally {
    // 成功关闭弹窗后不再操作 modal 状态，避免 destroyOnClose 后 setState 作用到已销毁实例
    if (!result?.allSuccess) {
      modalApi.setState({ loading: false });
    }
  }
}
</script>

<template>
  <Modal
    :title="$t('sys.notification-template.testSendTitle', { name: template?.name || '' })"
    :show-cancel-button="true"
    width="680px"
  >
    <Form layout="vertical">
      <FormItem :label="$t('sys.notification-template.testSendUsers')" required>
        <PageSelect
          v-model="userIds"
          config="user"
          value-type="array"
          :multiple="true"
        />
      </FormItem>

      <FormItem :label="$t('sys.notification-template.testSendChannel')">
        <Select
          v-model:value="channelType"
          :options="channelOptions"
          :placeholder="$t('common.pleaseSelect')"
        />
      </FormItem>

      <FormItem :label="$t('sys.notification-template.testSendVariables')">
        <div v-if="variableEntries.length === 0" class="text-sm text-gray-500">
          {{ $t('sys.notification-template.testSendNoVariables') }}
        </div>
        <div v-else class="space-y-3">
          <div v-for="[key, desc] in variableEntries" :key="key">
            <label class="mb-1 block text-sm">
              {{ key }}
              <span v-if="desc" class="ml-1 text-xs text-gray-500">({{ desc }})</span>
            </label>
            <Input v-model:value="variableValues[key]" :placeholder="desc || key" />
          </div>
        </div>
      </FormItem>
    </Form>
  </Modal>
</template>
