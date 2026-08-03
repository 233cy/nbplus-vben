<script setup lang="ts">
import type { DeptDutyValue } from './dept-duty-select';

import { computed, nextTick, ref, watch } from 'vue';

import { FormItem } from 'ant-design-vue';

import { getOptionsApi } from '#/api/core/options';
import ApiSelect from '#/components/page-select/api-select.vue';
import PageSelect from '#/components/page-select/index.vue';
import type { PageSelectConfig } from '#/components/page-select/types';
import { $t } from '#/locales';

/**
 * 部门 + 职务联动选择（职务模块对外共享能力）.
 *
 * 只提供"两个 select 的联动"：部门（树）→ 职务（按部门过滤，切部门清空重选）；
 * 弹窗壳、表单提交等由使用方自理。单选（一条任职）/多选（审批指定职务等场景）均支持。
 *
 * 用法：
 *   单选（用户管理-添加任职）：<DeptDutySelect v-model="org" dept-required duty-required />
 *   多选（审批设计器）：       <DeptDutySelect v-model="org" multiple :show-labels="false" />
 */

const props = withDefaults(defineProps<{
  modelValue: DeptDutyValue;
  /** 职务多选（PageSelect 表格选择）；默认单选（ApiSelect 下拉） */
  multiple?: boolean;
  /** 部门必填（未选部门时职务不可选）；默认 false（清空部门=全部职务里挑） */
  deptRequired?: boolean;
  /** 职务必填标记（仅控制 label 上的必填星号，校验由使用方负责） */
  dutyRequired?: boolean;
  /** 是否渲染内置 FormItem label（使用方自带 label 时关闭） */
  showLabels?: boolean;
}>(), {
  multiple: false,
  deptRequired: false,
  dutyRequired: false,
  showLabels: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: DeptDutyValue];
}>();

const deptId = ref<string>(props.modelValue.deptId ?? '');
const dutyId = ref<string>(props.modelValue.dutyId ?? '');
const dutyIds = ref<string[]>(props.modelValue.dutyIds ?? []);
const dutyNames = ref<string[]>(props.modelValue.dutyNames ?? []);

const deptSelectRef = ref<InstanceType<typeof ApiSelect> | null>(null);
const dutySelectRef = ref<InstanceType<typeof ApiSelect> | null>(null);

/** 职务过滤参数：已选部门按部门过滤；未选部门时——必填则不可选（传 'null'），非必填查全部 */
const dutyParams = computed(() => {
  if (deptId.value) return { deptId: deptId.value };
  return props.deptRequired ? { deptId: 'null' } : {};
});

/** 职务 PageSelect 配置（多选模式）：列显示部门/职务/编码 */
const dutyConfig: PageSelectConfig = {
  type: 'list',
  api: params => getOptionsApi('post', params),
  columns: [
    { field: 'deptName', title: $t('sys.user.fields.deptId') },
    { field: 'name', title: $t('sys.user.fields.dutyId') },
    { field: 'code', title: $t('common.code') },
  ],
  labelField: 'name',
  valueField: 'id',
  title: $t('sys.user.fields.dutyId'),
};

/** 从 ApiSelect 已加载 options 反查名称（含树形 children 递归） */
function findName(options: any[], id: string): string {
  for (const option of options || []) {
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

/** 汇总当前选择并同步 v-model */
function syncValue() {
  const deptName = deptId.value ? findName(deptSelectRef.value?.options || [], deptId.value) : '';
  if (props.multiple) {
    emit('update:modelValue', {
      deptId: deptId.value,
      deptName,
      dutyIds: [...dutyIds.value],
      dutyNames: [...dutyNames.value],
    });
    return;
  }
  emit('update:modelValue', {
    deptId: deptId.value,
    deptName,
    dutyId: dutyId.value,
    dutyName: dutyId.value ? findName(dutySelectRef.value?.options || [], dutyId.value) : '',
  });
}

// 部门变化：职务清空重选（单选需手动 reload，多选走 params 联动自动刷新）
watch(deptId, async () => {
  dutyId.value = '';
  dutyIds.value = [];
  dutyNames.value = [];
  syncValue();
  await nextTick();
  dutySelectRef.value?.reload();
});

function onDutyMultiChange(value: string | string[]) {
  dutyIds.value = Array.isArray(value) ? value : [value].filter(Boolean);
  syncValue();
}

function onDeptChange() {
  syncValue();
}

function onDutyChange() {
  syncValue();
}

/** 手动刷新两个选择器（供使用方刷新按钮调用） */
function reload() {
  deptSelectRef.value?.reload();
  dutySelectRef.value?.reload();
}

defineExpose({ reload });
</script>

<template>
  <div class="w-full" :class="showLabels ? 'space-y-4' : 'space-y-2'">
    <FormItem v-if="showLabels" :label="$t('sys.user.fields.deptId')" :required="deptRequired" class="mb-0">
      <ApiSelect ref="deptSelectRef" v-model:value="deptId" config="dept" :immediate="false" :placeholder="$t('ui.placeholder.select')" allow-clear class="w-full" @change="onDeptChange" />
    </FormItem>
    <ApiSelect v-else ref="deptSelectRef" v-model:value="deptId" config="dept" :immediate="false" :placeholder="$t('sys.user.fields.deptId')" allow-clear class="w-full" @change="onDeptChange" />

    <FormItem v-if="showLabels" :label="$t('sys.user.fields.dutyId')" :required="dutyRequired" class="mb-0">
      <ApiSelect v-if="!multiple" ref="dutySelectRef" v-model:value="dutyId" config="post" :immediate="false" :params="dutyParams" :placeholder="$t('ui.placeholder.select')" class="w-full" @change="onDutyChange" />
      <PageSelect v-else :model-value="dutyIds" :config="dutyConfig" :params="dutyParams" value-type="array" @update:model-value="onDutyMultiChange" />
    </FormItem>
    <template v-else>
      <ApiSelect v-if="!multiple" ref="dutySelectRef" v-model:value="dutyId" config="post" :immediate="false" :params="dutyParams" :placeholder="$t('sys.user.fields.dutyId')" class="w-full" @change="onDutyChange" />
      <PageSelect v-else :model-value="dutyIds" :config="dutyConfig" :params="dutyParams" value-type="array" @update:model-value="onDutyMultiChange" />
    </template>
  </div>
</template>
