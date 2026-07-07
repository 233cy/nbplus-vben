import { message, Modal } from 'ant-design-vue';

import { $t } from '#/locales';

/**
 * 通用表格单条删除确认
 */
export function useTableDelete(apiFn: (id: string) => Promise<any>, id: string, label: string, onSuccess: () => void) {
  Modal.confirm({
    title: $t('common.confirmDelete'),
    content: $t('common.confirmDeleteContent', { name: label }),
    onOk: async () => {
      const hide = message.loading({ content: $t('common.deleting'), duration: 0, key: 'del' });
      try {
        await apiFn(id);
        message.success({ content: $t('common.deleteSuccess'), key: 'del' });
        onSuccess();
      } catch {
        hide();
      }
    },
  });
}

/**
 * 通用表格批量操作（带倒计时防误操作）
 *
 * @param apiFn     批量操作接口，接收 id 数组
 * @param ids       要操作的 id 列表
 * @param action    操作名称，如"删除"、"停用"、"归档"，用于提示文案
 * @param onSuccess 操作成功后的回调，可接收接口返回结果
 * @param options   可选配置
 * @param options.countdown   倒计时秒数（默认 3）
 * @param options.formatSuccess 自定义成功提示文案，可返回字符串或 { type, content }
 */
export function useTableBatchAction(
  apiFn: (ids: string[]) => Promise<any>,
  ids: string[],
  action: string,
  onSuccess: (result?: any) => void,
  options: {
    countdown?: number;
    formatSuccess?: (result: any) => string | { content: string; type: 'error' | 'success' | 'warning' };
  } = {},
) {
  if (ids.length === 0) {
    message.warning($t('common.batchActionNoSelection'));
    return;
  }

  const { countdown = 3, formatSuccess } = options;
  let remaining = countdown;

  const modal = Modal.confirm({
    title: $t('common.batchActionConfirmTitle', { action }),
    content: $t('common.batchActionConfirmContent', { count: ids.length, action }),
    okText: $t('common.batchActionCountdown', { count: remaining }),
    okButtonProps: { disabled: true, danger: true },
    onOk: async () => {
      const hide = message.loading({ content: $t('common.batchActionProcessing', { action }), duration: 0, key: 'batch-action' });
      try {
        const result = await apiFn(ids);
        const successMsg = formatSuccess ? formatSuccess(result) : $t('common.batchActionSuccess', { action });
        const msg = typeof successMsg === 'string' ? { type: 'success' as const, content: successMsg } : successMsg;
        message[msg.type]({ content: msg.content, key: 'batch-action' });
        onSuccess(result);
      } catch {
        hide();
      }
    },
  });

  const timer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(timer);
      modal.update({
        okText: $t('common.batchActionConfirmTitle', { action }),
        okButtonProps: { disabled: false, danger: true },
      });
    } else {
      modal.update({
        okText: $t('common.batchActionCountdown', { count: remaining }),
      });
    }
  }, 1000);
}
