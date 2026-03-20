<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { getProfileInfoApi } from '#/api';

interface ProfileInfo {
  email?: string;
  phone?: string;
}

const profileInfo = ref<ProfileInfo>({});

onMounted(async () => {
  profileInfo.value = await getProfileInfoApi();
});

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function maskEmail(email: string) {
  return email.replace(/(.{2}).+(@.+)/, '$1***$2');
}
</script>

<template>
  <div class="space-y-4 p-2">
    <!-- 密保手机 -->
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div class="font-medium">密保手机</div>
        <div class="mt-1 text-sm text-muted-foreground">
          <template v-if="profileInfo.phone"> 已绑定：{{ maskPhone(profileInfo.phone) }} </template>
          <template v-else> 未绑定手机号，绑定后可通过手机号登录和接收验证码 </template>
        </div>
      </div>
    </div>

    <!-- 备用邮箱 -->
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div class="font-medium">备用邮箱</div>
        <div class="mt-1 text-sm text-muted-foreground">
          <template v-if="profileInfo.email"> 已绑定：{{ maskEmail(profileInfo.email) }} </template>
          <template v-else> 未绑定邮箱，绑定后可通过邮箱登录和接收验证码 </template>
        </div>
      </div>
    </div>
  </div>
</template>
