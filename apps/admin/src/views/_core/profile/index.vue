<script setup lang="ts">
import { ref } from 'vue';

import { Profile } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Tag } from 'ant-design-vue';

import { $t } from '#/locales';
import { useAdminUserStore } from '#/store';

import ProfileBase from './base-setting.vue';
import ProfileNotificationSetting from './notification-setting.vue';
import ProfilePasswordSetting from './password-setting.vue';
import ProfileSecuritySetting from './security-setting.vue';

const userStore = useUserStore();
const adminUserStore = useAdminUserStore();

const tabsValue = ref<string>('basic');

const tabs = ref([
  { label: $t('core.profile.basicTab'), value: 'basic' },
  { label: $t('core.profile.securityTab'), value: 'security' },
  { label: $t('core.profile.passwordTab'), value: 'password' },
  { label: $t('core.profile.noticeTab'), value: 'notice' },
]);
</script>
<template>
  <Profile v-model:model-value="tabsValue" :title="$t('core.profile.title')" :user-info="userStore.userInfo" :tabs="tabs">
    <template #header-extra>
      <!-- 角色标签 -->
      <div v-if="adminUserStore.roles.length > 0" class="flex flex-wrap justify-center gap-1">
        <Tag v-for="role in adminUserStore.roles" :key="role.id" color="blue">
          {{ role.name }}
        </Tag>
      </div>
      <!-- 任职（主职在前，主/兼标注） -->
      <div v-if="adminUserStore.orgs.length > 0" class="flex flex-wrap justify-center gap-1">
        <Tag v-for="org in adminUserStore.orgs" :key="`${org.deptId}-${org.dutyId}`" :color="org.isMain === 1 ? 'gold' : 'default'">
          {{ org.fullDeptName || org.deptName }}<template v-if="org.dutyName"> · {{ org.dutyName }}</template>
          <span class="ml-1 text-xs opacity-70">{{ org.isMain === 1 ? '主' : '兼' }}</span>
        </Tag>
      </div>
    </template>
    <template #content>
      <ProfileBase v-if="tabsValue === 'basic'" />
      <ProfileSecuritySetting v-if="tabsValue === 'security'" />
      <ProfilePasswordSetting v-if="tabsValue === 'password'" />
      <ProfileNotificationSetting v-if="tabsValue === 'notice'" />
    </template>
  </Profile>
</template>
