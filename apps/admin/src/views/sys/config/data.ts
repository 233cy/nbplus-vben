import { $t } from '#/locales';

/** 支持的配置值组件类型 */
export const COMPONENT_OPTIONS = [
  { label: `${$t('sys.config.components.Input')} (Input)`, value: 'Input' },
  { label: `${$t('sys.config.components.InputPassword')} (InputPassword)`, value: 'InputPassword' },
  { label: `${$t('sys.config.components.Textarea')} (Textarea)`, value: 'Textarea' },
  { label: `${$t('sys.config.components.InputNumber')} (InputNumber)`, value: 'InputNumber' },
  { label: `${$t('sys.config.components.Switch')} (Switch)`, value: 'Switch' },
  { label: `${$t('sys.config.components.UpImg')} (UpImg)`, value: 'UpImg' },
  { label: `${$t('sys.config.components.Edit')} (Edit)`, value: 'Edit' },
  { label: `${$t('sys.config.components.DictSelect')} (DictSelect)`, value: 'DictSelect' },
  { label: `${$t('sys.config.components.DictRadio')} (DictRadio)`, value: 'DictRadio' },
];

/** 组件类型显示映射 */
export function formatComponent(component?: string): string {
  const found = COMPONENT_OPTIONS.find(o => o.value === component);
  return found?.label ?? component ?? '-';
}
