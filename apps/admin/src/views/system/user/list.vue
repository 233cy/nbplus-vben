<script setup lang="ts">
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { UserApi } from '#/api/system/user';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteUserApi, getUserListApi } from '#/api/system/user';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

interface PageInfo {
  currentPage: number;
  pageSize: number;
}
interface QueryParams {
  page: PageInfo;
}

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: false,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }: QueryParams, formValues: UserApi.PageParams) => {
          return await getUserListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  },
});

function onActionClick({ code, row }: OnActionClickParams<UserApi.UserItem>): void {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

function onRefresh(): void {
  gridApi.query();
}
function onCreate(): void {
  formDrawerApi.setData({}).open();
}
function onEdit(row: UserApi.UserItem): void {
  formDrawerApi.setData(row).open();
}

function onDelete(row: UserApi.UserItem): void {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该条记录吗？',
    onOk: async () => {
      const hide = message.loading({ content: '删除中...', duration: 0, key: 'del' });
      try {
        await deleteUserApi(row.id);
        message.success({ content: '删除成功', key: 'del' });
        onRefresh();
      } catch {
        hide();
      }
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid table-title="用户管理列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增用户管理
        </Button>
      </template>
    </Grid>
  </Page>
</template>
