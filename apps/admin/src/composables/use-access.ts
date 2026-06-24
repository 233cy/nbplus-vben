import { useAccess as _useAccess } from '@vben/access';
import { useAccessStore } from '@vben/stores';

/**
 * 扩展版 useAccess，在原版基础上支持通配符权限码
 * - *:*:*  → 所有权限通过
 * - system:*:* → system 模块下所有权限通过
 * - org:user:* → org:user 下所有操作通过
 */
export function useAccess() {
  const base = _useAccess();
  const accessStore = useAccessStore();

  function hasAccessByCodes(codes: string[]) {
    const userCodesSet = new Set(accessStore.accessCodes);

    if (userCodesSet.has('*:*:*')) return true;

    // 检查单个权限码（支持通配符）
    function matchCode(code: string): boolean {
      if (userCodesSet.has(code)) return true;
      return [...userCodesSet].some(userCode => {
        if (!userCode.includes('*')) return false;
        const regex = new RegExp(`^${userCode.replaceAll('*', '[^:]*')}$`);
        return regex.test(code);
      });
    }

    // 数组每一项都必须满足（AND），每一项内部 | 分隔表示 OR
    return codes.every(item => item.split('|').some(code => matchCode(code.trim())));
  }

  return { ...base, hasAccessByCodes };
}
