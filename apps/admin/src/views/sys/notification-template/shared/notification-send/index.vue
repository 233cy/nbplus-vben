<script setup lang="ts">
import type { SendResultItem } from './types';

import type { NotificationChannelApi } from '#/api/sys/notificationChannel';
import type { NotificationSendApi } from '#/api/sys/notificationSend';
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Form, FormItem, Input, message, Select, Textarea } from 'ant-design-vue';

import { getNotificationChannelDriverSchemasApi } from '#/api/sys/notificationChannel';
import { getNotificationSendOptionsApi, sendNotificationSendApi } from '#/api/sys/notificationSend';
import { testSendNotificationTemplateApi } from '#/api/sys/notificationTemplate';
import PageSelect from '#/components/page-select/index.vue';
import WangEditor from '#/components/wang-editor/index.vue';
import { $t } from '#/locales';

import SendResult from './send-result.vue';
import VariablesForm from './variables-form.vue';

interface Props {
  /** template：模板测试发送；channel：按渠道实例自由发送 */
  mode: 'channel' | 'template';
  /** mode=template 时传入的模板行数据（含 items/variables） */
  template?: NotificationTemplateApi.Template | null;
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
});

const emit = defineEmits<{
  /** 全部目标投递成功时触发（模板弹窗据此关闭） */
  success: [];
}>();

const MOBILE_RE = /^1[3-9]\d{9}$/;
const EMAIL_RE = /^[\w.%+-]+@[\w.-]+\.[a-z]{2,}$/i;

/* ============================================================
   结果展示（两种模式共用）
   ============================================================ */
const submitting = ref(false);
const resultItems = ref<SendResultItem[]>([]);
const resultTargets = ref<string[]>([]);
const resultMeta = ref({ batchNo: '', failureCount: 0, skippedCount: 0 });

const hasResult = computed(() => resultItems.value.length > 0);
const resultTitle = computed(() =>
  props.mode === 'template'
    ? $t('sys.notification-template.testSendResult')
    : $t('sys.notification-send.resultTitle'),
);

function applyResult(
  items: SendResultItem[],
  targets: string[],
  meta: { batchNo?: string; failureCount: number; skippedCount: number },
) {
  resultItems.value = items;
  resultTargets.value = targets;
  resultMeta.value = {
    batchNo: meta.batchNo || '',
    failureCount: meta.failureCount,
    skippedCount: meta.skippedCount,
  };
}

function clearResult() {
  resultItems.value = [];
  resultTargets.value = [];
  resultMeta.value = { batchNo: '', failureCount: 0, skippedCount: 0 };
}

/* ============================================================
   模板测试发送（mode=template）
   ============================================================ */
const userIds = ref<string[]>([]);
const channelType = ref('');
const variableValues = ref<Record<string, string>>({});
const driverSchemas = ref<NotificationChannelApi.DriverSchema[]>([]);

const channelNameMap = computed(() => {
  const map: Record<string, string> = {};
  driverSchemas.value.forEach(item => {
    map[item.code] = item.label;
  });
  return map;
});

const enabledItems = computed(() => (props.template?.items || []).filter(item => item.status === 1));

