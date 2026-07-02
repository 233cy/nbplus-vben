<script setup lang="ts">
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Form, FormItem, InputNumber, Radio, RadioGroup, Select, SelectOption } from 'ant-design-vue';

import UpAvatar from '#/components/upload/upAvatar.vue';
import UpFile from '#/components/upload/upFile.vue';
import UpImg from '#/components/upload/upImg.vue';
import UpMedia from '#/components/upload/upMedia.vue';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const [Drawer] = useVbenDrawer({
  destroyOnClose: true,
  onOpenChange: handleOpenChange,
  footer: false,
});

type AccessType = 'authorized' | 'login' | 'public';
type UploadType = 'avatar' | 'file' | 'image' | 'media';
type AspectRatio = '1:1' | '3:2' | '4:3' | '16:9';
type AvatarShape = 'circle' | 'square';

const uploadType = ref<UploadType>('file');
const accessType = ref<AccessType>('public');
const maxCount = ref<number>(1);
const maxSize = ref<number>(0);
const aspectRatio = ref<AspectRatio>('1:1');
const shape = ref<AvatarShape>('circle');
const hasSuccess = ref(false);

const uploadTypeOptions: { label: string; value: UploadType }[] = [
  { label: $t('sys.file.options.uploadType.file'), value: 'file' },
  { label: $t('sys.file.options.uploadType.image'), value: 'image' },
  { label: $t('sys.file.options.uploadType.media'), value: 'media' },
  { label: $t('sys.file.options.uploadType.avatar'), value: 'avatar' },
];

const aspectRatioOptions: { label: string; value: AspectRatio }[] = [
  { label: '1:1', value: '1:1' },
  { label: '16:9', value: '16:9' },
  { label: '4:3', value: '4:3' },
  { label: '3:2', value: '3:2' },
];

const shapeOptions: { label: string; value: AvatarShape }[] = [
  { label: $t('sys.file.options.avatarShape.circle'), value: 'circle' },
  { label: $t('sys.file.options.avatarShape.square'), value: 'square' },
];

function handleOpenChange(isOpen: boolean) {
  if (isOpen) {
    uploadType.value = 'file';
    accessType.value = 'public';
    maxCount.value = 1;
    maxSize.value = 0;
    aspectRatio.value = '1:1';
    shape.value = 'circle';
    hasSuccess.value = false;
  }
}

function resolveAccessPolicy(type: AccessType): 'login' | 'owner' | 'public' {
  const map: Record<AccessType, 'login' | 'owner' | 'public'> = { authorized: 'owner', login: 'login', public: 'public' };
  return map[type];
}

function handleSuccess() {
  if (hasSuccess.value) return;
  hasSuccess.value = true;
  emit('success');
}
</script>

<template>
  <Drawer :title="$t('sys.file.upload')" width="700px">
    <Form layout="vertical">
      <FormItem :label="$t('sys.file.fields.uploadType')" required>
        <RadioGroup v-model:value="uploadType">
          <Radio v-for="item in uploadTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem :label="$t('sys.file.fields.accessType')" required>
        <RadioGroup v-model:value="accessType">
          <Radio value="public">{{ $t('sys.file.options.accessType.public') }}</Radio>
          <Radio value="login">{{ $t('sys.file.options.accessType.login') }}</Radio>
          <Radio value="authorized">{{ $t('sys.file.options.accessType.authorized') }}</Radio>
        </RadioGroup>
      </FormItem>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormItem :label="$t('sys.file.fields.maxCount')">
          <InputNumber v-model:value="maxCount" :min="1" :max="100" class="w-full" />
        </FormItem>

        <FormItem :label="$t('sys.file.fields.maxSize')">
          <InputNumber v-model:value="maxSize" :min="0" :precision="1" class="w-full" addon-after="MB" />
        </FormItem>
      </div>

      <template v-if="uploadType === 'avatar'">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormItem :label="$t('sys.file.fields.aspectRatio')">
            <Select v-model:value="aspectRatio">
              <SelectOption v-for="item in aspectRatioOptions" :key="item.value" :value="item.value">{{ item.label }}</SelectOption>
            </Select>
          </FormItem>

          <FormItem :label="$t('sys.file.fields.shape')">
            <RadioGroup v-model:value="shape">
              <Radio v-for="item in shapeOptions" :key="item.value" :value="item.value">{{ item.label }}</Radio>
            </RadioGroup>
          </FormItem>
        </div>
      </template>

      <FormItem :label="$t('sys.file.fields.uploadTarget')">
        <UpFile
          v-if="uploadType === 'file'"
          :access-type="accessType"
          :access-policy="resolveAccessPolicy(accessType)"
          :max-count="maxCount"
          :max-size="maxSize"
          @change="handleSuccess"
        />
        <UpImg
          v-else-if="uploadType === 'image'"
          :access-type="accessType"
          :access-policy="resolveAccessPolicy(accessType)"
          :max-count="maxCount"
          :max-size="maxSize"
          @change="handleSuccess"
        />
        <UpMedia
          v-else-if="uploadType === 'media'"
          :access-type="accessType"
          :access-policy="resolveAccessPolicy(accessType)"
          :max-count="maxCount"
          :max-size="maxSize"
          @change="handleSuccess"
        />
        <UpAvatar
          v-else-if="uploadType === 'avatar'"
          :access-type="accessType"
          :access-policy="resolveAccessPolicy(accessType)"
          :aspect-ratio="aspectRatio"
          :shape="shape"
          @change="handleSuccess"
        />
      </FormItem>
    </Form>
  </Drawer>
</template>
