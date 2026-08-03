<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Textarea } from 'ant-design-vue';

import { $t } from '#/locales';

const emit = defineEmits<{
  confirm: [comment: string];
}>();

const comment = ref('');
const commentError = ref('');

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onConfirm: handleSubmit,
  onOpenChange: handleOpenChange,
});

function handleOpenChange(isOpen: boolean) {
  if (!isOpen) {
    return;
  }
  comment.value = '';
  commentError.value = '';
}

/** 驳回意见必填，未填时阻断提交 */
async function handleSubmit() {
  if (!comment.value.trim()) {
    commentError.value = $t('approval.todo.commentRequired');
    return;
  }
  modalApi.setState({ loading: true });
  try {
    emit('confirm', comment.value.trim());
    modalApi.close();
  } finally {
    modalApi.setState({ loading: false });
  }
}
</script>

<template>
  <Modal :title="$t('approval.todo.rejectTitle')" width="520px">
    <Form layout="vertical">
      <FormItem
        :label="$t('approval.common.comment')"
        :validate-status="commentError ? 'error' : ''"
        :help="commentError || undefined"
        required
      >
        <Textarea v-model:value="comment" :rows="4" :placeholder="$t('approval.todo.commentPlaceholder')" :maxlength="500" />
      </FormItem>
    </Form>
  </Modal>
</template>