const templateChannelOptions = computed(() => [
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

watch(
  () => props.template,
  (tpl) => {
    userIds.value = [];
    channelType.value = '';
    const values: Record<string, string> = {};
    Object.keys(tpl?.variables || {}).forEach((key) => {
      values[key] = '';
    });
    variableValues.value = values;
    clearResult();
  },
  { immediate: true },
);

async function submitTemplate(): Promise<boolean> {
  const tpl = props.template;
  if (!tpl) {
    return false;
  }
  if (userIds.value.length === 0) {
    message.error($t('sys.notification-template.testSendUserRequired'));
    return false;
  }

  submitting.value = true;
  try {
    const res = await testSendNotificationTemplateApi({
      templateCode: tpl.code,
      userIds: userIds.value,
      channelType: channelType.value || undefined,
      variables: variableValues.value,
    });

    applyResult(res.results, userIds.value, {
      failureCount: res.failureCount,
      skippedCount: res.skippedCount,
    });

    if (res.allSuccess) {
      if (res.skippedCount > 0) {
        // 全部成功但存在跳过：提示已跳过的用户
        message.warning(
          `${$t('sys.notification-template.testSendSkipped', { count: res.skippedCount })}：${res.skipped.join('; ')}`,
        );
      } else {
        message.success($t('sys.notification-template.testSendSuccess'));
      }
      emit('success');
      return true;
    }
    return false;
  } finally {
    submitting.value = false;
  }
}

/* ============================================================
   渠道自由发送（mode=channel）
   ============================================================ */
const channelOptions = ref<NotificationSendApi.ChannelOption[]>([]);
const channelCode = ref('');
const targetsText = ref('');
const subject = ref('');
const content = ref('');
/** 短信渠道：模板号 + 模板变量（服务商报备模板制，无自由文本） */
const templateCode = ref('');
const variableRows = ref<{ key: string; value: string }[]>([]);

const selectedChannel = computed(() =>
  channelOptions.value.find(item => item.channelCode === channelCode.value),
);
const contactType = computed(() => selectedChannel.value?.contactType);
/** 短信渠道无标题概念，隐藏标题输入 */
const showSubject = computed(() => !!contactType.value && contactType.value !== 'mobile');
/** 当前渠道是否为短信（按模板号+变量发送） */
const isSms = computed(() => selectedChannel.value?.driver === 'sms');
/** 当前渠道是否为富文本渠道（站内信/邮件，内容用富文本编辑器） */
const isRichText = computed(() => ['email', 'station'].includes(selectedChannel.value?.driver || ''));

/** 变量行操作（短信自由发送用） */
function addVariableRow() {
  variableRows.value.push({ key: '', value: '' });
}
function removeVariableRow(index: number) {
  variableRows.value.splice(index, 1);
}
function buildVariables(): Record<string, string> {
  const variables: Record<string, string> = {};
  variableRows.value.forEach((row) => {
    const key = row.key.trim();
    if (key !== '') {
      variables[key] = row.value;
    }
  });
  return variables;
}

const channelSelectOptions = computed(() =>
  channelOptions.value.map(item => ({
    label: `${item.channelName}（${item.driverLabel}）`,
    value: item.channelCode,
  })),
);

watch(channelCode, () => {
  userIds.value = [];
  targetsText.value = '';
  templateCode.value = '';
  variableRows.value = [];
  clearResult();
});

/** 拆分接收目标：按行拆分、去空、去重 */
function parseTargets(): string[] {
  const list = targetsText.value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
  return [...new Set(list)];
}

function validateTargets(targets: string[], type: 'email' | 'mobile'): boolean {
  if (targets.length === 0) {
    message.error($t('sys.notification-send.targetsRequired'));
    return false;
  }
  const invalid = targets.filter(item => (type === 'mobile' ? !MOBILE_RE.test(item) : !EMAIL_RE.test(item)));
  if (invalid.length > 0) {
    message.error(
      $t(type === 'mobile' ? 'sys.notification-send.invalidMobile' : 'sys.notification-send.invalidEmail', {
        list: invalid.slice(0, 3).join('、'),
      }),
    );
    return false;
  }
  return true;
}

async function submitChannel(): Promise<boolean> {
  if (!channelCode.value || !selectedChannel.value) {
    message.error($t('sys.notification-send.channelRequired'));
    return false;
  }

  const type = contactType.value;
  const payload: NotificationSendApi.SendParams = {
    channelCode: channelCode.value,
  };
  let targets: string[] = [];

  if (type === 'user') {
    if (userIds.value.length === 0) {
      message.error($t('sys.notification-send.recipientsRequired'));
      return false;
    }
    payload.userIds = userIds.value;
    targets = [...userIds.value];
  } else if (type === 'email' || type === 'mobile') {
    targets = parseTargets();
    if (!validateTargets(targets, type)) {
      return false;
    }
    payload.contacts = targets.map(target => ({ target }));
  }

  if (isSms.value) {
    // 短信：模板号必填，变量随行组装，content 由后端合成
    if (!templateCode.value.trim()) {
      message.error($t('sys.notification-send.templateCodeRequired'));
      return false;
    }
    payload.templateCode = templateCode.value.trim();
    payload.variables = buildVariables();
  } else {
    if (!content.value.trim()) {
      message.error($t('sys.notification-send.contentRequired'));
      return false;
    }
    payload.content = content.value;
  }
  if (showSubject.value && subject.value.trim()) {
    payload.subject = subject.value.trim();
  }

  submitting.value = true;
  try {
    const res = await sendNotificationSendApi(payload);
    applyResult(res.results, targets, {
      batchNo: res.batchNo,
      failureCount: res.failureCount,
      skippedCount: res.skippedCount,
    });

    if (res.allSuccess) {
      message.success($t('sys.notification-send.sendSuccess'));
      emit('success');
      return true;
    }
    message.warning($t('sys.notification-send.sendPartialFailed'));
    return false;
  } finally {
    submitting.value = false;
  }
}

/* ============================================================
   初始化与对外暴露
   ============================================================ */
async function loadDriverSchemas() {
  if (driverSchemas.value.length > 0) return;
  driverSchemas.value = await getNotificationChannelDriverSchemasApi();
}

onMounted(() => {
  if (props.mode === 'template') {
    loadDriverSchemas();
  } else {
    getNotificationSendOptionsApi().then((res) => {
      channelOptions.value = res;
    });
  }
});

/** 提交发送，返回是否全部成功；模板模式由外层弹窗确认按钮触发 */
async function submit(): Promise<boolean> {
  return props.mode === 'template' ? submitTemplate() : submitChannel();
}

defineExpose({ submit, submitting });
</script>

<template>
  <div :class="mode === 'channel' ? 'mx-auto flex max-w-[1900px] items-start gap-6' : ''">
    <!-- 左侧：表单区 -->
    <div :class="mode === 'channel' ? 'w-full min-w-0 max-w-6xl' : ''">
      <Form layout="vertical">
    <!-- 模板测试发送 -->
    <template v-if="mode === 'template'">
      <FormItem :label="$t('sys.notification-template.testSendUsers')" required>
        <PageSelect v-model="userIds" config="user" value-type="array" :multiple="true" />
      </FormItem>

      <FormItem :label="$t('sys.notification-template.testSendChannel')">
        <Select v-model:value="channelType" :options="templateChannelOptions" :placeholder="$t('common.pleaseSelect')" />
      </FormItem>

      <FormItem :label="$t('sys.notification-template.testSendVariables')">
        <VariablesForm v-model="variableValues" :variables="template?.variables || {}" />
      </FormItem>
    </template>

    <!-- 渠道自由发送 -->
    <template v-else>
      <FormItem :label="$t('sys.notification-send.channel')" required>
        <Select
          v-model:value="channelCode"
          :options="channelSelectOptions"
          show-search
          option-filter-prop="label"
          :placeholder="$t('common.pleaseSelect')"
        />
      </FormItem>

      <FormItem v-if="contactType === 'user'" :label="$t('sys.notification-send.recipients')" required>
        <PageSelect v-model="userIds" config="user" value-type="array" :multiple="true" />
      </FormItem>
      <FormItem v-else-if="contactType" :label="$t('sys.notification-send.targets')" required>
        <Textarea
          v-model:value="targetsText"
          :rows="4"
          :placeholder="contactType === 'mobile' ? $t('sys.notification-send.mobilePlaceholder') : $t('sys.notification-send.emailPlaceholder')"
        />
      </FormItem>

      <FormItem v-if="showSubject" :label="$t('sys.notification-send.subject')">
        <Input v-model:value="subject" :placeholder="$t('sys.notification-send.subjectPlaceholder')" />
      </FormItem>

      <!-- 短信渠道：模板号 + 模板变量 -->
      <template v-if="isSms">
        <FormItem :label="$t('sys.notification-send.templateCode')" required>
          <Input v-model:value="templateCode" :placeholder="$t('sys.notification-send.templateCodePlaceholder')" />
        </FormItem>

        <FormItem :label="$t('sys.notification-send.variables')">
          <div class="space-y-2">
            <div v-for="(row, index) in variableRows" :key="index" class="flex items-center gap-2">
              <Input v-model:value="row.key" class="w-1/3" :placeholder="$t('sys.notification-send.variableKey')" />
              <Input v-model:value="row.value" class="flex-1" :placeholder="$t('sys.notification-send.variableValue')" />
              <Button size="small" type="link" danger @click="removeVariableRow(index)">
                {{ $t('common.delete') }}
              </Button>
            </div>
            <Button size="small" type="dashed" block @click="addVariableRow">
              + {{ $t('sys.notification-send.variableAdd') }}
            </Button>
          </div>
        </FormItem>
      </template>

      <!-- 富文本渠道（站内信/邮件）：富文本编辑器 -->
      <FormItem v-else-if="isRichText" :label="$t('sys.notification-send.content')" required>
        <WangEditor v-model="content" />
      </FormItem>

      <!-- 其他渠道：自由文本内容 -->
      <FormItem v-else :label="$t('sys.notification-send.content')" required>
        <Textarea v-model:value="content" :rows="5" :placeholder="$t('sys.notification-send.contentPlaceholder')" />
      </FormItem>

      <FormItem>
        <Button type="primary" :loading="submitting" @click="submit">
          {{ $t('sys.notification-send.send') }}
        </Button>
      </FormItem>
    </template>
  </Form>
    </div>

    <!-- 右侧：发送结果栏（自由发送固定展示；模板发送留在下方） -->
    <div
      v-if="mode === 'channel'"
      class="w-[560px] shrink-0 rounded-lg border border-gray-200 p-4"
    >
      <div class="mb-3 text-sm font-medium">{{ resultTitle }}</div>
      <SendResult
        v-if="hasResult"
        :results="resultItems"
        :targets="resultTargets"
        :failure-count="resultMeta.failureCount"
        :skipped-count="resultMeta.skippedCount"
        :batch-no="resultMeta.batchNo"
      />
      <div v-else class="py-10 text-center text-sm text-gray-400">
        {{ $t('sys.notification-send.resultEmpty') }}
      </div>
    </div>

    <!-- 模板测试发送：结果在表单下方 -->
    <div v-if="mode === 'template' && hasResult" class="mt-2">
      <div class="mb-2 text-sm font-medium">{{ resultTitle }}</div>
      <SendResult
        :results="resultItems"
        :targets="resultTargets"
        :failure-count="resultMeta.failureCount"
        :skipped-count="resultMeta.skippedCount"
        :batch-no="resultMeta.batchNo"
      />
    </div>
  </div>
</template>
