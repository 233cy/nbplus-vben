<script setup lang="ts">
import type { NotificationTemplateApi } from '#/api/sys/notificationTemplate';

import { Input, Textarea } from 'ant-design-vue';

import { $t } from '#/locales';
import VariableQuickPick from '../variable-quick-pick.vue';
import { useVariableInsert } from '../../composables/useVariableInsert';

const props = defineProps<{
  variables?: Record<string, string>;
}>();

const modelValue = defineModel<NotificationTemplateApi.TemplateItemSave>({ default: () => ({}) });

const { handleFocus, insertVariable } = useVariableInsert(modelValue);
</script>

<template>
  <div class="space-y-4">
    <VariableQuickPick
      :variables="props.variables"
      :hint="$t('sys.notification-template.clickToInsertVariable')"
      @insert="insertVariable"
    />

    <div>
      <label class="mb-1 block text-sm">标题</label>
      <Input
        v-model:value="modelValue.subject"
        placeholder="标题"
        @focus="handleFocus('subject', $event)"
      />
    </div>
    <div>
      <label class="mb-1 block text-sm">内容</label>
      <Textarea
        v-model:value="modelValue.content"
        :rows="6"
        placeholder="内容"
        @focus="handleFocus('content', $event)"
      />
    </div>
    <div>
      <label class="mb-1 block text-sm">渠道扩展参数（JSON）</label>
      <Textarea
        :value="JSON.stringify(modelValue.extra || {}, null, 2)"
        :rows="5"
        placeholder="{}"
        @change="(e: any) => modelValue.extra = JSON.parse((e?.target as HTMLTextAreaElement)?.value || '{}')"
      />
    </div>
  </div>
</template>
