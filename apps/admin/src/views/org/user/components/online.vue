<script setup lang="ts">
import type { UserApi } from '#/api/org/user';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, message, Modal, Popconfirm } from 'ant-design-vue';

import { getUserOnlineApi, kickAllUserDevicesApi, kickUserDeviceApi } from '#/api/org/user';
import OnlineDevices from '#/components/onlineDevices/index.vue';

const visible = ref(false);
const loading = ref(false);
const userId = ref('');
const devices = ref<UserApi.OnlineDevice[]>([]);

async function load() {
  loading.value = true;
  try {
    devices.value = await getUserOnlineApi(userId.value);
  } finally {
    loading.value = false;
  }
}

async function open(id: string) {
  userId.value = id;
  visible.value = true;
  await load();
}

async function kick(tmpId: string) {
  await kickUserDeviceApi(userId.value, tmpId);
  message.success('已下线');
  await load();
}

async function kickAll() {
  await kickAllUserDevicesApi(userId.value);
  message.success('已全部下线');
  await load();
}

defineExpose({ open });
</script>

<template>
  <Modal v-model:open="visible" title="在线设备" :footer="null" width="600px">
    <div class="mb-3 flex justify-end">
      <Popconfirm title="确认踢出所有设备？" @confirm="kickAll">
        <Button danger size="small">
          <IconifyIcon icon="lucide:log-out" class="size-4" />
          全部下线
        </Button>
      </Popconfirm>
    </div>

    <OnlineDevices :devices="devices" :loading="loading">
      <template #action="{ device }">
        <Popconfirm title="确认下线该设备？" @confirm="kick(device.tmpId)">
          <Button type="link" danger size="small">下线</Button>
        </Popconfirm>
      </template>
    </OnlineDevices>
  </Modal>
</template>
