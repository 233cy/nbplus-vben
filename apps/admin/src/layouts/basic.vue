<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal, useVbenModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BasicLayout, LockScreen, Notification, UserDropdown } from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { Button, Popconfirm, Segmented } from 'ant-design-vue';

import { useMyTasks } from '#/composables/useMyTasks';
import { useNotificationCenter } from '#/composables/useNotificationCenter';
import { $t } from '#/locales';
import { useAdminUserStore, useAuthStore, useSiteStore } from '#/store';
import { useDict } from '#/utils/dict';
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

// ===== 我的任务（进行中面板）Tab =====
const {
  tasks: myTasks,
  runningCount: myTaskCount,
  loadList: loadMyTasks,
  refreshCount: refreshMyTaskCount,
  cancel: cancelMyTask,
} = useMyTasks();

const activeTab = ref('notifications');

/** 任务类型字典（sys_task_type），全局缓存只请求一次 */
const { items: taskTypeDict } = useDict('sys_task_type');

function taskTypeLabel(type: string) {
  return taskTypeDict.value.find(i => String(i.value) === String(type))?.label ?? type;
}

function taskProgress(task: { doneCount: number; failCount: number; totalCount: number }) {
  if (task.totalCount === 0) return '-';
  return `${task.doneCount + task.failCount}/${task.totalCount}`;
}

const tabOptions = computed(() => [
  { label: $t('ui.widgets.notifications'), value: 'notifications' },
  {
    label: myTaskCount.value > 0 ? `${$t('sys.task.myTasks')}(${myTaskCount.value})` : $t('sys.task.myTasks'),
    value: 'tasks',
  },
]);

/** Tab 激活时才拉取任务列表（前 10 条） */
watch(activeTab, tab => {
  if (tab === 'tasks') loadMyTasks();
});

/** 刷新按钮：通知（未读数+列表）与我的任务（角标+当前 Tab 列表）一起刷新 */
function handleRefresh() {
  refresh();
  refreshMyTaskCount();
  if (activeTab.value === 'tasks') loadMyTasks();
}

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
        :active-tab="activeTab"
        :dot="showDot"
        :loading="listLoading"
        :notifications="notifications"
        @clear="handleClear"
        @read="handleRead"
        @remove="handleRemove"
        @make-all="handleMakeAll"
        @on-click="onNotificationClick"
        @refresh="handleRefresh"
        @view-all="handleViewAll"
      >
        <template #tabs>
          <div class="px-4 pb-2">
            <Segmented v-model:value="activeTab" :options="tabOptions" block />
          </div>
        </template>
        <template #tab-panel>
          <div v-if="myTasks.length > 0" class="max-h-90 overflow-y-auto">
            <ul class="flex w-full flex-col">
              <li
                v-for="task in myTasks"
                :key="task.id"
                class="flex w-full items-start gap-4 border-t border-border px-4 py-3.5"
              >
                <div class="flex min-w-0 flex-1 flex-col gap-1.5 leading-normal">
                  <p class="truncate font-semibold">{{ task.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ taskTypeLabel(task.type) }} · {{ $t(`sys.task.statusText.${task.status}`) }} · {{ taskProgress(task) }}
                  </p>
                </div>
                <Popconfirm
                  :title="$t('sys.task.cancelConfirm')"
                  :ok-text="$t('common.confirm')"
                  :cancel-text="$t('common.cancel')"
                  @confirm="cancelMyTask(task.id)"
                >
                  <Button type="link" danger class="shrink-0 p-0">
                    {{ $t('sys.task.cancel') }}
                  </Button>
                </Popconfirm>
              </li>
            </ul>
          </div>
          <div v-else class="flex-center min-h-37.5 w-full text-muted-foreground">
            {{ $t('sys.task.myTasksEmpty') }}
          </div>
          <div class="border-t border-border px-4 py-2.5 text-center">
            <Button type="link" class="p-0" @click="router.push('/my-tasks')">
              {{ $t('sys.task.viewAllMyTasks') }}
            </Button>
          </div>
        </template>
      </Notification>
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
