import type { CaptchaDriverApi } from '#/api/sys/captchaDriver';

import { computed, nextTick, reactive, ref } from 'vue';

import { message } from 'ant-design-vue';

import { getCaptchaDriversApi, previewCaptchaDriverApi, updateCaptchaDriverApi } from '#/api';
import { $t } from '#/locales';

/**
 * 驱动列表、启用切换、配置编辑与预览逻辑.
 */
export function useCaptchaDrivers() {
  const loading = ref(false);
  const drivers = ref<CaptchaDriverApi.DriverItem[]>([]);
  const saving = reactive<Record<string, boolean>>({});
  const editConfigs = reactive<Record<string, Record<string, any>>>({});
  const previewFetchFn = ref<(() => Promise<any>) | undefined>(undefined);

  const hasEnabled = computed(() => drivers.value.some(d => d.isEnabled && d.isValid));

  /**
   * 获取指定驱动的编辑态配置（懒初始化）.
   */
  function getEditConfig(driver: CaptchaDriverApi.DriverItem): Record<string, any> {
    if (!editConfigs[driver.id]) {
      editConfigs[driver.id] = { ...driver.config };
    }
    return editConfigs[driver.id] as Record<string, any>;
  }

  /**
   * 全量替换指定驱动的编辑态配置.
   */
  function setEditConfig(driver: CaptchaDriverApi.DriverItem, config: Record<string, any>): void {
    editConfigs[driver.id] = config;
  }

  async function loadDrivers() {
    loading.value = true;
    try {
      drivers.value = await getCaptchaDriversApi();
    } finally {
      loading.value = false;
    }
  }

  async function handleToggle(driver: CaptchaDriverApi.DriverItem, enabled: boolean) {
    await updateCaptchaDriverApi({ id: driver.id, isEnabled: enabled });
    await loadDrivers();
  }

  async function handleSave(driver: CaptchaDriverApi.DriverItem) {
    saving[driver.id] = true;
    try {
      await updateCaptchaDriverApi({ id: driver.id, config: editConfigs[driver.id] });
      message.success($t('system.captcha-driver.saveSuccess'));
      await loadDrivers();
    } finally {
      saving[driver.id] = false;
    }
  }

  /**
   * 准备预览：设置 fetchFn，调用方需要在 nextTick 后手动打开 Verify.
   */
  async function preparePreview(driver: CaptchaDriverApi.DriverItem) {
    previewFetchFn.value = () => previewCaptchaDriverApi(driver.type);
    await nextTick();
  }

  return {
    loading,
    drivers,
    saving,
    previewFetchFn,
    hasEnabled,
    getEditConfig,
    setEditConfig,
    loadDrivers,
    handleToggle,
    handleSave,
    preparePreview,
  };
}
