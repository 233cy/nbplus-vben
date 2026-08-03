<script setup lang="ts">
import type { Branch, Cond, CondOp, FieldDef } from '../data';

import { IconifyIcon } from '@vben/icons';

import { Button, Input, InputNumber, Select } from 'ant-design-vue';

import { $t } from '#/locales';

import { createCond, FIELD_TYPE_OPS, opText } from '../data';

/**
 * 分支条件构建器：
 * 组内条件为 and 关系、组间为 or 关系；按字段类型切换操作符与值输入控件。
 * 直接双向修改 branch.conditionGroups。
 */
const props = defineProps<{
  branch: Branch;
  fields: FieldDef[];
}>();

/** 字段下拉选项：显示名（字段名） */
function fieldOptions() {
  return props.fields.map(f => ({
    value: f.name,
    label: f.label ? `${f.label}（${f.name}）` : f.name,
  }));
}

/** 按条件当前字段类型给出可选操作符 */
function opsOf(cond: Cond): { label: string; value: CondOp }[] {
  const field = props.fields.find(f => f.name === cond.field);
  const ops = field ? FIELD_TYPE_OPS[field.type] : ['='] as CondOp[];
  return ops.map(op => ({ value: op, label: opText(op, $t) }));
}

/** 条件的字段定义（字段被删时返回 undefined） */
function fieldOf(cond: Cond): FieldDef | undefined {
  return props.fields.find(f => f.name === cond.field);
}

/** 切换字段：重置操作符为该类型首个允许值，并清空值 */
function onFieldChange(cond: Cond, name: string) {
  cond.field = name;
  const field = fieldOf(cond);
  cond.op = field ? FIELD_TYPE_OPS[field.type][0]! : '=';
  cond.value = undefined;
}

/** 切换操作符：in 为多值数组，其余为单值，切换时清空值 */
function onOpChange(cond: Cond, op: CondOp) {
  cond.op = op;
  cond.value = op === 'in' ? [] : undefined;
}

/** 组内添加条件（and） */
function addCond(groupIndex: number) {
  props.branch.conditionGroups[groupIndex]?.push(createCond());
}

/** 删除条件：组删空后整组移除 */
function removeCond(groupIndex: number, condIndex: number) {
  const group = props.branch.conditionGroups[groupIndex];
  if (!group) return;
  group.splice(condIndex, 1);
  if (group.length === 0) {
    props.branch.conditionGroups.splice(groupIndex, 1);
  }
}

/** 添加条件组（or） */
function addGroup() {
  props.branch.conditionGroups.push([createCond()]);
}

/** 删除整组 */
function removeGroup(groupIndex: number) {
  props.branch.conditionGroups.splice(groupIndex, 1);
}
</script>

<template>
  <div class="condition-builder">
    <template v-for="(group, gi) in branch.conditionGroups" :key="gi">
      <div v-if="gi > 0" class="cond-or">{{ $t('approval.designer.or') }}</div>
      <div class="cond-group">
        <div v-for="(cond, ci) in group" :key="ci" class="cond-row">
          <Select
            :value="cond.field || undefined"
            :options="fieldOptions()"
            :placeholder="$t('approval.designer.config.fieldPlaceholder')"
            show-search
            :filter-option="(input: string, option: any) => option.label.includes(input)"
            class="flex-1"
            @change="(v: any) => onFieldChange(cond, v)"
          />
          <Select
            :value="cond.op"
            :options="opsOf(cond)"
            class="w-20 shrink-0"
            @change="(v: any) => onOpChange(cond, v)"
          />
          <!-- 值输入：按字段类型切换控件 -->
          <InputNumber
            v-if="fieldOf(cond)?.type === 'number'"
            v-model:value="cond.value"
            :placeholder="$t('approval.designer.config.valuePlaceholder')"
            class="flex-1"
          />
          <Select
            v-else-if="fieldOf(cond)?.type === 'enum'"
            :value="cond.value"
            :mode="cond.op === 'in' ? 'multiple' : undefined"
            :options="(fieldOf(cond)?.options ?? []).map(o => ({ value: o, label: o }))"
            :placeholder="$t('approval.designer.config.enumValuePlaceholder')"
            class="flex-1"
            @change="(v: any) => (cond.value = v)"
          />
          <Input
            v-else
            v-model:value="cond.value"
            :disabled="!cond.field"
            :placeholder="$t('approval.designer.config.valuePlaceholder')"
            class="flex-1"
          />
          <IconifyIcon icon="lucide:x" class="cond-remove size-3.5" @click="removeCond(gi, ci)" />
        </div>
        <div class="flex items-center justify-between">
          <Button type="link" size="small" class="!px-0" @click="addCond(gi)">
            <IconifyIcon icon="lucide:plus" class="mr-1 inline size-3" />
            {{ $t('approval.designer.addConditionAnd') }}
          </Button>
          <Button
            v-if="branch.conditionGroups.length > 1"
            type="link"
            size="small"
            danger
            @click="removeGroup(gi)"
          >
            {{ $t('common.delete') }}
          </Button>
        </div>
      </div>
    </template>
    <Button block size="small" class="mt-2" @click="addGroup">
      <IconifyIcon icon="lucide:plus" class="size-3.5" />
      {{ $t('approval.designer.addConditionOr') }}
    </Button>
  </div>
</template>
