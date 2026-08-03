import { $t } from '#/locales';
import { useSiteStore } from '#/store/site';

export interface PasswordPolicy {
  level: 'medium' | 'strong' | 'weak';
  minLength: number;
}

/**
 * 读取系统参数中的密码策略（security.password.level / security.password.len）。
 * 与后端 PasswordValidator 同源：未配置时回退 medium / 8。
 */
export function getPasswordPolicy(): PasswordPolicy {
  const siteStore = useSiteStore();
  const minLength = Number.parseInt(siteStore.get('security.password.len', '8'), 10);
  return {
    level: siteStore.get('security.password.level', 'medium') as PasswordPolicy['level'],
    minLength: Number.isNaN(minLength) ? 8 : minLength,
  };
}

/**
 * 校验密码是否满足当前策略（规则与后端 PasswordValidator::validate 保持一致）。
 */
export function isPasswordValid(password: string): boolean {
  if (!password) return false;

  const { level, minLength } = getPasswordPolicy();
  if (password.length < minLength) return false;
  if (level === 'weak') return true;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  if (level === 'strong') {
    return hasLower && hasUpper && hasDigit && /[^a-z0-9]/i.test(password);
  }
  // medium 及未知等级：大小写字母 + 数字
  return hasLower && hasUpper && hasDigit;
}

/**
 * 当前策略的描述文案（用作校验失败提示）。
 */
export function passwordPolicyDescription(): string {
  const { level, minLength } = getPasswordPolicy();
  const key = ['medium', 'strong', 'weak'].includes(level) ? level : 'medium';
  return $t(`common.passwordPolicy.${key}`, { minLength });
}
