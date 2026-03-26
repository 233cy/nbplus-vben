<script lang="ts" setup>
import { computed } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';

import { $t } from '#/locales';
import { useSiteStore } from '#/store';

const siteStore = useSiteStore();

// site.name 有值时覆盖 preferences，否则 fallback
const appName = computed(() => siteStore.name || preferences.app.name);
// site.logo 有值时用动态 logo，否则 fallback 到 preferences
const logo = computed(() => siteStore.logo || preferences.logo.source);
const logoDark = computed(() => siteStore.logo || preferences.logo.sourceDark);
</script>

<template>
  <AuthPageLayout :app-name="appName" :logo="logo" :logo-dark="logoDark" :page-description="$t('authentication.pageDesc')" :page-title="appName">
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
