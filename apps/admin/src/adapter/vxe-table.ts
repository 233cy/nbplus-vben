import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import type { ComponentType } from './component';

import { h } from 'vue';

import { setupVbenVxeTable, useVbenVxeGrid as useGrid } from '@vben/plugins/vxe-table';
import { get, isFunction } from '@vben/utils';

import { objectOmit } from '@vueuse/core';
import { Button, Image, Switch, Tag } from 'ant-design-vue';

import DictTag from '#/components/dict/DictTag.vue';
import CellInlineEdit from '#/components/vxe-table/CellInlineEdit.vue';
import ImgPreview from '#/components/vxe-table/ImgPreview.vue';
import TableActions from '#/components/vxe-table/TableActions.vue';
import { $t } from '#/locales';
import { useSiteStore } from '#/store/site';

import { useVbenForm } from './form';

/**
 * 扩展 proxyConfig.ajax 类型，支持 queryApi 简化模式
 */
export interface ProxyAjaxQueryApi {
  /** 传入 API 函数即可，adapter 自动处理 page/sorts/formValues 拼接 */
  queryApi?: (params: any) => Promise<any>;
}

setupVbenVxeTable({
  configVxeTable: vxeUI => {
    const siteStore = useSiteStore();
    const pageSizes = siteStore.get('page.sizes', '10,20,50,100').split(',').map(Number).filter(Boolean);

    vxeUI.setConfig({
      grid: {
        sortConfig: {
          remote: true,
          trigger: 'cell',
          multiple: true,
        },
        align: 'center',
        stripe: true,
        border: false,
        columnConfig: {
          resizable: true,
        },
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        minHeight: 180,
        pagerConfig: {
          pageSizes,
          pageSize: pageSizes[1] ?? pageSizes[0],
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'meta.total',
            list: '',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        rowConfig: {
          isHover: true,
          isCurrent: true,
        },
        round: true,
        showOverflow: true,
      } as VxeTableGridOptions,
    });

    /**
     * 解决vxeTable在热更新时可能会出错的问题
     */
    vxeUI.renderer.forEach((_item, key) => {
      if (key.startsWith('Cell')) {
        vxeUI.renderer.delete(key);
      }
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        return h(Image, { src: row[column.field], ...props }) as any;
      },
    });

    vxeUI.renderer.add('CellImages', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        return h(ImgPreview, { value: row[column.field] }) as any;
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts, params) {
        const { attrs, props } = renderOpts;
        const { column, row } = params;
        const text = get(row, column.field);
        const onClick = attrs?.onClick ?? props?.onClick;
        const hasAccess = attrs?.hasAccess ?? props?.hasAccess ?? true;
        if (!hasAccess || !onClick) {
          return h('span', text) as any;
        }
        return h(
          Button,
          {
            type: 'link',
            style: 'padding:0;height:auto;',
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              onClick(row);
            },
          },
          { default: () => text },
        ) as any;
      },
    });

    // 单元格渲染： Tag
    vxeUI.renderer.add('CellTag', {
      renderTableDefault({ options, props }, { column, row }) {
        const value = get(row, column.field);
        const tagOptions = options ?? [
          { color: 'success', label: $t('common.enabled'), value: 1 },
          { color: 'error', label: $t('common.disabled'), value: 0 },
        ];
        const tagItem = tagOptions.find(item => item.value === value);
        return h(
          Tag,
          {
            ...props,
            ...objectOmit(tagItem ?? {}, ['label']),
          },
          { default: () => tagItem?.label ?? value },
        );
      },
    });

    vxeUI.renderer.add('CellSwitch', {
      renderTableDefault({ attrs, props }, { column, row }) {
        const loadingKey = `__loading_${column.field}`;
        const finallyProps = {
          checkedChildren: $t('common.enabled'),
          checkedValue: 1,
          unCheckedChildren: $t('common.disabled'),
          unCheckedValue: 2,
          ...props,
          checked: row[column.field],
          loading: row[loadingKey] ?? false,
          'onUpdate:checked': onChange,
        };
        async function onChange(newVal: any) {
          row[loadingKey] = true;
          try {
            const result = await attrs?.beforeChange?.(newVal, row);
            if (result !== false) {
              row[column.field] = newVal;
            }
          } finally {
            row[loadingKey] = false;
          }
        }
        return h(Switch, finallyProps);
      },
    });

    /**
     * 表格行内操作按钮渲染器
     * 内部封装 TableActions 组件，统一操作列视觉与交互
     * 用法：cellRender: { name: 'TableActions', attrs: { actions: [...], maxVisible, showLabel, moreShowLabel, popconfirmPlacement } }
     * actions 每项：{ key, label, icon?, danger?, hidden?, disabled?, loading?, confirmTitle?, onClick }
     *   - hidden / disabled / loading 支持 boolean 或 (row) => boolean
     *   - onClick 接收当前行参数 (row) => void
     *   - popconfirmPlacement 用于表格右侧固定列传 'topRight'，避免贴边挤压
     */
    vxeUI.renderer.add('TableActions', {
      renderTableDefault({ attrs }, { row }) {
        const resolveBool = (val: any) => (isFunction(val) ? val(row) : val);
        const actions = (attrs?.actions ?? []).map((action: Recordable<any>) => ({
          ...action,
          hidden: resolveBool(action.hidden),
          disabled: resolveBool(action.disabled),
          loading: resolveBool(action.loading),
          onClick: () => (action.onClick as (row: any) => void)?.(row),
        }));
        return h(TableActions, {
          actions,
          maxVisible: attrs?.maxVisible,
          moreShowLabel: attrs?.moreShowLabel,
          popconfirmPlacement: attrs?.popconfirmPlacement,
          showLabel: attrs?.showLabel,
        }) as any;
      },
    });

    /**
     * 行内编辑渲染器
     * 用法：cellRender: { name: 'CellInlineEdit', attrs: { type, apiFn, afterSuccess?, dictCode?, options?, disabled?, field? } }
     * type: 'select' | 'input' | 'number'，默认 'select'
     */
    vxeUI.renderer.add('CellInlineEdit', {
      renderTableDefault({ attrs }, { column, row }) {
        return h(CellInlineEdit, {
          row,
          field: attrs?.field ?? column.field,
          type: attrs?.type,
          dictCode: attrs?.dictCode,
          options: attrs?.options,
          apiFn: attrs?.apiFn,
          disabled: attrs?.disabled,
          afterSuccess: attrs?.afterSuccess,
        }) as any;
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add

    /**
     * 字典渲染器
     * 用法：cellRender: { name: 'CellDict', props: { code: 'gender' } }
     * 支持多值：cellRender: { name: 'CellDict', props: { code: 'gender', multiple: true } }
     */
    vxeUI.renderer.add('CellDict', {
      renderTableDefault({ props }, { column, row }) {
        const code: string = props?.code ?? '';
        const value = get(row, column.field);
        const multiple: boolean = props?.multiple ?? false;

        if (multiple && Array.isArray(value)) {
          return h(
            'div',
            { class: 'flex flex-wrap gap-1' },
            value.map(v => h(DictTag, { code, value: v })),
          ) as any;
        }
        return h(DictTag, { code, value }) as any;
      },
    });

    vxeUI.formats.add('emptyDash', {
      cellFormatMethod: ({ cellValue }: { cellValue: any }) => cellValue ?? '-',
    });
  },
  useVbenForm,
});

