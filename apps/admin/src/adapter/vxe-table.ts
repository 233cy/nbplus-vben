import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import type { ComponentType } from './component';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { setupVbenVxeTable, useVbenVxeGrid as useGrid } from '@vben/plugins/vxe-table';
import { get, isFunction } from '@vben/utils';

import { objectOmit } from '@vueuse/core';
import { Button, Image, Popconfirm, Switch, Tag } from 'ant-design-vue';

import DictTag from '#/components/dict/DictTag.vue';
import ImgPreview from '#/components/imgPreview/index.vue';
import { $t } from '#/locales';
import { useSiteStore } from '#/store/site';
import { useTableDelete } from '#/utils/table';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: vxeUI => {
    const siteStore = useSiteStore();
    const pageSizes = siteStore.get('page.sizes', '10,20,50,100').split(',').map(Number).filter(Boolean);

    vxeUI.setConfig({
      grid: {
        align: 'center',
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
        round: true,
        showOverflow: true,
        size: 'small',
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
            size: 'small',
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
     * 注册表格的操作按钮渲染器
     * 用法：cellRender: { name: 'CellOperation', attrs: { actions: [...], onRefresh } }
     * actions 每项：{ code, text, icon?, actionType?, access?, onClick?, apiFn?, labelField? }
     * actionType:
     *   'default'  → 普通按钮，直接触发 onClick（默认）
     *   'confirm'  → 带 Popconfirm 确认框，确认后触发 onClick
     *   'delete'   → 内置删除：自动调用 useTableDelete(apiFn, row.id, row[labelField], onRefresh)
     */
    vxeUI.renderer.add('CellOperation', {
      renderTableDefault({ attrs }, { row }) {
        const onRefresh: () => void = attrs?.onRefresh ?? (() => {});

        const actions: Array<Recordable<any>> = (attrs?.actions ?? [])
          .filter((a: Recordable<any>) => a.access !== false)
          .map((a: Recordable<any>) => ({
            ...a,
            text: isFunction(a.text) ? a.text(row) : a.text,
          }));

        function renderBtn(action: Recordable<any>, onClick?: () => void) {
          return h(
            Button,
            {
              danger: action.actionType === 'confirm' || action.actionType === 'delete',
              size: 'small',
              type: 'link',
              onClick: onClick ?? (() => action.onClick?.(row)),
            },
            {
              default: () => {
                const nodes = [];
                if (action.icon) nodes.push(h(IconifyIcon, { class: 'size-4', icon: action.icon }));
                nodes.push(action.text);
                return nodes;
              },
            },
          );
        }

        function renderConfirm(action: Recordable<any>) {
          let viewportWrapper: HTMLElement | null = null;
          return h(
            Popconfirm,
            {
              getPopupContainer(el: HTMLElement) {
                viewportWrapper = el.closest('.vxe-table--viewport-wrapper');
                return document.body;
              },
              placement: 'topLeft',
              title: $t('common.confirmDelete'),
              onOpenChange: (open: boolean) => {
                if (open) viewportWrapper?.style.setProperty('pointer-events', 'none');
                else viewportWrapper?.style.removeProperty('pointer-events');
              },
              onConfirm: () => action.onClick?.(row),
            },
            {
              default: () => renderBtn(action, () => {}),
              description: () => h('span', action.confirmText ?? $t('common.confirmDeleteContent', { name: row[action.labelField ?? 'name'] ?? '' })),
            },
          );
        }

        function renderDelete(action: Recordable<any>) {
          const label = row[action.labelField ?? 'name'] ?? '';
          return renderBtn(action, () => useTableDelete(action.apiFn, row.id, label, onRefresh));
        }

        // 按 actionType 分发渲染器，后续扩展直接在此 map 里新增
        const actionRenderers: Record<string, (action: Recordable<any>) => any> = {
          default: a => renderBtn(a),
          confirm: a => renderConfirm(a),
          delete: a => renderDelete(a),
        };

        const btns = actions.map(a => {
          const type = a.actionType ?? 'default';
          const render = actionRenderers[type] ?? actionRenderers.default;
          return render?.(a);
        });

        return h('div', { class: 'flex items-center justify-center gap-1' }, btns);
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
  },
  useVbenForm,
});

export const useVbenVxeGrid = <T extends Record<string, any>>(...rest: Parameters<typeof useGrid<T, ComponentType>>) => useGrid<T, ComponentType>(...rest);

export type OnActionClickParams<T = Recordable<any>> = {
  code: string;
  row: T;
};
export type OnActionClickFn<T = Recordable<any>> = (params: OnActionClickParams<T>) => void;
export type * from '@vben/plugins/vxe-table';
