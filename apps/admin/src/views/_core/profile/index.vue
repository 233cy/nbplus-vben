<script setup lang="ts">
import { ref } from 'vue';

import { Profile } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { $t } from '#/locales';

import ProfileBase from './base-setting.vue';
import ProfileNotificationSetting from './notification-setting.vue';
import ProfilePasswordSetting from './password-setting.vue';
import ProfileSecuritySetting from './security-setting.vue';

const userStore = useUserStore();

const tabsValue = ref<string>('basic');

const tabs = ref([
  { label: $t('page.profile.basicTab'), value: 'basic' },
  { label: $t('page.profile.securityTab'), value: 'security' },
  { label: $t('page.profile.passwordTab'), value: 'password' },
  { label: $t('page.profile.noticeTab'), value: 'notice' },
]);
</script>
<template>
  <Profile v-model:model-value="tabsValue" :title="$t('page.profile.title')" :user-info="userStore.userInfo" :tabs="tabs">
    <template #content>
      <ProfileBase v-if="tabsValue === 'basic'" />
      <ProfileSecuritySetting v-if="tabsValue === 'security'" />
      <ProfilePasswordSetting v-if="tabsValue === 'password'" />
      <ProfileNotificationSetting v-if="tabsValue === 'notice'" />
    </template>
  </Profile>
</template>
