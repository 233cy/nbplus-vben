<script setup lang="ts">
import { onMounted } from 'vue';

import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { getProfileInfoApi, updateProfileApi } from '#/api';
import { $t } from '#/locales';
import { useAdminUserStore } from '#/store/user';

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
      fieldName: 'nickname',
      component: 'Input',
      label: $t('page.profile.basic.nickname'),
      rules: z.string().min(1, { message: $t('page.profile.basic.nicknameRequired') }),
    },
    {
      fieldName: 'gender',
      component: 'RadioGroup',
      label: $t('page.profile.basic.gender'),
      componentProps: {
        options: [
          { label: $t('page.profile.basic.genderUnknown'), value: 0 },
          { label: $t('page.profile.basic.genderMale'), value: 1 },
          { label: $t('page.profile.basic.genderFemale'), value: 2 },
        ],
      },
    },
    {
      fieldName: 'lastLoginIp',
      component: 'Input',
      label: $t('page.profile.basic.lastLoginIp'),
      componentProps: { disabled: true },
    },
    {
      fieldName: 'lastLoginTime',
      component: 'Input',
      label: $t('page.profile.basic.lastLoginTime'),
      componentProps: { disabled: true },
    },
  ],
});

async function handleSubmit() {
  const { valid, values } = await formApi.validate();
  if (!valid || !values) return;

  const result = await updateProfileApi({
    nickname: values.nickname as string,
    avatar: values.avatar as string | undefined,
    gender: values.gender as number | undefined,
  });

  const current = userStore.userInfo;
  if (current) {
    userStore.setUserInfo({
      ...current,
      realName: result.nickname,
      avatar: result.avatar ?? current.avatar,
    });
  }

  adminUserStore.setAdminUserInfo({
    email: result.email,
    phone: result.phone,
  });

  message.success($t('page.profile.basic.updateSuccess'));
}

onMounted(async () => {
  const data = await getProfileInfoApi();
  formApi.setValues(data);
});
</script>
<template>
  <div>
    <Form />
    <a-button class="mt-4" type="primary" @click="handleSubmit">
      {{ $t('page.profile.saveChanges') }}
    </a-button>
  </div>
</template>
