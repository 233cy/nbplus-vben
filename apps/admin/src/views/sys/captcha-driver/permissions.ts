import { useAccess } from '#/composables/use-access';

/**
 * 人机验证驱动模块权限码集中判断
 *
 * 权限码与后端 `app/Http/Admin/Controller/Sys/CaptchaDriverController.php` 保持一致。
 */
export function useCaptchaDriverPermission() {
  const { hasAccessByCodes } = useAccess();

  return {
    canList: hasAccessByCodes(['adm:sys:captchaDriver:list']),
    canUpdate: hasAccessByCodes(['adm:sys:captchaDriver:update']),
    canWatermark: hasAccessByCodes(['adm:sys:captchaDriver:watermark']),
    canPreview: hasAccessByCodes(['adm:sys:captchaDriver:preview']),
  };
}