export const useVbenVxeGrid = <T extends Record<string, any>>(...rest: Parameters<typeof useGrid<T, ComponentType>>) => {
  const [options, ...others] = rest;

  // ===== 自动给纯文本列补空值占位 =====
  if (options?.gridOptions?.columns) {
    options.gridOptions.columns = options.gridOptions.columns.map((col: any) => {
      if (col.type || col.formatter || col.cellRender || col.slots) return col;
      return {
        ...col,
        formatter: ({ cellValue }: { cellValue: any }) => {
          if (cellValue === null || cellValue === undefined || cellValue === '') return '-';
          return cellValue;
        },
      };
    });
  }

  // ===== queryApi 简化模式：自动包装标准 query 回调 =====
  const proxyAjax = options?.gridOptions?.proxyConfig?.ajax as any;
  if (proxyAjax?.queryApi && !proxyAjax.query) {
    const queryApi = proxyAjax.queryApi;
    proxyAjax.query = async ({ page, sorts }: any, formValues: any) => {
      // 过滤有效排序（order 不为空的）
      const validSorts = (sorts || []).filter((s: any) => s.order).map((s: any) => ({ field: s.field, order: s.order }));

      return await queryApi({
        page: page.currentPage,
        pageSize: page.pageSize,
        ...formValues,
        ...(validSorts.length > 0 ? { sorts: validSorts } : {}),
      });
    };
    delete proxyAjax.queryApi;
  }

  // ===== 注入 sortChange 事件：排序变化时自动触发远程查询 =====
  const userGridEvents = options?.gridEvents || {};
  options.gridEvents = {
    ...userGridEvents,
    sortChange: (...args: any[]) => {
      (userGridEvents as any)?.sortChange?.(...args);
      gridApi.query();
    },
  };

  const [Grid, gridApi] = useGrid<T, ComponentType>(options, ...others);
  return [Grid, gridApi] as const;
};

export type OnActionClickParams<T = Recordable<any>> = {
  code: string;
  row: T;
};
export type OnActionClickFn<T = Recordable<any>> = (params: OnActionClickParams<T>) => void;
export type * from '@vben/plugins/vxe-table';
