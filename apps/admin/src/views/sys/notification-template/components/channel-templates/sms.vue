<script setup lang="ts">
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { computed } from 'vue';

import { Input, Textarea } from 'ant-design-vue';

import VariableQuickPick from '../variable-quick-pick.vue';
import { useVariableInsert } from '../../composables/useVariableInsert';

const props = defineProps<{
  variables?: Record<string, string>;
}>();

const modelValue = defineModel<NotificationTemplateApi.TemplateItemSave>({ default: () => ({}) });

const extra = computed({
  get: () => modelValue.value.extra || {},
  set: (value) => {
    modelValue.value.extra = value;
  },
});

const { handleFocus, insertVariable } = useVariableInsert(modelValue);
</script>

<template>
  <div class="space-y-4">
    <VariableQuickPick
      :variables="props.variables"
      hint="点击变量可插入到当前聚焦的输入框；短信按变量声明顺序依次映射为服务商的 param1、param2..."
      @insert="insertVariable"
    />

    <div>
      <label class="mb-1 block text-sm">
        <span class="text-red-500">*</span>
        短信模板编码
      </label>
      <Input
        v-model:value="extra.templateCode"
        placeholder="短信平台侧审核通过的模板 ID，如创蓝云智后台的 templateId"
      />
    </div>
    <div>
      <label class="mb-1 block text-sm">内容预览 / 备注</label>
      <Textarea
        v-model:value="modelValue.content"
        :rows="4"
        placeholder="仅作本地预览或备注，实际发送以短信平台模板为准；支持 {{变量名}} 占位符"
        @focus="handleFocus('content', $event)"
      />
    </div>
  </div>
</template>
