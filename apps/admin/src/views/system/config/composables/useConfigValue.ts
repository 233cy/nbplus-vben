import type { ComponentType } from '#/adapter/component';
import type { ConfigApi } from '#/api/system/config';

/** 历史别名映射：后端存储的组件名可能与适配器注册名不一致 */
export const componentAliasMap: Record<string, ComponentType> = {
  UpImg: 'ImageUpload',
};

export function normalizeComponent(component?: string): ComponentType {
  if (!component) {
    return 'Input';
  }
  return (componentAliasMap[component] || component) as ComponentType;
}

/** 后端统一按字符串存储，渲染前转成组件需要的原生类型 */
export function stringToValue(value: string, component: ComponentType, isEncrypted: boolean): any {
  if (isEncrypted && value === '******') {
    return '';
  }

  if (component === 'Switch') {
    return value === '1' || value === 'true';
  }

  if (component === 'InputNumber') {
    if (value === '') {
      return undefined;
    }
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  }

  if (component === 'DatePicker' || component === 'TimePicker') {
    return value || undefined;
  }

  return value;
}

/** 保存前转回字符串；加密字段未修改时保持 '******'，避免把已加密值刷成空字符串 */
export function valueToString(value: any, component: ComponentType, isEncrypted: boolean): string {
  if (isEncrypted && (value === '' || value === undefined || value === null)) {
    return '******';
  }

  if (component === 'Switch') {
    return value ? '1' : '0';
  }

  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

/** 根据组件类型决定使用哪个 v-model 属性名 */
export function getModelPropName(component: ComponentType): string {
  if (component === 'Switch') {
    return 'checked';
  }
  if (component === 'ImageUpload' || component === 'AvatarUpload' || component === 'Edit' || component === 'CaptchaPinInput') {
    return 'modelValue';
  }
  return 'value';
}

/** 是否为选择类组件，需要 options */
export function isOptionsComponent(component: ComponentType): boolean {
  return component === 'Select' || component === 'RadioGroup' || component === 'Radio' || component === 'CheckboxGroup';
}

/** 从配置项中提取可展示的选项（当前仅 DictSelect/DictRadio 有明确来源） */
export function resolveOptions(item: ConfigApi.ConfigItem): { label: string; value: number | string }[] {
  // 预留：未来可在 sys_config 中扩展 options 字段，或根据 key 从字典加载
  if (item.component === 'DictSelect' || item.component === 'DictRadio') {
    // 字典组件内部会自己加载 options，这里返回空即可
    return [];
  }
  return [];
}
