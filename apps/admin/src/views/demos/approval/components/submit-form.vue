<script setup lang="ts">
import { reactive } from 'vue';

import { message } from 'ant-design-vue';

import type { VbenFormSchema } from '#/adapter/form';
import { useVbenForm } from '#/adapter/form';
import { submitApprovalApi } from '#/api/sys/approval';
import { $t } from '#/locales';

const emit = defineEmits<{
  submitted: [];
}>();

/** 请假类型选项 */
const leaveTypeOptions = [
  { label: $t('demos.approval.leaveTypes.personal'), value: 'personal' },
  { label: $t('demos.approval.leaveTypes.sick'), value: 'sick' },
  { label: $t('demos.approval.leaveTypes.annual'), value: 'annual' },
];

const schema: VbenFormSchema[] = [
  {
    component: 'Select',
    fieldName: 'leaveType',
    label: $t('demos.approval.form.leaveType'),
    rules: 'required',
    componentProps: { allowClear: true, options: leaveTypeOptions },
  },
  {
    component: 'RangePicker',
    fieldName: 'dateRange',
    label: $t('demos.approval.form.dateRange'),
    rules: 'required',
    componentProps: { allowClear: true, valueFormat: 'YYYY-MM-DD' },
  },
  {
    component: 'InputNumber',
    fieldName: 'days',
    label: $t('demos.approval.form.days'),
    rules: 'required',
    componentProps: { min: 0.5, step: 0.5, class: 'w-full' },
  },
  {
    component: 'Textarea',
    fieldName: 'reason',
    label: $t('demos.approval.form.reason'),
    rules: 'required',
    componentProps: { rows: 3, maxlength: 500 },
  },
  {
    component: 'ApiSelect',
    fieldName: 'approvers',
    label: $t('demos.approval.form.approvers'),
    help: $t('demos.approval.form.approversTip'),
    componentProps: {
      config: 'user',
      mode: 'multiple',
      valueField: 'id',
      labelField: 'nickname',
    },
  },
  {
    component: 'PageSelect',
    fieldName: 'ccUsers',
    label: $t('demos.approval.form.ccUsers'),
    help: $t('demos.approval.form.ccUsersTip'),
    componentProps: {
      config: 'user',
      valueType: 'array',
    },
  },
];

const formOptions = reactive({
  schema,
  showDefaultActions: true,
  submitButtonOptions: { content: $t('demos.approval.form.submit'), loading: false },
  resetButtonOptions: { show: false },
  wrapperClass: 'grid-cols-1',
});

const [Form, formApi] = useVbenForm(formOptions as any);

interface LeaveFormValues {
  leaveType: string;
  dateRange: [string, string];
  days: number;
  reason: string;
  approvers?: string[];
  ccUsers?: string[];
}

/** VbenForm 提交事件：校验通过后携带表单值触发 */
async function handleSubmit(values: LeaveFormValues) {
  const leaveTypeLabel = leaveTypeOptions.find(item => item.value === values.leaveType)?.label ?? '';
  const [startDate, endDate] = values.dateRange;

  formOptions.submitButtonOptions.loading = true;
  try {
    await submitApprovalApi({
      bizType: 'demo_leave',
      bizId: `LV${Date.now()}`,
      title: `${leaveTypeLabel}${$t('demos.approval.titleSuffix')}（${startDate} ~ ${endDate}）`,
      snapshot: {
        leaveType: leaveTypeLabel,
        startDate,
        endDate,
        days: values.days,
        reason: values.reason,
      },
      // 自选审批人演示：作为第 1 个节点的审批人提交
      selectedApprovers: values.approvers?.length ? { 1: values.approvers } : undefined,
      // 自选抄送人演示：作为 selectedCc 提交（仅抄送节点开启允许自选时生效）
      selectedCc: values.ccUsers?.length ? values.ccUsers : undefined,
      // 回调演示：业务方提交时顺手带上自己的回调服务名（终态后引擎按名调取 onFinish）
      callbackService: 'DemoApprovalCallbackService',
    });
    message.success($t('demos.approval.submitSuccess'));
    formApi.resetForm();
    emit('submitted');
  } finally {
    formOptions.submitButtonOptions.loading = false;
  }
}
</script>

<template>
  <div class="max-w-[640px]">
    <Form @submit="handleSubmit" />
  </div>
</template>
