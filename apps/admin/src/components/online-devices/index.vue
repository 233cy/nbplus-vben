<script setup lang="ts">
import { computed, useSlots } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Spin, Tag } from 'ant-design-vue';

import { formatUnixTime } from '#/utils/time';

export interface DeviceInfo {
  deviceType?: string;   // smartphone / tablet / desktop
  deviceBrand?: string;
  deviceModel?: string;
  os?: string;
  browser?: string;
}

export interface OnlineDevice {
  tmpId: string;
  ip: string;
  loginAt: number;
  isCurrent?: boolean;
  deviceInfo?: DeviceInfo;
}

const props = defineProps<{
  devices: OnlineDevice[];
  loading?: boolean;
}>();

defineSlots<{
  action?(props: { device: OnlineDevice }): any;
}>();

const slots = useSlots();
const hasActionSlot = computed(() => !!slots.action);

function getDeviceIcon(info?: DeviceInfo) {
  const t = info?.deviceType?.toLowerCase();
  if (t === 'smartphone' || t === 'mobile') return 'lucide:smartphone';
  if (t === 'tablet') return 'lucide:tablet';
  return 'lucide:monitor';
}

function getDeviceLabel(info?: DeviceInfo) {
  if (!info) return '';
  const parts = [
    [info.deviceBrand, info.deviceModel].filter(Boolean).join(' '),
    info.os,
    info.browser,
  ].filter(Boolean);
  return parts.join(' · ');
}
</script>

<template>
  <Spin :spinning="loading ?? false">
    <div v-if="devices.length === 0" class="py-6 text-center text-sm text-gray-400">暂无在线设备</div>
    <div v-else class="space-y-3">
      <div
        v-for="d in devices"
        :key="d.tmpId"
        class="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-all hover:shadow-sm"
      >
        <div class="flex items-center gap-4">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconifyIcon :icon="getDeviceIcon(d.deviceInfo)" class="size-5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-gray-800">{{ d.ip }}</span>
              <Tag v-if="d.isCurrent" color="blue" class="!mr-0 scale-90">当前</Tag>
            </div>
            <div v-if="getDeviceLabel(d.deviceInfo)" class="mt-0.5 text-xs text-gray-500">
              {{ getDeviceLabel(d.deviceInfo) }}
            </div>
            <div class="mt-0.5 text-xs text-gray-400">{{ formatUnixTime(d.loginAt) }}</div>
          </div>
        </div>

        <div v-if="hasActionSlot && !d.isCurrent" class="ml-4 shrink-0">
          <slot name="action" :device="d" />
        </div>
      </div>
    </div>
  </Spin>
</template>
