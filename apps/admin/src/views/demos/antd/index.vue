<script lang="ts" setup>
import { ref } from 'vue';

import { IconPicker, Page } from '@vben/common-ui';
import { IconifyIcon, SvgBellIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, notification } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getExampleTableApi } from '#/api/examples';

type NotificationType = 'error' | 'info' | 'success' | 'warning';

function info() {
  message.info('How many roads must a man walk down');
}

function error() {
  message.error({
    content: 'Once upon a time you dressed so fine',
    duration: 2500,
  });
}

function warning() {
  message.warning('How many roads must a man walk down');
}
function success() {
  message.success('Cause you walked hand in hand With another man in my place');
}

function notify(type: NotificationType) {
  notification[type]({
    duration: 2500,
    message: '测试说话。。。。。',
    type,
  });
}

/* 测试数据 */
const columns = [
  { title: '序号', type: 'seq', width: 50 },
  { field: 'category', sortable: true, title: 'Category' },
  { field: 'color', sortable: true, title: 'Color' },
  { field: 'productName', sortable: true, title: 'Product Name' },
  { field: 'price', sortable: true, title: 'Price' },
  { field: 'releaseDate', formatter: 'formatDateTime', title: 'DateTime' },
];

/* 测试图标 */
const iconVal = ref('ant-design:alert-filled');
const editHtml = ref('');
const iconValType = ref('ant-design');

/* 测试表单 */
const [BaseForm] = useVbenForm({
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  // 垂直布局，label和input在不同行，值为vertical
  // 水平布局，label和input在同一行
  layout: 'horizontal',
  schema: [
    {
      // 组件需要在 #/adapter.ts内注册，并加上类型
      component: 'Input',
      // 对应组件的参数
      componentProps: {
        placeholder: '请输入用户名',
      },
      // 字段名
      fieldName: 'username',
      // 界面显示的label
      label: '字符串',
    },
    {
      // 组件需要在 #/adapter.ts内注册，并加上类型
      component: 'Edit',
      fieldName: 'content',
      componentProps: {
        mode: 'modal',
      },
      // 界面显示的label
      label: '字符串',
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: '请输入密码',
      },
      fieldName: 'password',
      label: '密码',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入',
      },
      fieldName: 'number',
      label: '数字(带后缀)',
      suffix: () => '¥',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          {
            label: '选项1',
            value: '1',
          },
          {
            label: '选项2',
            value: '2',
          },
        ],
        placeholder: '请选择',
        showSearch: true,
      },
      fieldName: 'options',
      label: '下拉选',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          {
            label: '选项1',
            value: '1',
          },
          {
            label: '选项2',
            value: '2',
          },
        ],
      },
      fieldName: 'radioGroup',
      label: '单选组',
    },
    {
      component: 'Radio',
      fieldName: 'radio',
      label: '',
      renderComponentContent: () => {
        return {
          default: () => ['Radio'],
        };
      },
    },
    {
      component: 'CheckboxGroup',
      componentProps: {
        name: 'cname',
        options: [
          {
            label: '选项1',
            value: '1',
          },
          {
            label: '选项2',
            value: '2',
          },
        ],
      },
      fieldName: 'checkboxGroup',
      label: '多选组',
    },
    {
      component: 'Checkbox',
      fieldName: 'checkbox',
      label: '',
      renderComponentContent: () => {
        return {
          default: () => ['我已阅读并同意'],
        };
      },
    },
    {
      component: 'Mentions',
      componentProps: {
        options: [
          {
            label: 'afc163',
            value: 'afc163',
          },
          {
            label: 'zombieJ',
            value: 'zombieJ',
          },
        ],
        placeholder: '请输入',
      },
      fieldName: 'mentions',
      label: '提及',
    },
    {
      component: 'Rate',
      fieldName: 'rate',
      label: '评分',
    },
    {
      component: 'Switch',
      componentProps: {
        class: 'w-auto',
      },
      fieldName: 'switch',
      label: '开关',
    },
    {
      component: 'DatePicker',
      fieldName: 'datePicker',
      label: '日期选择框',
    },
    {
      component: 'RangePicker',
      fieldName: 'rangePicker',
      label: '范围选择器',
    },
    {
      component: 'TimePicker',
      fieldName: 'timePicker',
      label: '时间选择框',
    },
    {
      component: 'TreeSelect',
      componentProps: {
        allowClear: true,
        placeholder: '请选择',
        showSearch: true,
        treeData: [
          {
            label: 'root 1',
            value: 'root 1',
            children: [
              {
                label: 'parent 1',
                value: 'parent 1',
                children: [
                  {
                    label: 'parent 1-0',
                    value: 'parent 1-0',
                    children: [
                      {
                        label: 'my leaf',
                        value: 'leaf1',
                      },
                      {
                        label: 'your leaf',
                        value: 'leaf2',
                      },
                    ],
                  },
                  {
                    label: 'parent 1-1',
                    value: 'parent 1-1',
                  },
                ],
              },
              {
                label: 'parent 2',
                value: 'parent 2',
              },
            ],
          },
        ],
        treeNodeFilterProp: 'label',
      },
      fieldName: 'treeSelect',
      label: '树选择',
    },
  ],
  wrapperClass: 'grid-cols-1',
});
</script>

