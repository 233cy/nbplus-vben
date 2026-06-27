<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { IconPicker, Page } from '@vben/common-ui';
import { IconifyIcon, SvgBellIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, notification } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getExampleTableApi } from '#/api/examples';
import { requestClient } from '#/api/request';
import RichTextView from '#/components/rich-text-view/index.vue';
import { useSiteStore } from '#/store';

import PreferencesShowcase from './components/preferences-showcase.vue';

/* 富文本展示测试：调取系统参数 site.logotest（入库为 data-logical 形态，readonly 组件自动 rehydrate 渲染） */
const siteStore = useSiteStore();
const logoTestHtml = computed(() => siteStore.get('site.logotest', ''));
onMounted(() => {
  // 公开配置一般已在路由守卫中加载；为演示稳妥，未加载则补拉一次
  if (Object.keys(siteStore.config).length === 0) siteStore.fetchPublicConfig();
});

/* 富文本「服务端处理」演示：后端 RichTextService::render() 处理后直接返回可渲染 HTML（模拟小程序/App 消费） */
const serverRaw = ref('');
const serverRendered = ref('');
onMounted(async () => {
  const res = await requestClient.get<{ raw: string; rendered: string }>('/demo/rich-text');
  serverRaw.value = res.raw;
  serverRendered.value = res.rendered;
});

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

/* 验证器 */
const verify = ref<any>(null);
const captchaType = ref('blockPuzzle');

/* 上传演示绑定值（均存储逻辑路径 logicalPath） */
const avatar = ref(''); // 头像
const singleImg = ref(''); // 单张图片
const multiImg = ref(''); // 多张图片（逗号分隔的逻辑路径）
const singleMedia = ref(''); // 单个媒体（音视频）
const multiMedia = ref(''); // 多个媒体（逗号分隔的逻辑路径）

const onShow = (type: any) => {
  captchaType.value = type;
  verify.value.show();
};

const handleSuccess = (_res: any) => {};
</script>

