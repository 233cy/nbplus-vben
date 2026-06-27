<script setup lang="ts">
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Form, FormItem, Radio, RadioGroup } from 'ant-design-vue';

import UpFile from '#/components/upload/upFile.vue';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  onOpenChange: handleOpenChange,
  footer: false,
});

type AccessType = 'authorized' | 'login' | 'public';

const accessType = ref<AccessType>('public');

function handleOpenChange(isOpen: boolean) {
  if (isOpen) {
    accessType.value = 'public';
  }
}

function resolveAccessPolicy(type: AccessType): string {
  const map: Record<AccessType, string> = { authorized: 'owner', login: 'login', public: 'public' };
  return map[type];
}
</script>

<template>
  <Drawer :title="$t('system.file.upload')" width="600px">
    <Form layout="vertical">
      <FormItem :label="$t('system.file.fields.accessType')" required>
        <RadioGroup v-model:value="accessType">
          <Radio value="public">{{ $t('system.file.options.accessType.public') }}</Radio>
          <Radio value="login">{{ $t('system.file.options.accessType.login') }}</Radio>
          <Radio value="authorized">{{ $t('system.file.options.accessType.authorized') }}</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem label="选择文件">
        <UpFile :access-type="accessType" :access-policy="resolveAccessPolicy(accessType)" />
      </FormItem>
    </Form>
  </Drawer>
</template>
