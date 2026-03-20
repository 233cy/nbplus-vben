<script setup lang="ts">
import { onMounted } from 'vue';

import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { getProfileInfoApi, updateProfileApi } from '#/api';
import { useAdminUserStore } from '#/store/user';

const userStore = useUserStore();
const adminUserStore = useAdminUserStore();

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelWidth: 100,
  },
  showDefaultActions: false,
  schema: [
    {
      fieldName: 'nickname',
      component: 'Input',
      label: '昵称',
      rules: z.string().min(1, { message: '请输入昵称' }),
    },
    {
      fieldName: 'email',
      component: 'Input',
      label: '邮箱',
      componentProps: { disabled: true, placeholder: '请输入邮箱' },
    },
    {
      fieldName: 'phone',
      component: 'Input',
      label: '手机号',
      componentProps: { disabled: true, placeholder: '请输入手机号' },
    },
    {
      fieldName: 'gender',
      component: 'RadioGroup',
      label: '性别',
      componentProps: {
        options: [
          { label: '未知', value: 0 },
          { label: '男', value: 1 },
          { label: '女', value: 2 },
        ],
      },
    },
    {
      fieldName: 'lastLoginIp',
      component: 'Input',
      label: '最后登录 IP',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'lastLoginTime',
      component: 'Input',
      label: '最后登录时间',
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
    email: values.email as string | undefined,
    phone: values.phone as string | undefined,
    gender: values.gender as number | undefined,
  });

  // 同步框架 store（昵称、头像）
  const current = userStore.userInfo;
  if (current) {
    userStore.setUserInfo({
      ...current,
      realName: result.nickname,
      avatar: result.avatar ?? current.avatar,
    });
  }

  // 同步业务 store（邮箱、手机号）
  adminUserStore.setAdminUserInfo({
    email: result.email,
    phone: result.phone,
  });

  message.success('个人信息更新成功');
}

onMounted(async () => {
  const data = await getProfileInfoApi();
  formApi.setValues(data);
});
</script>
<template>
  <div>
    <Form />
    <a-button class="mt-4" type="primary" @click="handleSubmit">保存修改</a-button>
  </div>
</template>