<template>
  <Page description="支持多语言，主题功能集成切换等" title="Ant Design Vue组件使用演示">
    <a-card class="mb-5" title="按钮">
      <a-space>
        <a-button>Default</a-button>
        <a-button type="primary" size="small">
          <template #icon>
            <IconifyIcon icon="ant-design:alert-filled" />
          </template>
          Primary
        </a-button>
        <a-button size="large">
          <template #icon><span class="icon-[ant-design--aliwangwang-outlined]"></span></template>
          Info
        </a-button>
        <a-button danger> Error </a-button>
      </a-space>
    </a-card>
    <a-card class="mb-5" title="Message">
      <a-space>
        <a-button type="ghost" @click="info"> 信息 </a-button>
        <a-button type="dashed" danger @click="error"> 错误 </a-button>
        <a-button @click="warning"> 警告 </a-button>
        <a-button @click="success"> 成功 </a-button>
      </a-space>
    </a-card>

    <a-card class="mb-5" title="上传插件">
      <Upload />
    </a-card>

    <a-card class="mb-5" :title="$t('demos.page.title')">
      <pageSelect :api="getExampleTableApi" :columns="columns" :multiple="true" label-field="productName" value-field="id" />
    </a-card>

    <a-card class="mb-5" title="主题样式示例">
      <div class="hover:text-regular hover:border-border-strong border-border bg-card text-primary hover:bg-muted rounded-md border p-4 transition-all">
        使用 Vben Admin 内置类的主题示例：包含背景、边框、文字、悬停状态。请参考transitioncss
      </div>
    </a-card>

    <a-card class="mb-5" title="表单组件">
      <BaseForm />
    </a-card>

    <a-card class="mb-5" title="富文本展示time">
      <wang-editor v-model="editHtml" />
    </a-card>

    <a-card class="mb-5" title="antd的二维码展示">
      <a-qrcode error-level="H" value="https://ant.design/" icon="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" />
    </a-card>

    <a-card class="mb-5" title="图标选择器">
      <p>
        图标全部源自链接iconify，而不是antd图标，除了SVG是自定义的，其他的其实就是iconify图标网站，因为iconify中有很多库，以命名方式来举例：ant-design:alert-filled其中ant-design是库，后面是图标而已。(https://icon-sets.iconify.design/)
      </p>
      <p>目前他自身的项目使用了以下库：ant-design、mdi、svg-spinners、line-md、svg（svg代表是你自定义的svg图标不是iconify图库）。自己尝试替换iconPicker组件的prefix属性即可。</p>
      <p>iconify和iconfont是一个类型的产物。使用iconify很不方便的一点就是去他网站搜索的时候很麻烦。必进是国外的。</p>
      <div class="size- mb-5 w-96 items-center gap-5">
        <a-radio-group v-model:value="iconValType">
          <a-radio value="ant-design">ant-design</a-radio>
          <a-radio value="mdi">mdi</a-radio>
          <a-radio value="svg-spinners">svg-spinners</a-radio>
          <a-radio value="line-md">line-md</a-radio>
          <a-radio value="svg">svg</a-radio>
        </a-radio-group>
        <div class="flex">
          <span>ant-design作者库:</span>
          <IconPicker v-model="iconVal" :prefix="iconValType" icon-class="size-10" />
        </div>
        <div class="flex text-center text-xl">
          <div>字符：</div>
          <div>{{ iconVal }}</div>
        </div>
        <div class="flex text-center text-xl">
          <div>用法1：</div>
          <div><IconifyIcon :icon="iconVal" /></div>
        </div>
        <div class="flex text-center text-xl">
          <div>用法2css：</div>
          <div><span class="icon-[ant-design--aliwangwang-outlined]"></span></div>
        </div>
        <div class="flex text-center text-xl">
          <div>用法3调用自定义的SVG图：</div>
          <SvgBellIcon class="size-8" />
        </div>
      </div>
    </a-card>

    <a-card class="mb-5" title="Notification">
      <a-space>
        <a-button @click="notify('info')"> 信息 </a-button>
        <a-button danger @click="notify('error')"> 错误 </a-button>
        <a-button @click="notify('warning')"> 警告 </a-button>
        <a-button @click="notify('success')"> 成功 </a-button>
      </a-space>
    </a-card>
  </Page>
</template>
