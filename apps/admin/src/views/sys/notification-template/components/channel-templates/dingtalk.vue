<script setup lang="ts">
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { computed } from 'vue';

import { Input, Select, Switch, Textarea } from 'ant-design-vue';

import { $t } from '#/locales';
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

const msgTypeOptions = [
  { label: 'Markdown', value: 'markdown' },
  { label: 'Text', value: 'text' },
];
</script>

<template>
  <div class="space-y-4">
    <VariableQuickPick
      :variables="props.variables"
      :hint="$t('sys.notification-template.clickToInsertVariable')"
      @insert="insertVariable"
    />

    <div>
      <label class="mb-1 block text-sm">消息类型</label>
      <Select v-model:value="extra.msgType" :options="msgTypeOptions" class="w-full" />
    </div>
    <div v-if="extra.msgType === 'markdown'">
      <label class="mb-1 block text-sm">标题</label>
      <Input
        v-model:value="modelValue.subject"
        placeholder="Markdown 消息标题"
        @focus="handleFocus('subject', $event)"
      />
    </div>
    <div>
      <label class="mb-1 block text-sm">内容</label>
      <Textarea
        v-model:value="modelValue.content"
        :rows="8"
        placeholder="支持 双大括号变量名 占位符"
        @focus="handleFocus('content', $event)"
      />
    </div>
    <div>
      <label class="mb-1 block text-sm">@ 手机号（英文逗号分隔）</label>
      <Input v-model:value="extra.atMobiles" placeholder="13800138000,13900139000" />
    </div>
    <div class="flex items-center gap-2">
      <Switch v-model:checked="extra.atAll" :checked-value="true" :un-checked-value="false" />
      <span class="text-sm">@ 所有人</span>
    </div>
  </div>
</template>
