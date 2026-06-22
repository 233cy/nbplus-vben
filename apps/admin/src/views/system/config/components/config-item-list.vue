<script setup lang="ts">
import type { ConfigApi } from '#/api/system/config';

import { IconifyIcon } from '@vben/icons';

import { Button, DatePicker, Input, InputNumber, InputPassword, Popconfirm, RadioGroup, Select, Switch, Tag, Textarea, TimePicker, Tooltip } from 'ant-design-vue';

import UpImg from '#/components/upload/upImg.vue';
import { $t } from '#/locales';

interface Props {
  items: ConfigApi.ConfigItem[];
  editValues: Record<string, string>;
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:editValue', key: string, value: string): void;
  (e: 'markAsSys', item: ConfigApi.ConfigItem): void;
  (e: 'togglePublic', item: ConfigApi.ConfigItem): void;
  (e: 'edit', item: ConfigApi.ConfigItem): void;
  (e: 'delete', item: ConfigApi.ConfigItem): void;
  (e: 'copyKey', key: string): void;
}>();

function onSwitchChange(key: string, checked: boolean | string) {
  emit('update:editValue', key, checked ? '1' : '0');
}
</script>

<template>
  <div class="divide-y dark:divide-gray-700">
    <div v-for="item in items" :key="item.key" class="flex items-start gap-4 px-6 py-4">
      <!-- 标签 + KEY -->
      <div class="w-56 shrink-0">
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
            {{ item.label }}
          </span>
          <Tag v-if="item.isSys" color="gold" class="ml-1 text-xs">
            {{ $t('system.config.isSysTag') }}
          </Tag>
        </div>
        <div class="mt-1 flex items-center gap-1">
          <code class="select-all font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
            {{ item.key }}
          </code>
          <Tooltip :title="$t('system.config.copySuccess')">
            <Button type="text" size="small" class="flex items-center p-0 text-gray-400 hover:text-blue-500" @click="emit('copyKey', item.key)">
              <span class="i-ant-design:copy-outlined text-sm"></span>
            </Button>
          </Tooltip>
        </div>
        <div v-if="item.remark" class="mt-0.5 text-xs text-gray-400">{{ item.remark }}</div>
      </div>

      <!-- 输入控件 -->
      <div class="flex-1">
        <Switch
          v-if="item.component === 'Switch'"
          :checked="editValues[item.key] === '1' || editValues[item.key] === 'true'"
          @change="checked => onSwitchChange(item.key, checked as boolean)"
        />
        <InputNumber
          v-else-if="item.component === 'InputNumber'"
          :value="Number(editValues[item.key])"
          class="w-full"
          @change="val => emit('update:editValue', item.key, String(val ?? ''))"
        />
        <Textarea
          v-else-if="item.component === 'Textarea'"
          :value="editValues[item.key]"
          :placeholder="item.isEncrypted ? $t('system.config.encryptedPlaceholder') : ''"
          :rows="3"
          @change="e => emit('update:editValue', item.key, e.target.value || '')"
        />
        <Select
          v-else-if="item.component === 'Select'"
          :value="editValues[item.key]"
          class="w-full"
          allow-clear
          @change="val => emit('update:editValue', item.key, val as string)"
        />
        <RadioGroup v-else-if="item.component === 'RadioGroup'" :value="editValues[item.key]" @change="e => emit('update:editValue', item.key, e.target.value || '')" />
        <DatePicker
          v-else-if="item.component === 'DatePicker'"
          :value="editValues[item.key] || undefined"
          class="w-full"
          @change="(_, ds) => emit('update:editValue', item.key, ds as string)"
        />
        <TimePicker
          v-else-if="item.component === 'TimePicker'"
          :value="editValues[item.key] || undefined"
          class="w-full"
          @change="(_, ts) => emit('update:editValue', item.key, ts as string)"
        />
        <UpImg v-else-if="item.component === 'UpImg'" :model-value="editValues[item.key]" @update:model-value="val => emit('update:editValue', item.key, val ?? '')" />
        <InputPassword
          v-else-if="item.component === 'InputPassword' || item.isEncrypted"
          :value="editValues[item.key]"
          :placeholder="item.isEncrypted ? $t('system.config.encryptedPlaceholder') : ''"
          @change="e => emit('update:editValue', item.key, e.target.value || '')"
        />
        <wang-editor v-else-if="item.component === 'Edit'" :model-value="editValues[item.key]" @update:model-value="val => emit('update:editValue', item.key, val as string)" />
        <Input v-else :value="editValues[item.key]" @change="e => emit('update:editValue', item.key, e.target.value || '')" />
      </div>

      <!-- 操作按钮 -->
      <div class="flex shrink-0 items-center gap-2">
        <Popconfirm v-if="!item.isSys" :title="$t('system.config.markAsSysConfirm')" @confirm="emit('markAsSys', item)">
          <Tooltip :title="$t('system.config.markAsSys')">
            <Button>
              <IconifyIcon icon="ant-design:lock-outlined" class="text-amber-500" />
            </Button>
          </Tooltip>
        </Popconfirm>
        <Tooltip v-else :title="$t('system.config.isSysTag')">
          <Button disabled>
            <IconifyIcon icon="ant-design:lock-outlined" />
          </Button>
        </Tooltip>

        <Tooltip :title="item.isPublic ? $t('system.config.togglePublicOff') : $t('system.config.togglePublicOn')">
          <Button :type="item.isPublic ? 'primary' : 'default'" @click="emit('togglePublic', item)">
            <IconifyIcon :icon="item.isPublic ? 'ant-design:eye-outlined' : 'ant-design:eye-invisible-outlined'" />
          </Button>
        </Tooltip>

        <Tooltip :title="$t('system.config.editItem')">
          <Button @click="emit('edit', item)">
            <IconifyIcon icon="ant-design:edit-outlined" />
          </Button>
        </Tooltip>

        <Popconfirm v-if="!item.isSys" :title="$t('system.config.confirmDelete')" @confirm="emit('delete', item)">
          <Button danger>
            <IconifyIcon icon="ant-design:delete-outlined" />
          </Button>
        </Popconfirm>
        <Tooltip v-else :title="$t('system.config.isSysTag')">
          <Button danger disabled>
            <IconifyIcon icon="ant-design:delete-outlined" />
          </Button>
        </Tooltip>
      </div>
    </div>

    <div v-if="items.length === 0 && !loading" class="py-16 text-center text-gray-400">
      {{ $t('system.config.empty') }}
    </div>
  </div>
</template>
