import type { CaptchaDriverApi } from '#/api/sys/captchaDriver';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { getCaptchaWatermarkApi, saveCaptchaWatermarkApi } from '#/api';
import { $t } from '#/locales';

/**
 * 水印配置加载与保存逻辑.
 */
export function useWatermark() {
  const watermark = ref<CaptchaDriverApi.WatermarkConfig>({
    fontsize: 12,
    color: '#ffffff',
    text: '',
  });
  const saving = ref(false);

  async function loadWatermark() {
    watermark.value = await getCaptchaWatermarkApi();
  }

  async function handleSave() {
    saving.value = true;
    try {
      await saveCaptchaWatermarkApi(watermark.value);
      message.success($t('sys.captcha-driver.saveSuccess'));
    } finally {
      saving.value = false;
    }
  }

  return {
    watermark,
    saving,
    loadWatermark,
    handleSave,
  };
}
