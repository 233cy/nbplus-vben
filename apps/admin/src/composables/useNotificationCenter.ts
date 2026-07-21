import type { NotificationItem } from '@vben/layouts';

import type { NotificationInboxApi } from '#/api/sys/notificationInbox';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  batchDeleteNotificationInboxApi,
  deleteNotificationInboxApi,
  getNotificationInboxListApi,
  getNotificationInboxUnreadCountApi,
  markAllNotificationInboxReadApi,
  markNotificationInboxReadApi,
} from '#/api/sys/notificationInbox';
import { $t } from '#/locales';
import { useTableBatchAction } from '#/utils/table';
import { formatUnixTime } from '#/utils/time';

/** 未读数轮询间隔 */
const POLL_INTERVAL = 30_000;
/** 弹窗列表条数 */
const LIST_SIZE = 10;

/** 兜底：摘要为空时去掉 HTML 标签取纯文本 */
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || '').trim();
}

/** 通知图标头像（内置 SVG，避免依赖外部图片） */
const NOTICE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="hsl(221 83% 53%)"/><g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(8 8)"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></g></svg>',
)}`;

/**
 * 右上角通知中心
 *
 * 采用轮询模式：每 30s 刷新未读数（轻量接口），未读数增加时同步刷新列表；
 * 弹窗列表在挂载时加载，操作后本地更新。
 */
export function useNotificationCenter() {
  const router = useRouter();

  const notifications = ref<NotificationItem[]>([]);
  const unreadCount = ref(0);
  const listLoading = ref(false);

  const showDot = computed(() => unreadCount.value > 0);

  let timer: ReturnType<typeof setInterval> | undefined;

  function toNotificationItem(msg: NotificationInboxApi.MessageItem): NotificationItem {
    return {
      id: msg.id,
      avatar: NOTICE_AVATAR,
      date: formatUnixTime(msg.createdAt),
      isRead: msg.isRead === 1,
      link: typeof msg.extra?.url === 'string' && msg.extra.url !== '' ? msg.extra.url : undefined,
      // 铃铛下拉展示摘要（纯文本），正文可能为富文本 HTML
      message: msg.summary || stripHtml(msg.content),
      title: msg.title,
      // 原始数据，供详情弹窗展示
      raw: msg,
    };
  }

  async function refreshUnreadCount(): Promise<number> {
    try {
      const res = await getNotificationInboxUnreadCountApi();
      const prev = unreadCount.value;
      unreadCount.value = res.count;
      return res.count - prev;
    } catch {
      // 静默失败（如无权限/网络异常），下一轮再试
      return 0;
    }
  }

  async function loadList() {
    listLoading.value = true;
    try {
      const res = await getNotificationInboxListApi({ page: 1, pageSize: LIST_SIZE });
      notifications.value = res.items.map(toNotificationItem);
    } catch {
      // 静默失败，保留旧列表
    } finally {
      listLoading.value = false;
    }
  }

  async function poll() {
    const increased = await refreshUnreadCount();
    // 有新通知到达时同步刷新弹窗列表
    if (increased > 0) await loadList();
  }

  async function handleRead(item: NotificationItem) {
    if (item.isRead || !item.id) return;
    await markNotificationInboxReadApi(String(item.id));
    item.isRead = true;
    await refreshUnreadCount();
  }

  async function handleRemove(item: NotificationItem) {
    if (!item.id) return;
    await deleteNotificationInboxApi(String(item.id));
    // 删除后重拉列表，让后面的消息补位
    await Promise.all([loadList(), refreshUnreadCount()]);
  }

  async function handleMakeAll() {
    if (unreadCount.value <= 0) return;
    await markAllNotificationInboxReadApi();
    notifications.value.forEach(n => (n.isRead = true));
    unreadCount.value = 0;
  }

  /** 清空：删除当前已加载的通知 */
  function handleClear() {
    const ids = notifications.value.map(n => String(n.id)).filter(Boolean);
    useTableBatchAction(batchDeleteNotificationInboxApi, ids, $t('core.notification-inbox.clear'), async () => {
      // 删除后重拉列表，让后面的消息补位
      await Promise.all([loadList(), refreshUnreadCount()]);
    });
  }

  /** 手动刷新：未读数 + 列表 */
  async function refresh() {
    await Promise.all([refreshUnreadCount(), loadList()]);
  }

  function handleViewAll() {
    router.push('/inbox');
  }

  onMounted(() => {
    refreshUnreadCount();
    loadList();
    timer = setInterval(poll, POLL_INTERVAL);
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
  });

  return {
    notifications,
    unreadCount,
    listLoading,
    showDot,
    loadList,
    refresh,
    handleRead,
    handleRemove,
    handleMakeAll,
    handleClear,
    handleViewAll,
  };
}
