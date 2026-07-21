<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal, useVbenModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BasicLayout, LockScreen, Notification, UserDropdown } from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { $t } from '#/locales';
import { useNotificationCenter } from '#/composables/useNotificationCenter';
import { useAdminUserStore, useAuthStore, useSiteStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';
import NotificationDetailModal from '#/views/_core/notification-inbox/shared/detail-modal.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const adminUserStore = useAdminUserStore();
const siteStore = useSiteStore();
const { destroyWatermark, updateWatermark } = useWatermark();

const {
  notifications,
  showDot,
  listLoading,
  refresh,
  handleRead,
  handleRemove,
  handleMakeAll,
  handleClear,
  handleViewAll,
} = useNotificationCenter();

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: NotificationDetailModal,
  destroyOnClose: true,
  // 高于铃铛下拉（--popup-z-index: 2000），避免详情弹窗被通知下拉遮挡
  zIndex: 2001,
});

/** 点击通知：标记已读并弹窗展示详情 */
function onNotificationClick(item: NotificationItem) {
  handleRead(item);
  if (item.raw) {
    detailModalApi.setData(item.raw).open();
  }
}

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('core.authentication.profile'),
  },
  {
    handler: () => {
      router.push({ name: 'NotificationInbox' });
    },
    icon: 'lucide:mail',
    text: $t('core.notification-inbox.pageTitle'),
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

/** 头像下拉描述行：角色名（无角色时回退邮箱/用户名） */
const roleText = computed(() => adminUserStore.roles.map(r => r.name).join('、'));

async function handleLogout() {
  await authStore.logout(false);
}

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content: content || `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown :avatar :menus :text="userStore.userInfo?.realName" :description="roleText || adminUserStore.email || userStore.userInfo?.username" @logout="handleLogout" />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :loading="listLoading"
        :notifications="notifications"
        @clear="handleClear"
        @read="handleRead"
        @remove="handleRemove"
        @make-all="handleMakeAll"
        @on-click="onNotificationClick"
        @refresh="refresh"
        @view-all="handleViewAll"
      />
      <DetailModal />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal v-model:open="accessStore.loginExpired" :avatar>
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
    <template #footer>
      <div class="py-3 text-center text-xs text-gray-400 dark:text-gray-500">
        {{ siteStore.copyright }}
      </div>
    </template>
  </BasicLayout>
</template>
