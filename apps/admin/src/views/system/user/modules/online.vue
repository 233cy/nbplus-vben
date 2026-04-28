<script setup lang="ts">
import type { UserApi } from '#/api/system/user';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, message, Modal, Popconfirm, Table, Tag } from 'ant-design-vue';

import { getUserOnlineApi, kickAllUserDevicesApi, kickUserDeviceApi } from '#/api/system/user';
import { $t } from '#/locales';
import { formatUnixTime } from '#/utils/time';

const visible = ref(false);
const loading = ref(false);
const userId = ref('');
const devices = ref<UserApi.OnlineDevice[]>([]);

const columns = [
  { title: 'IP', dataIndex: 'ip', width: 140 },
  { title: '设备', dataIndex: 'device', ellipsis: true },
  { title: '登录时间', dataIndex: 'loginAt', width: 160, customRender: ({ text }: { text: number }) => formatUnixTime(text) },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
];

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
  <Modal
    v-model:open="visible"
    title="在线设备"
    :footer="null"
    width="700px"
  >
    <div class="mb-3 flex justify-end">
      <Popconfirm title="确认踢出所有设备？" @confirm="kickAll">
        <Button danger size="small">
          <IconifyIcon icon="lucide:log-out" class="size-4" />
          全部下线
        </Button>
      </Popconfirm>
    </div>
    <Table
      :columns="columns"
      :data-source="devices"
      :loading="loading"
      :pagination="false"
      row-key="tmpId"
      size="small"
      :scroll="{ x: 600 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Popconfirm title="确认下线该设备？" @confirm="kick(record.tmpId)">
            <Button type="link" danger size="small">下线</Button>
          </Popconfirm>
        </template>
      </template>
    </Table>
  </Modal>
</template>
