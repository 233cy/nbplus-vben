<script setup lang="ts">
import { onMounted } from 'vue';

import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { getProfileInfoApi, updateProfileApi } from '#/api';
import { $t } from '#/locales';
import { useAdminUserStore } from '#/store/user';
import { resolveLogicalPath } from '#/api/admin/core/upload';
import { formatUnixTime } from '#/utils/time';

const userStore = useUserStore();
const adminUserStore = useAdminUserStore();

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelWidth: 120,
  },
  showDefaultActions: false,
  schema: [
    {
      fieldName: 'avatar',
      component: 'AvatarUpload',
      label: $t('profile.basic.avatar'),
      componentProps: { accessType: 'login' },
    },
    {
      fieldName: 'nickname',
      component: 'Input',
      label: $t('profile.basic.nickname'),
      rules: z.string().min(1, { message: $t('profile.basic.nicknameRequired') }),
    },
    {
      fieldName: 'gender',
      component: 'DictRadio',
      label: $t('profile.basic.gender'),
      componentProps: { code: 'sys_user_gender', valueType: 'number' },
    },
    {
      fieldName: 'lastLoginIp',
      component: 'Input',
      label: $t('profile.basic.lastLoginIp'),
      componentProps: { disabled: true },
    },
    {
      fieldName: 'lastLoginTime',
      component: 'Input',
      label: $t('profile.basic.lastLoginTime'),
      componentProps: { disabled: true },
    },
  ],
});

async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) return;

  const values = await formApi.getValues();

  const result = await updateProfileApi({
    nickname: values.nickname as string,
    avatar: values.avatar as string | undefined,
    gender: (values.gender as number) ?? undefined,
  });

  const current = userStore.userInfo;
  if (current) {
    userStore.setUserInfo({
      ...current,
      realName: result.nickname,
      avatar: await resolveLogicalPath(result.avatar),
    });
  }

  adminUserStore.setAdminUserInfo({
    email: adminUserStore.email,
    phone: adminUserStore.phone,
  });

  message.success($t('profile.basic.updateSuccess'));
}

onMounted(async () => {
  const data = await getProfileInfoApi();
  formApi.setValues({
    ...data,
    lastLoginTime: formatUnixTime(data.lastLoginTime),
  });
});
</script>
<template>
  <div>
    <Form />
    <a-button class="mt-4" type="primary" @click="handleSubmit">
      {{ $t('profile.saveChanges') }}
    </a-button>
  </div>
</template>
