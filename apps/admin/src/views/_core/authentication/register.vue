<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, h, ref } from 'vue';

import { AuthenticationRegister, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

defineOptions({ name: 'Register' });

const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('core.authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('core.authentication.username'),
      rules: z.string().min(1, { message: $t('core.authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('core.authentication.password'),
      },
      fieldName: 'password',
      label: $t('core.authentication.password'),
      renderComponentContent() {
        return {
          strengthText: () => $t('core.authentication.passwordStrength'),
        };
      },
      rules: z.string().min(1, { message: $t('core.authentication.passwordTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('core.authentication.confirmPassword'),
      },
      dependencies: {
        rules(values) {
          const { password } = values;
          return z
            .string({ required_error: $t('core.authentication.passwordTip') })
            .min(1, { message: $t('core.authentication.passwordTip') })
            .refine((value) => value === password, {
              message: $t('core.authentication.confirmPasswordTip'),
            });
        },
        triggerFields: ['password'],
      },
      fieldName: 'confirmPassword',
      label: $t('core.authentication.confirmPassword'),
    },
    {
      component: 'VbenCheckbox',
      fieldName: 'agreePolicy',
      renderComponentContent: () => ({
        default: () =>
          h('span', [
            $t('core.authentication.agree'),
            h(
              'a',
              {
                class: 'vben-link ml-1 ',
                href: '',
              },
              `${$t('core.authentication.privacyPolicy')} & ${$t('core.authentication.terms')}`,
            ),
          ]),
      }),
      rules: z.boolean().refine((value) => !!value, {
        message: $t('core.authentication.agreeTip'),
      }),
    },
  ];
});

function handleSubmit(value: Recordable<any>) {
  // eslint-disable-next-line no-console
  console.log('register submit:', value);
}
</script>

<template>
  <AuthenticationRegister :form-schema="formSchema" :loading="loading" @submit="handleSubmit" />
</template>
