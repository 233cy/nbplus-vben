<script setup lang="ts">
import type { ControllerMethodItem, ControllerPrefixItem, MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Checkbox, Form, FormItem, Modal, RadioButton, RadioGroup, Select } from 'ant-design-vue';

import { getControllerMethodsApi, getControllerPrefixesApi } from '#/api/sys/menuAdmin';
import { $t } from '#/locales';

type Mode = 'single' | 'multiple';

interface PermissionGroup {
  permission: string;
  titles: string[];
}

const props = defineProps<{
  mode: Mode;
  visible: boolean;
  genItem?: MenuAdminApi.MenuItem | null;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  submit: [items: MenuAdminApi.SaveParams[]];
  select: [payload: { permission: string; title: string }];
}>();

const showVisible = defineModel<boolean>('visible', { required: true });

const controllerPrefix = ref('');
const prefixes = ref<ControllerPrefixItem[]>([]);
const prefixesLoading = ref(false);
const scanLoading = ref(false);
const submitLoading = ref(false);
const methods = ref<ControllerMethodItem[]>([]);
const selectedPermissions = ref<Record<string, boolean>>({});
const titleMap = ref<Record<string, string>>({});
const selectedSingle = ref<string>('');

const isSingle = computed(() => props.mode === 'single');
const title = computed(() => {
  if (isSingle.value) {
    return $t('sys.menu.permission.pickTitle');
  }
  return $t('sys.menu.permission.generateTitle', { title: props.genItem?.title ?? '' });
});

const prefixOptions = computed(() => prefixes.value.map(p => ({ label: p.prefix, value: p.prefix })));

const permissionGroups = computed<PermissionGroup[]>(() => {
  const map = new Map<string, Set<string>>();
  methods.value.forEach((m) => {
    m.permissions.forEach((permission) => {
      if (!map.has(permission)) {
        map.set(permission, new Set());
      }
      map.get(permission)!.add(m.title);
    });
  });

  return Array.from(map.entries()).map(([permission, titles]) => ({
    permission,
    titles: Array.from(titles),
  }));
});

function resetState() {
  controllerPrefix.value = '';
  methods.value = [];
  selectedPermissions.value = {};
  titleMap.value = {};
  selectedSingle.value = '';
}

async function loadPrefixes(force = false) {
  if (!force && prefixes.value.length > 0) {
    return;
  }
  prefixesLoading.value = true;
  try {
    prefixes.value = await getControllerPrefixesApi();
  } catch {
    prefixes.value = [];
  } finally {
    prefixesLoading.value = false;
  }
}

function inferControllerPrefix(): string | null {
  const permission = props.genItem?.permission?.trim();
  if (!permission) return null;

  const segments = permission.split(':');
  if (segments.length < 3) return null;

  const modulePath = segments
    .slice(0, -1)
    .map((s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase())
    .join('/')
    .replace(/^adm/, '/admin');

  return prefixes.value.find((p) => p.prefix === modulePath)?.prefix ?? null;
}

async function handleScan() {
  const prefix = controllerPrefix.value.trim();
  if (!prefix) {
    return;
  }
  scanLoading.value = true;
  try {
    const res = await getControllerMethodsApi(prefix);
    methods.value = res;

    const selected: Record<string, boolean> = {};
    const titles: Record<string, string> = {};

    permissionGroups.value.forEach((g) => {
      selected[g.permission] = true;
      titles[g.permission] = g.titles[0] ?? '';
    });

    selectedPermissions.value = selected;
    titleMap.value = titles;
    selectedSingle.value = permissionGroups.value[0]?.permission ?? '';
  } finally {
    scanLoading.value = false;
  }
}

function handleRefresh() {
  loadPrefixes(true);
}

function handleCancel() {
  showVisible.value = false;
}

function buildSaveParams(): MenuAdminApi.SaveParams[] {
  if (!props.genItem) return [];

  const items: MenuAdminApi.SaveParams[] = [];
  let sort = 10;

  permissionGroups.value.forEach((g) => {
    if (!selectedPermissions.value[g.permission]) return;
    items.push({
      parentId: props.genItem!.id,
      type: 3 as MenuAdminApi.MenuType,
      title: titleMap.value[g.permission] ?? g.titles[0] ?? '',
      permission: g.permission,
      sort,
      status: 1,
    });
    sort += 10;
  });

  return items;
}

async function handleOk() {
  if (isSingle.value) {
    const group = permissionGroups.value.find((g) => g.permission === selectedSingle.value);
    if (!group) return;
    const title = titleMap.value[selectedSingle.value] ?? group.titles[0] ?? '';
    if (!title) return;
    emit('select', { permission: group.permission, title });
    showVisible.value = false;
    return;
  }

  const items = buildSaveParams();
  if (items.length === 0) return;

  submitLoading.value = true;
  try {
    emit('submit', items);
  } finally {
    submitLoading.value = false;
  }
}

watch(showVisible, async (visible) => {
  if (!visible) return;
  resetState();
  await loadPrefixes();
  const inferred = inferControllerPrefix();
  if (inferred) {
    controllerPrefix.value = inferred;
    await handleScan();
  }
});
</script>

<template>
  <Modal
    v-model:open="showVisible"
    :confirm-loading="submitLoading"
    width="600px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <template #title>
      <div class="flex w-full items-center justify-between pr-8">
        <span>{{ title }}</span>
        <span @click.prevent.stop="handleRefresh">
          <IconifyIcon icon="mdi:refresh" class="size-5 cursor-pointer text-foreground/70 transition-colors hover:text-foreground" />
        </span>
      </div>
    </template>

    <Form layout="vertical" class="mt-4">
      <FormItem :label="$t('sys.menu.permission.controllerPrefix')" required>
        <div class="flex gap-2">
          <Select
            v-model:value="controllerPrefix"
            :options="prefixOptions"
            :loading="prefixesLoading"
            show-search
            allow-clear
            :placeholder="$t('sys.menu.placeholder.controllerPrefix')"
            class="flex-1"
          />
          <Button :loading="scanLoading" @click="handleScan">{{ $t('sys.menu.permission.scan') }}</Button>
        </div>
      </FormItem>

      <FormItem v-if="permissionGroups.length > 0" :label="$t('sys.menu.permission.method')">
        <div class="max-h-[360px] overflow-y-auto rounded border border-[hsl(var(--border))] p-2">
          <div
            v-for="g in permissionGroups"
            :key="g.permission"
            class="mb-3 rounded p-2 last:mb-0 hover:bg-[hsl(var(--muted))]"
          >
            <div class="flex items-center gap-2">
              <template v-if="isSingle">
                <RadioGroup v-model:value="selectedSingle" >
                  <RadioButton :value="g.permission">{{ g.permission }}</RadioButton>
                </RadioGroup>
              </template>
              <template v-else>
                <Checkbox v-model:checked="selectedPermissions[g.permission]">
                  <span class="font-medium">{{ g.permission }}</span>
                </Checkbox>
              </template>
            </div>
            <div class="mt-2 pl-6">
              <template v-if="g.titles.length === 1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">{{ g.titles[0] }}</span>
              </template>
              <template v-else>
                <RadioGroup v-model:value="titleMap[g.permission]" >
                  <RadioButton v-for="t in g.titles" :key="t" :value="t">
                    {{ t }}
                  </RadioButton>
                </RadioGroup>
              </template>
            </div>
          </div>
        </div>
      </FormItem>
    </Form>
  </Modal>
</template>