<template>
  <Page description="支持多语言，主题功能集成切换等" title="Ant Design Vue组件使用演示">
    <PreferencesShowcase />

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

    <a-card class="mb-5" title="富文本展示测试（这里调取的是系统参数的富文本）">
      <div class="mb-1 text-xs text-gray-500">系统参数 key：site.logotest —— 入库原始形态（data-logical）</div>
      <pre class="mb-3 max-h-40 overflow-auto rounded-md border border-border bg-muted p-2 text-xs">{{ logoTestHtml || '（该系统参数为空或未配置）' }}</pre>
      <div class="mb-1 text-xs text-gray-500">↓ 前端处理：RichTextView 组件前端 rehydrate 后用统一样式渲染</div>
      <RichTextView :html="logoTestHtml" rehydrate />
    </a-card>

    <a-card class="mb-5" title="富文本展示测试（服务端 RichTextService::render 处理）">
      <div class="mb-1 text-xs text-gray-500">后端接口：GET /demo/rich-text —— 模拟小程序/App 消费方式</div>
      <div class="mb-1 text-xs text-gray-500">① 后端读到的入库原始形态（data-logical）</div>
      <pre class="mb-3 max-h-32 overflow-auto rounded-md border border-border bg-muted p-2 text-xs">{{ serverRaw || '（加载中…）' }}</pre>
      <div class="mb-1 text-xs text-gray-500">② 后端 render() 输出（rehydrate 还原 fullUrl + sanitize 安全清洗后的 ready HTML）</div>
      <pre class="mb-3 max-h-32 overflow-auto rounded-md border border-border bg-muted p-2 text-xs">{{ serverRendered || '（加载中…）' }}</pre>
      <div class="mb-1 text-xs text-gray-500">③ 服务端处理：同一个 RichTextView 组件渲染（不 rehydrate，直接吃后端结果）</div>
      <RichTextView :html="serverRendered" />
    </a-card>

    <a-card class="mb-5" title="上传插件">
      <!-- 头像上传：内置裁剪，圆形 / 方形两种形状 -->
      <a-divider orientation="left">头像上传（UpAvatar）</a-divider>
      <div class="flex flex-wrap items-start gap-8">
        <div>
          <div class="mb-2 text-xs text-gray-500">圆形 · 公开资源（public）</div>
          <UpAvatar v-model="avatar" access-type="public" shape="circle" />
        </div>
        <div>
          <div class="mb-2 text-xs text-gray-500">方形 · 登录可见（login）</div>
          <UpAvatar v-model="avatar" access-type="login" shape="square" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-1 text-xs text-gray-500">v-model（logicalPath）：</div>
          <pre class="max-h-24 overflow-auto rounded-md border border-border bg-muted p-2 text-xs">{{ avatar || '（未上传）' }}</pre>
        </div>
      </div>

      <!-- 图片上传：单张 / 多张 -->
      <a-divider orientation="left">图片上传（UpImg）</a-divider>
      <div class="flex flex-wrap items-start gap-8">
        <div>
          <div class="mb-2 text-xs text-gray-500">单张 · 公开资源（public）</div>
          <UpImg v-model="singleImg" access-type="public" />
        </div>
        <div>
          <div class="mb-2 text-xs text-gray-500">多张（最多 5 张）· 登录可见（login）</div>
          <UpImg v-model="multiImg" access-type="login" multiple :max-count="5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-1 text-xs text-gray-500">单张 v-model：</div>
          <pre class="mb-2 max-h-24 overflow-auto rounded-md border border-border bg-muted p-2 text-xs">{{ singleImg || '（未上传）' }}</pre>
          <div class="mb-1 text-xs text-gray-500">多张 v-model：</div>
          <pre class="max-h-24 overflow-auto rounded-md border border-border bg-muted p-2 text-xs">{{ multiImg || '（未上传）' }}</pre>
        </div>
      </div>

      <!-- 文件上传：大文件走 TUS 断点续传，小文件走 XHR；演示三种访问类型 -->
      <a-divider orientation="left">文件上传（UpFile · 大文件自动断点续传）</a-divider>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <div class="mb-2 text-xs text-gray-500">公开资源（public）</div>
          <UpFile access-type="public" />
        </div>
        <div>
          <div class="mb-2 text-xs text-gray-500">登录可见（login）</div>
          <UpFile access-type="login" />
        </div>
        <div>
          <div class="mb-2 text-xs text-gray-500">私有资源（authorized）</div>
          <UpFile access-type="authorized" />
        </div>
      </div>

      <!-- 媒体上传：音视频，内联缩略 + 播放 -->
      <a-divider orientation="left">媒体上传（UpMedia · 音视频内联播放）</a-divider>
      <div class="flex flex-wrap items-start gap-8">
        <div>
          <div class="mb-2 text-xs text-gray-500">单个 · 公开资源（public）</div>
          <UpMedia v-model="singleMedia" access-type="public" />
        </div>
        <div>
          <div class="mb-2 text-xs text-gray-500">多个（最多 5 个）· 登录可见（login）</div>
          <UpMedia v-model="multiMedia" access-type="login" multiple :max-count="5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-1 text-xs text-gray-500">单个 v-model：</div>
          <pre class="mb-2 max-h-24 overflow-auto rounded-md border border-border bg-muted p-2 text-xs">{{ singleMedia || '（未上传）' }}</pre>
          <div class="mb-1 text-xs text-gray-500">多个 v-model：</div>
          <pre class="max-h-24 overflow-auto rounded-md border border-border bg-muted p-2 text-xs">{{ multiMedia || '（未上传）' }}</pre>
        </div>
      </div>
    </a-card>

    <a-card class="mb-5" :title="$t('demos.page.title')">
      <pageSelect :api="getExampleTableApi" :columns="columns" :multiple="true" label-field="productName" value-field="id" />
    </a-card>

    <a-card class="mb-5" title="验证器">
      <a-button @click="onShow('blockPuzzle')">滑块</a-button>
      <a-button class="ml-6" @click="onShow('clickWord')">点击文字</a-button>
      <Verify mode="pop" :captcha-type="captchaType" :img-size="{ width: '400px', height: '200px' }" ref="verify" @success="handleSuccess" />
    </a-card>

    <a-card class="mb-5" title="主题样式示例">
      <div class="hover:text-regular hover:border-border-strong rounded-md border border-border bg-card p-4 text-primary transition-all hover:bg-muted">
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
