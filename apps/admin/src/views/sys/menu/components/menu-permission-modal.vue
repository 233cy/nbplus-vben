<script setup lang="ts">
import type { ControllerMethodItem, MenuAdminApi } from '#/api/sys/menuAdmin';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Checkbox, Form, FormItem, Modal, Radio, RadioButton, RadioGroup, Select } from 'ant-design-vue';

import { getControllerMethodsApi, getControllerPrefixesApi } from '#/api/sys/menuAdmin';
import { $t } from '#/locales';

type Mode = 'single' | 'multiple';

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
const prefixes = ref<string[]>([]);
const prefixesLoading = ref(false);
const scanLoading = ref(false);
const submitLoading = ref(false);
const methods = ref<ControllerMethodItem[]>([]);
const checkedMap = ref<Record<string, boolean>>({});
const permissionMap = ref<Record<string, string>>({});
const selectedKey = ref<string>('');

const isSingle = computed(() => props.mode === 'single');
const title = computed(() => {
  if (isSingle.value) {
    return $t('sys.menu.permission.pickTitle');
  }
  return $t('sys.menu.permission.generateTitle', { title: props.genItem?.title ?? '' });
});

const prefixOptions = computed(() => prefixes.value.map(p => ({ label: p, value: p })));

function methodKey(method: string, path: string): string {
  return `${method}:${path}`;
}

function resetState() {
  controllerPrefix.value = '';
  methods.value = [];
  checkedMap.value = {};
  permissionMap.value = {};
  selectedKey.value = '';
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

  return prefixes.value.find((p) => p === modulePath) ?? null;
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
    checkedMap.value = {};
    permissionMap.value = {};
    selectedKey.value = '';

    res.forEach((m) => {
      const key = methodKey(m.method, m.path);
      permissionMap.value[key] = m.permissions[0] ?? '';
      if (!isSingle.value) {
        checkedMap.value[key] = true;
      }
    });
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

  return methods.value
    .filter((m) => checkedMap.value[methodKey(m.method, m.path)])
    .map((m, index) => ({
      parentId: props.genItem!.id,
      type: 3 as MenuAdminApi.MenuType,
      title: m.title,
      permission: permissionMap.value[methodKey(m.method, m.path)],
      sort: (index + 1) * 10,
      status: 1,
    }));
}

async function handleOk() {
  if (isSingle.value) {
    const selected = methods.value.find((m) => methodKey(m.method, m.path) === selectedKey.value);
    if (!selected) return;
    const permission = permissionMap.value[selectedKey.value] ?? selected.permissions[0] ?? '';
    if (!permission) return;
    emit('select', { permission, title: selected.title });
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
    width="560px"
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

      <FormItem v-if="methods.length > 0" :label="$t('sys.menu.permission.method')">
        <div class="max-h-[320px] overflow-y-auto rounded border border-[hsl(var(--border))] p-2">
          <div
            v-for="m in methods"
            :key="methodKey(m.method, m.path)"
            class="mb-3 rounded p-2 last:mb-0 hover:bg-[hsl(var(--muted))]"
          >
            <div class="flex items-center gap-2">
              <template v-if="isSingle">
                <Radio :value="methodKey(m.method, m.path)" :checked="selectedKey === methodKey(m.method, m.path)" @click="selectedKey = methodKey(m.method, m.path)">
                  <span class="font-medium">[{{ m.method }}] {{ m.path }}</span>
                  <span class="ml-2 text-[hsl(var(--muted-foreground))]">{{ m.title }}</span>
                </Radio>
              </template>
              <template v-else>
                <Checkbox v-model:checked="checkedMap[methodKey(m.method, m.path)]">
                  <span class="font-medium">[{{ m.method }}] {{ m.path }}</span>
                  <span class="ml-2 text-[hsl(var(--muted-foreground))]">{{ m.title }}</span>
                </Checkbox>
              </template>
            </div>
            <div class="mt-2 pl-6">
              <template v-if="m.permissions.length === 1">
                <span class="text-sm text-[hsl(var(--muted-foreground))]">{{ m.permissions[0] }}</span>
              </template>
              <template v-else>
                <RadioGroup v-model:value="permissionMap[methodKey(m.method, m.path)]" size="small">
                  <RadioButton v-for="perm in m.permissions" :key="perm" :value="perm">
                    {{ perm }}
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
