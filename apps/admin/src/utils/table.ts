import { h, onMounted } from 'vue';
import { useRoute } from 'vue-router';

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
 * 后端批量删除统一回执（BatchResultResponse）
 */
interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: { id: string; reason: string }[];
}

/**
 * 判断接口返回是否为 BatchResult 形状（含数值型 success/failed）
 */
function isBatchResult(result: any): result is BatchResult {
  return (
    result !== null &&
    typeof result === 'object' &&
    typeof result.success === 'number' &&
    typeof result.failed === 'number'
  );
}

/**
 * 通用表格批量操作（带倒计时防误操作）
 *
 * 未传 formatSuccess 时自动识别 BatchResult 回执：有失败项弹 Modal.warning
 * 展示"成功 X 条、失败 Y 条"及逐条失败明细（id + reason），全部成功按原逻辑 toast。
 *
 * @param apiFn     批量操作接口，接收 id 数组
 * @param ids       要操作的 id 列表
 * @param action    操作名称，如"删除"、"停用"、"归档"，用于提示文案
 * @param onSuccess 操作成功后的回调，可接收接口返回结果
 * @param options   可选配置
 * @param options.countdown   倒计时秒数（默认 3）
 * @param options.content     自定义确认弹窗内容（默认按选中条数+操作名生成）
 * @param options.formatSuccess 自定义成功提示文案，可返回字符串或 { type, content }
 */
export function useTableBatchAction(
  apiFn: (ids: string[]) => Promise<any>,
  ids: string[],
  action: string,
  onSuccess: (result?: any) => void,
  options: {
    content?: string;
    countdown?: number;
    formatSuccess?: (result: any) => string | { content: string; type: 'error' | 'success' | 'warning' };
  } = {},
) {
  if (ids.length === 0) {
    message.warning($t('common.batchActionNoSelection'));
    return;
  }

  const { countdown = 3, content, formatSuccess } = options;
  let remaining = countdown;

  const modal = Modal.confirm({
    title: $t('common.batchActionConfirmTitle', { action }),
    content: content ?? $t('common.batchActionConfirmContent', { count: ids.length, action }),
    okText: $t('common.batchActionCountdown', { count: remaining }),
    okButtonProps: { disabled: true, danger: true },
    onOk: async () => {
      const hide = message.loading({ content: $t('common.batchActionProcessing', { action }), duration: 0, key: 'batch-action' });
      try {
        const result = await apiFn(ids);
        // BatchResult 回执：一律按 data 组装提示（失败弹明细，全成功报条数）
        if (!formatSuccess && isBatchResult(result)) {
          hide();
          if (result.failed > 0) {
            Modal.warning({
              title: $t('common.batchActionResultTitle', { action }),
              content: h('div', [
                h('p', $t('common.batchActionPartialFail', { success: result.success, failed: result.failed })),
                h(
                  'ul',
                  { style: 'max-height: 240px; overflow: auto; margin: 0; padding-left: 18px;' },
                  (result.errors ?? []).map(item => h('li', `${item.id}：${item.reason}`)),
                ),
              ]),
            });
          } else {
            message.success({
              content: $t('common.batchActionAllSuccess', { success: result.success }),
              key: 'batch-action',
            });
          }
          onSuccess(result);
          return;
        }
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

/**
 * useGridRouteQuery 配置项
 */
export interface UseGridRouteQueryOptions<T extends Record<string, any> = Record<string, any>> {
  /**
   * 需要从 route.query 中读取的字段白名单，不填则读取全部
   */
  pick?: string[];
  /**
   * 需要从 route.query 中排除的字段
   */
  omit?: string[];
  /**
   * 回填表单前的自定义转换，例如把字符串转为数字、数组、日期范围等
   */
  transform?: (query: Record<string, any>) => T;
  /**
   * 回填表单后是否立即触发查询，默认 true
   */
  immediateQuery?: boolean;
}

interface FormApiLike {
  setValues: (
    fields: Record<string, any>,
    filterFields?: boolean,
    shouldValidate?: boolean,
  ) => Promise<void> | void;
}

interface GridApiLike {
  formApi: FormApiLike;
  query: (params?: Record<string, any>) => Promise<void> | void;
}

/**
 * 将路由 query 参数回填到表格搜索表单，并触发一次查询。
 *
 * 仅在页面首次渲染时执行一次；后续用户在页面内的查询、翻页、重置等操作
 * 不会再次读取 route.query，避免外部参数覆盖当前页面的搜索状态。
 *
 * 适用场景：从工作台、控制台等页面通过路由参数携带状态、部门、关键字等
 * 搜索条件跳转进列表页。
 *
 * 注意：URL 中的参数类型都是字符串，复杂字段（如日期范围、多选数组）需要
 * 通过 transform 自行转换。
 */
export function useGridRouteQuery<T extends Record<string, any> = Record<string, any>>(
  gridApi: GridApiLike,
  options: UseGridRouteQueryOptions<T> = {},
) {
  const { pick, omit = [], transform, immediateQuery = true } = options;
  const route = useRoute();

  onMounted(async () => {
    const query = { ...route.query };

    if (Object.keys(query).length === 0) {
      return;
    }

    let values: Record<string, any> = query;

    if (pick?.length) {
      values = Object.fromEntries(
        Object.entries(values).filter(([key]) => pick.includes(key)),
      );
    }

    if (omit.length) {
      values = Object.fromEntries(
        Object.entries(values).filter(([key]) => !omit.includes(key)),
      );
    }

    if (Object.keys(values).length === 0) {
      return;
    }

    if (transform) {
      values = transform(values);
    }

    await gridApi.formApi.setValues(values, true, false);

    if (immediateQuery) {
      await gridApi.query();
    }
  });
}
