<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { Button, message, Spin } from 'ant-design-vue';

import { $t } from '#/locales';

import ConfigForm from './components/config-form.vue';
import ConfigItemList from './components/config-item-list.vue';
import GroupMenu from './components/group-menu.vue';
import { useConfigForm, useConfigGroups, useConfigItems } from './composables';

defineOptions({ name: 'ConfigPage' });

const groups = useConfigGroups();
const items = useConfigItems(groups.activeGroup);

const activeGroupLabel = computed(() => {
  const found = groups.groups.value.find((g) => g.groups === groups.activeGroup.value);
  return found ? groups.groupsLabel(found) : groups.activeGroup.value;
});

/** 当前分组在所有分组中的索引位置 */
const activeGroupIndex = computed(() => {
  return groups.groups.value.findIndex((g) => g.groups === groups.activeGroup.value);
});

function copyKey(key: string) {
  navigator.clipboard.writeText(key).then(() => {
    message.success($t('system.config.copySuccess'));
  });
}

const form = useConfigForm({
  activeGroup: groups.activeGroup,
  groups: groups.groups,
  onSuccess: items.loadConfig,
  onGroupsChange: groups.loadGroups,
});

onMounted(() => {
  groups.loadGroups();
});
</script>

<template>
  <div class="flex h-full gap-4 p-4">
    <GroupMenu
      :groups="groups.groups.value"
      :active-group="groups.activeGroup.value"
      @update:active-group="groups.activeGroup.value = $event"
      @reload="groups.loadGroups()"
    />

    <div class="flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
      <!-- 顶部操作 -->
      <div class="flex items-center justify-between border-b px-6 py-3 dark:border-gray-700">
        <span class="text-base font-medium">{{ activeGroupLabel }}</span>
        <div class="flex gap-2">
          <Button type="primary" size="small" @click="form.openCreate"> + {{ $t('system.config.addItem') }} </Button>
        </div>
      </div>

      <!-- 配置列表 -->
      <Spin :spinning="items.loading.value" class="flex-1 overflow-auto">
        <ConfigItemList
          :items="items.configItems.value"
          :edit-values="items.editValues.value"
          :group-index="activeGroupIndex"
          :loading="items.loading.value"
          @update:edit-value="items.updateEditValue"
          @mark-as-sys="items.handleMarkAsSys"
          @toggle-public="items.handleTogglePublic"
          @edit="form.openEdit"
          @delete="items.handleDelete"
          @copy-key="copyKey"
          @reload="items.loadConfig()"
        />
      </Spin>

      <!-- 底部保存按钮 -->
      <div class="flex justify-end border-t px-6 py-3 dark:border-gray-700">
        <Button type="primary" :loading="items.saving.value" @click="items.handleSave">
          {{ $t('system.config.save') }}
        </Button>
      </div>
    </div>

    <ConfigForm
      v-model:visible="form.modalVisible.value"
      v-model:form="form.formState.value"
      :mode="form.modalMode.value"
      :loading="form.modalLoading.value"
      :editing-is-sys="form.editingIsSys.value"
      :component-options="form.componentOptions.value"
      :group-options="form.groupOptions.value"
      @submit="form.handleSubmit"
    />
  </div>
</template>
