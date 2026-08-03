import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';

/**
 * 回收站筛选表单项（软删除表格通用）。
 *
 * 参数约定（前后端统一，其他软删除列表直接复用）：
 * - 字段名：`trashed`
 * - 不传：仅正常数据（默认，软删除全局作用域自动排除已删除）
 * - `only`：仅回收站（只看已删除）
 * - `with`：包含回收站（正常 + 已删除）
 *
 * 后端对应实现参考 NotificationMessageCrudService::page()。
 */
export function useTrashedFormSchema(): VbenFormSchema {
  return {
    component: 'Select',
    fieldName: 'trashed',
    label: $t('common.dataScope'),
    componentProps: {
      allowClear: true,
      options: [
        { label: $t('common.trashedOnly'), value: 'only' },
        { label: $t('common.trashedWith'), value: 'with' },
      ],
    },
  };
}
