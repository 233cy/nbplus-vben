<script setup lang="ts">
import type { ProfileApi } from '#/api/core/profile';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { Avatar, Badge, Card, Col, message, Popconfirm, Row, Spin, Tag, Tooltip } from 'ant-design-vue';

import { getMyDevicesApi, getProfileInfoApi, removeMyDeviceApi } from '#/api/core/profile';
import OnlineDevices from '#/components/online-devices/index.vue';
import { $t } from '#/locales';
import { useAdminUserStore } from '#/store/user';
import { formatUnixTime } from '#/utils/time';

const router = useRouter();
const userStore = useUserStore();
const adminUserStore = useAdminUserStore();

const loading = ref(true);
const devicesLoading = ref(false);
const profile = ref<null | ProfileApi.ProfileInfo>(null);
const devices = ref<ProfileApi.OnlineDevice[]>([]);

async function loadDevices() {
  devicesLoading.value = true;
  try {
    devices.value = await getMyDevicesApi();
  } finally {
    devicesLoading.value = false;
  }
}

onMounted(async () => {
  try {
    [profile.value] = await Promise.all([getProfileInfoApi(), loadDevices()]);
  } finally {
    loading.value = false;
  }
});

async function kickDevice(tmpId: string) {
  await removeMyDeviceApi(tmpId);
  message.success('已下线');
  await loadDevices();
}

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return $t('workspace.greetingNight');
  if (hour < 12) return $t('workspace.greetingMorning');
  if (hour < 14) return $t('workspace.greetingNoon');
  if (hour < 18) return $t('workspace.greetingAfternoon');
  return $t('workspace.greetingEvening');
});

const shortcuts = [
  { icon: 'lucide:sliders-horizontal', path: '/system/config', title: $t('workspace.shortcutConfig') },
  { icon: 'lucide:user', path: '/profile', title: $t('workspace.shortcutProfile') },
];

const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
const appEnv = import.meta.env.MODE;
const appTitle = import.meta.env.VITE_APP_TITLE;
</script>

<template>
  <div class="p-4 md:p-6">
    <Spin :spinning="loading">
      <Row :gutter="[16, 16]">
        <Col :span="24" :md="14">
          <Card :bordered="false" class="h-full">
            <div class="flex items-center gap-4">
              <Avatar :size="64" :src="userStore.userInfo?.avatar" class="shrink-0 bg-primary">
                {{ userStore.userInfo?.realName?.charAt(0) }}
              </Avatar>
              <div class="min-w-0">
                <div class="text-lg font-semibold">{{ greeting }}，{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</div>
                <div class="mt-1 text-sm text-gray-500">
                  <span>{{ $t('workspace.username') }}：{{ userStore.userInfo?.username }}</span>
                </div>
                <div class="mt-1 flex flex-wrap gap-2 text-sm text-gray-500">
                  <span v-if="adminUserStore.email"> {{ $t('workspace.email') }}：{{ adminUserStore.email }} </span>
                  <span v-if="adminUserStore.phone"> {{ $t('workspace.phone') }}：{{ adminUserStore.phone }} </span>
                </div>
                <div v-if="profile" class="mt-1 text-xs text-gray-400">
                  {{ $t('workspace.lastLogin') }}：{{ formatUnixTime(profile.lastLoginTime) }}
                  <span v-if="profile.lastLoginIp" class="ml-2">IP：{{ profile.lastLoginIp }}</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col :span="24" :md="10">
          <Card :bordered="false" :title="$t('workspace.securityTitle')" class="h-full">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">{{ $t('workspace.securityEmail') }}</span>
                <Tag :color="profile?.email ? 'success' : 'default'">
                  {{ profile?.email ? $t('workspace.bound') : $t('workspace.unbound') }}
                </Tag>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">{{ $t('workspace.securityPhone') }}</span>
                <Tag :color="profile?.phone ? 'success' : 'default'">
                  {{ profile?.phone ? $t('workspace.bound') : $t('workspace.unbound') }}
                </Tag>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">{{ $t('workspace.securityTotp') }}</span>
                <Tooltip :title="profile?.totpEnabled ? $t('workspace.totpEnabledTip') : $t('workspace.totpDisabledTip')">
                  <Badge :status="profile?.totpEnabled ? 'success' : 'warning'" :text="profile?.totpEnabled ? $t('workspace.enabled') : $t('workspace.disabled')" />
                </Tooltip>
              </div>
            </div>
          </Card>
        </Col>

        <Col :span="24" :md="12">
          <Card :bordered="false" :title="$t('workspace.shortcutTitle')">
            <Row :gutter="[12, 12]">
              <Col v-for="item in shortcuts" :key="item.path" :span="12">
                <div
                  class="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-100 p-4 transition hover:border-primary hover:bg-primary/5"
                  @click="router.push(item.path)"
                >
                  <span class="mb-2 text-2xl text-primary">
                    <IconifyIcon :icon="item.icon" class="text-2xl" />
                  </span>
                  <span class="text-sm text-gray-700">{{ item.title }}</span>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col :span="24" :md="12">
          <Card :bordered="false" :title="$t('workspace.systemTitle')">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">{{ $t('workspace.systemName') }}</span>
                <span class="text-sm font-medium">{{ appTitle }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">{{ $t('workspace.systemVersion') }}</span>
                <Tag color="blue">v{{ appVersion }}</Tag>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">{{ $t('workspace.systemEnv') }}</span>
                <Tag :color="appEnv === 'production' ? 'red' : 'green'">{{ appEnv }}</Tag>
              </div>
            </div>
          </Card>
        </Col>

        <Col :span="24">
          <Card :bordered="false" :title="`在线设备（${devices.length}）`">
            <OnlineDevices :devices="devices" :loading="devicesLoading">
              <template #action="{ device }">
                <Popconfirm title="确认下线该设备？" @confirm="kickDevice(device.tmpId)">
                  <Tag color="red" class="cursor-pointer hover:opacity-80">下线</Tag>
                </Popconfirm>
              </template>
            </OnlineDevices>
          </Card>
        </Col>
      </Row>
    </Spin>
  </div>
</template>
