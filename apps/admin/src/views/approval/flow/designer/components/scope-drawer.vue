<script setup lang="ts">
import type { PageSelectConfig } from '#/components/page-select/types';

import { computed } from 'vue';

import { Drawer, Form, FormItem, Switch } from 'ant-design-vue';

import PageSelect from '#/components/page-select/index.vue';
import { rolePageSelectConfig } from '#/components/page-select/configs';
import { $t } from '#/locales';

import { useFlowDesignerContext } from '../composables/useFlowDesigner';

import DutyPickerList from './duty-picker-list.vue';

/**
 * 发起人范围抽屉：点击发起人卡片打开
 * all=所有人可发起；关闭后按 人员/角色/职务/部门 四类限定（保存时取并集）
 */
const designer = useFlowDesignerContext();

const scope = computed(() => designer.state.initiatorScope);

const open = computed({
  get: () => designer.state.scopeDrawerOpen,
  set: v => {
    designer.state.scopeDrawerOpen = v;
  },
});

/** 角色选择：自定义 config，valueField 用 code（存 roleCodes） */
const roleConfig: PageSelectConfig = {
  ...rolePageSelectConfig(),
  valueField: 'code',
};

/** 打开「所有人可发起」时清空已限定的四类范围，避免保存残留 */
function onAllChange(checked: boolean) {
  if (!checked) return;
  scope.value.userIds = [];
  scope.value.roleCodes = [];
  scope.value.dutyIds = [];
  scope.value.deptIds = [];
}
</script>

<template>
  <Drawer v-model:open="open" :title="$t('approval.designer.scope.title')" :width="520">
    <Form layout="vertical">
      <FormItem :label="$t('approval.designer.scope.all')">
        <Switch v-model:checked="scope.all" @change="onAllChange($event as boolean)" />
      </FormItem>

      <template v-if="!scope.all">
        <FormItem :label="$t('approval.designer.scope.users')">
          <PageSelect v-model="scope.userIds" config="user" value-type="array" />
        </FormItem>

        <FormItem :label="$t('approval.designer.scope.roles')">
          <PageSelect v-model="scope.roleCodes" :config="roleConfig" value-type="array" />
        </FormItem>

        <FormItem :label="$t('approval.designer.scope.duties')">
          <DutyPickerList v-model="scope.dutyIds" />
        </FormItem>

        <FormItem :label="$t('approval.designer.scope.depts')">
          <PageSelect v-model="scope.deptIds" config="dept" :multiple="true" value-type="array" />
        </FormItem>
      </template>
    </Form>
  </Drawer>
</template>
