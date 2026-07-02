<script setup lang="ts">
import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { changePasswordApi } from '#/api';
import { $t } from '#/locales';

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
      label: $t('core.profile.password.oldPassword'),
      component: 'InputPassword',
      componentProps: { placeholder: $t('core.profile.password.oldPasswordPlaceholder') },
      rules: z.string().min(1, { message: $t('core.profile.password.oldPasswordRequired') }),
    },
    {
      fieldName: 'newPassword',
      label: $t('core.profile.password.newPassword'),
      component: 'PasswordInput',
      componentProps: { placeholder: $t('core.profile.password.newPasswordPlaceholder') },
      rules: 'required',
    },
    {
      fieldName: 'confirmPassword',
      label: $t('core.profile.password.confirmPassword'),
      component: 'InputPassword',
      componentProps: { placeholder: $t('core.profile.password.confirmPasswordPlaceholder') },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: $t('core.profile.password.confirmPasswordRequired') })
            .min(1, { message: $t('core.profile.password.confirmPasswordRequired') })
            .refine(value => value === newPassword, {
              message: $t('core.profile.password.passwordMismatch'),
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ],
});

async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) return;
  const values = await formApi.getValues();

  await changePasswordApi({
    oldPassword: values.oldPassword as string,
    newPassword: values.newPassword as string,
    confirmPassword: values.confirmPassword as string,
  });
  message.success($t('core.profile.password.changeSuccess'));
  formApi.resetForm();
}
</script>
<template>
  <div class="w-1/3">
    <Form />
    <a-button class="mt-4" type="primary" @click="handleSubmit">
      {{ $t('core.profile.password.changePassword') }}
    </a-button>
  </div>
</template>
