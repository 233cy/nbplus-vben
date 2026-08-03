<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';

import { Alert, Spin } from 'ant-design-vue';

import Verify from '#/components/verifition/Verify.vue';
import { $t } from '#/locales';

import DriverCard from './components/driver-card.vue';
import WatermarkCard from './components/watermark-card.vue';
import { useCaptchaDrivers, useWatermark } from './composables';

defineOptions({ name: 'CaptchaDriverPage' });

const drivers = useCaptchaDrivers();
const watermark = useWatermark();

const verifyRef = ref<InstanceType<typeof Verify> | null>(null);

async function handlePreview(driverId: string) {
  const driver = drivers.drivers.value.find(d => d.id === driverId);
  if (!driver) return;

  await drivers.preparePreview(driver);
  await nextTick();
  verifyRef.value?.show();
}

onMounted(() => {
  drivers.loadDrivers();
  watermark.loadWatermark();
});
</script>

<template>
  <div class="p-4">
    <Spin :spinning="drivers.loading.value">
      <Alert v-if="!drivers.loading.value && !drivers.hasEnabled.value" :message="$t('sys.captcha-driver.noDriverEnabled')" type="warning" show-icon class="mb-4" />

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DriverCard
          v-for="driver in drivers.drivers.value"
          :key="driver.id"
          :driver="driver"
          :config="drivers.getEditConfig(driver)"
          :saving="drivers.saving[driver.id]"
          @update:config="drivers.setEditConfig(driver, $event)"
          @toggle="drivers.handleToggle(driver, $event)"
          @save="drivers.handleSave(driver)"
          @preview="handlePreview(driver.id)"
        />

        <WatermarkCard v-model:config="watermark.watermark.value" :saving="watermark.saving.value" @save="watermark.handleSave" />
      </div>
    </Spin>

    <!-- 预览 Modal：用 Verify.vue mode=fixed，fetchFn 指向预览接口 -->
    <div class="hidden">
      <Verify ref="verifyRef" v-model:fetch-fn="drivers.previewFetchFn.value" />
    </div>
  </div>
</template>
