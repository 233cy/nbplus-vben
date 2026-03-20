<script setup lang="ts">
import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { changePasswordApi } from '#/api';

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelWidth: 100,
  },
  showDefaultActions: false,
  schema: [
    {
      fieldName: 'oldPassword',
      label: '旧密码',
      component: 'InputPassword',
      componentProps: { placeholder: '请输入旧密码' },
      rules: z.string().min(1, { message: '请输入旧密码' }),
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'InputPassword',
      componentProps: { placeholder: '请输入新密码（至少 8 位）' },
      rules: z.string().min(8, { message: '新密码至少 8 位' }),
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'InputPassword',
      componentProps: { placeholder: '请再次输入新密码' },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === newPassword, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ],
});

async function handleSubmit() {
  const { valid, values } = await formApi.validate();
  if (!valid || !values) return;

  await changePasswordApi({
    oldPassword: values.oldPassword as string,
    newPassword: values.newPassword as string,
    confirmPassword: values.confirmPassword as string,
  });
  message.success('密码修改成功');
  formApi.resetForm();
}
</script>
<template>
  <div class="w-1/3">
    <Form />
    <a-button class="mt-4" type="primary" @click="handleSubmit">修改密码</a-button>
  </div>
</template>
