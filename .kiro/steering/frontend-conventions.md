# nbplus 前端项目规范与架构约定

本文件是 Kiro IDE 的 steering 文件，每次对话自动加载。

> **AI 行为准则**：你是一名高级架构师，不只是执行者。每次回答都应从全局视角出发，主动识别潜在的连带影响、规范偏差、性能隐患。对于小改动直接修改；对于涉及多文件、架构层面的大改动，先给出分析和建议，由用户确认后再执行。

---

## 一、技术栈

- Vue 3 + TypeScript
- vben-admin v5（标准版，核心框架文件未修改）
- Ant Design Vue（UI 组件库）
- Pinia（状态管理）
- Vue Router 4
- i18n（vue-i18n，支持 zh-CN / en-US）

---

## 二、目录结构（apps/admin/src）

```
src/
├── adapter/
│   ├── component/index.ts   # 组件适配器（ComponentType 定义 + 注册）
│   └── form.ts              # VbenForm 适配器（useVbenForm、VbenFormSchema、z）
├── api/
│   ├── core/                # 核心 API（auth、user、menu、upload、captcha）
│   ├── error-codes.ts       # BizCode 枚举（与后端 ErrorCode 一一对应）
│   ├── index.ts             # 统一导出
│   └── request.ts           # requestClient 配置（拦截器、错误处理）
├── components/              # 业务公共组件（upload、pageSelect、verifition、wangEditor）
├── layouts/                 # 布局（basic.vue、auth.vue）
├── locales/
│   ├── langs/
│   │   ├── zh-CN/           # 中文语言包（page.json 等）
│   │   └── en-US/           # 英文语言包（结构相同）
│   └── index.ts             # i18n 初始化（加载 antd + dayjs 语言包）
├── router/
│   ├── routes/
│   │   ├── core.ts          # 静态路由（登录、MFA、404 等）
│   │   └── modules/         # 动态路由模块（通常由后端菜单驱动）
│   ├── access.ts            # 动态路由生成（调用 getAllMenusApi）
│   └── guard.ts             # 路由守卫（token 检查、动态路由注入）
├── store/
│   ├── auth.ts              # 认证 store（登录、MFA、登出、fetchUserInfo）
│   └── user.ts              # 业务扩展用户信息（email、phone、permissions）
└── views/
    ├── _core/               # 框架核心页面（登录、MFA、404 等，不随意修改）
    └── {module}/            # 业务模块页面
```

---

## 三、requestClient 使用规范

```typescript
import { requestClient } from '#/api/request';

// 配置：responseReturn: 'data'，自动解包后端 { code, message, data } 中的 data
// 成功：直接返回 data 字段内容
// 失败：自动弹出错误提示，并 throw error

// GET 请求
const result = await requestClient.get<XxxResult>('/admin/xxx/list', { params });

// POST 请求
const result = await requestClient.post<XxxResult>('/admin/xxx/create', data);

// DELETE 请求
await requestClient.delete('/admin/xxx/del', { data: { id } });
```

**错误处理机制（request.ts 中已配置）：**

| 情况                    | 行为                                                |
| ----------------------- | --------------------------------------------------- |
| HTTP 200 + `code !== 0` | 弹出 warning，throw error（调用方可 catch）         |
| HTTP 400/401/403/500    | 弹出 error，标记 `isSystemDown = true`（5s 后恢复） |
| Token 过期              | 自动刷新 token（`refreshTokenApi`）或跳转登录       |

**调用方捕获业务错误：**

```typescript
try {
  await someApi(params);
} catch (error: any) {
  const code = error?.response?.data?.code;
  if (code === BizCode.SOME_ERROR) {
    // 处理特定业务错误
  }
}
```

---

## 四、API 接口规范

```typescript
// src/api/core/xxx.ts
import { requestClient } from '#/api/request';

export namespace XxxApi {
  // 参数字段名：camelCase，与后端 Request rules() 一致
  export interface CreateParams {
    name: string;
    mfaChannel: string; // 不用 mfa_channel
  }

  export interface XxxResult {
    id: string;
    name: string;
  }
}

export async function createXxxApi(data: XxxApi.CreateParams) {
  return requestClient.post<XxxApi.XxxResult>('/admin/xxx/create', data);
}
```

**字段命名：全部 camelCase，与后端 Request/Response 保持一致。**

---

## 五、BizCode 错误码规范

```typescript
// src/api/error-codes.ts
export enum BizCode {
  AUTH_LOGIN_FAILED = 30_000,
  SAFE_MFA_REQUIRED = 20_210,
  // ...与后端 ErrorCode 枚举值一一对应
}
```

- 新增后端错误码时，必须同步在 `error-codes.ts` 中添加
- 在 catch 块中通过 `error?.response?.data?.code` 或 `error?.data?.code` 获取业务码

---

## 六、Store 分层规范

| Store               | 位置                      | 职责                                                  |
| ------------------- | ------------------------- | ----------------------------------------------------- |
| `useUserStore`      | `@vben/stores`（框架）    | 框架基础用户信息（avatar、realName、roles、token 等） |
| `useAccessStore`    | `@vben/stores`（框架）    | token、权限码、菜单、路由                             |
| `useAuthStore`      | `#/store/auth.ts`（业务） | 登录、MFA、登出、fetchUserInfo                        |
| `useAdminUserStore` | `#/store/user.ts`（业务） | 业务扩展字段（email、phone、permissions）             |

**规则：**

- 框架 store 通过 `@vben/stores` 导入，不要在 `#/store` 中重复定义
- 业务扩展字段放 `useAdminUserStore`，不要污染框架 store
- `fetchUserInfo` 在 `useAuthStore` 中，负责同时更新框架 store 和业务 store

---

## 七、路由规范

### 静态路由（core.ts）

```typescript
// src/router/routes/core.ts
// 认证相关页面在此定义，不走动态路由
{
  name: 'MfaLogin',
  path: 'mfa-login',
  component: () => import('#/views/_core/authentication/mfa-login.vue'),
  meta: { title: $t('page.auth.mfaLogin') },
}
```

### 动态路由

- 由后端 `GET /menu/all` 返回，通过 `generateAccess` 注入
- 页面组件路径对应 `src/views/**/*.vue`
- 新增业务页面需在后端菜单表中配置，不在 `core.ts` 中添加

### 路由守卫逻辑

1. 无 token → 跳转登录页（携带 redirect 参数）
2. 有 token 但未生成动态路由 → 调用 `fetchUserInfo` + `generateAccess`
3. 已生成动态路由 → 直接放行

---

## 八、i18n 规范

### 文件结构

```
src/locales/langs/
├── zh-CN/
│   └── page.json    # 页面级翻译
└── en-US/
    └── page.json    # 结构完全相同
```

### 使用方式

```typescript
// 在 <script setup> 中
import { $t } from '#/locales';
const title = $t('page.auth.mfaLogin');

// 在 <template> 中
<span>{{ $t('page.auth.login') }}</span>

// 带参数
$t('page.upload.progressText', { uploaded: 1.2, total: 10, speed: 2.1, eta: 5 })
```

### i18n 开发强制要求

**每新增一个页面/功能，必须同步完成：**

1. 在 `zh-CN/page.json` 中添加对应翻译
2. 在 `en-US/page.json` 中添加对应翻译（结构完全一致）
3. 路由 `meta.title` 使用 `$t()` 而非硬编码字符串

**page.json 结构约定：**

```json
{
  "auth": {
    "login": "登录",
    "mfaLogin": "身份二次验证"
  },
  "moduleName": {
    "pageTitle": "页面标题",
    "actionCreate": "新建",
    "actionEdit": "编辑",
    "actionDelete": "删除",
    "confirmDelete": "确认删除该记录？"
  }
}
```

---

## 九、VbenForm 使用规范

```typescript
import { useVbenForm, z } from '#/adapter/form';
import type { VbenFormSchema } from '#/adapter/form';

const [Form, formApi] = useVbenForm({
  schema: formSchema,
  handleSubmit: async (values) => {
    // 处理提交
  },
});

// 获取表单值
const values = await formApi.getValues();

// 设置表单值
formApi.setValues({ name: 'xxx' });

// 重置表单
formApi.resetForm();
```

### 可用 ComponentType（完整列表）

| 类型            | 说明                                  |
| --------------- | ------------------------------------- |
| `Input`         | 文本输入框                            |
| `InputPassword` | 密码输入框                            |
| `InputNumber`   | 数字输入框                            |
| `Textarea`      | 多行文本                              |
| `Select`        | 下拉选择                              |
| `ApiSelect`     | 异步数据下拉（自动调用 api 加载选项） |
| `ApiTreeSelect` | 异步树形下拉                          |
| `TreeSelect`    | 树形下拉                              |
| `DatePicker`    | 日期选择                              |
| `RangePicker`   | 日期范围选择                          |
| `TimePicker`    | 时间选择                              |
| `Checkbox`      | 单个复选框                            |
| `CheckboxGroup` | 复选框组                              |
| `Radio`         | 单选按钮                              |
| `RadioGroup`    | 单选按钮组                            |
| `Switch`        | 开关                                  |
| `Rate`          | 评分                                  |
| `Upload`        | 文件上传                              |
| `AutoComplete`  | 自动完成                              |
| `Mentions`      | 提及输入                              |
| `IconPicker`    | 图标选择器                            |
| `Edit`          | 富文本编辑器（wangEditor）            |
| `Divider`       | 分割线                                |
| `Space`         | 间距                                  |
| `DefaultButton` | 默认按钮                              |
| `PrimaryButton` | 主要按钮                              |

### VbenFormSchema 示例

```typescript
const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'username',
    label: $t('page.auth.username'),
    rules: z.string().min(1, { message: '请输入用户名' }),
    componentProps: {
      placeholder: '请输入用户名',
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'deptId',
    label: '部门',
    componentProps: {
      api: getDeptListApi, // 自动调用，返回 { label, value }[] 格式
      placeholder: '请选择部门',
    },
  },
];
```

---

## 十、API 文档参考

项目完整的接口文档（含所有路由的请求参数、响应结构、字段说明）可通过以下方式获取：

**在线 Swagger UI：**

```
{后端服务地址}/dev-api/doc
```

**使用原则：**

- 开发新功能前，先访问 Swagger 确认接口契约（路径、请求字段、响应结构）
- 如果 Swagger 无法访问，告知用户"Swagger 无法访问，请确认后端服务是否运行，或提供可访问的文档地址"
- 不要在代码或 steering 中硬编码具体的接口路径或字段名，一切以 Swagger 文档为准
- 字段命名以 Swagger 文档中的实际字段为准（应为 camelCase，与后端规范一致）

---

## 十一、新页面开发 Checklist

开发一个新业务页面时，必须完成以下所有步骤：

- [ ] `src/api/core/xxx.ts` 定义接口函数和类型（camelCase 字段名）
- [ ] `src/api/index.ts` 导出新 API
- [ ] `src/api/error-codes.ts` 补充新业务错误码（如有）
- [ ] `src/views/{module}/xxx.vue` 实现页面
- [ ] `src/locales/langs/zh-CN/page.json` 添加中文翻译
- [ ] `src/locales/langs/en-US/page.json` 添加英文翻译（结构一致）
- [ ] 后端菜单表配置路由（动态路由）或 `core.ts` 添加静态路由
- [ ] 路由 `meta.title` 使用 `$t()` 而非硬编码

---

## 十二、常见错误与建议

1. **API 字段名用下划线** → 必须改为 camelCase，与后端 Request/Response 保持一致
2. **直接修改 `@vben/stores` 的 userStore** → 框架字段用 `useUserStore`，业务扩展字段用 `useAdminUserStore`
3. **硬编码中文字符串** → 必须用 `$t()` 包裹，并同步更新中英文语言包
4. **新增错误码未同步 BizCode** → 后端新增 ErrorCode 时，前端 `error-codes.ts` 必须同步
5. **catch 块中直接用 `error.code`** → 应用 `error?.response?.data?.code` 或 `error?.data?.code`（取决于拦截器处理后的结构）
6. **动态路由写在 core.ts** → 只有认证相关的静态页面才放 `core.ts`，业务页面走后端菜单
7. **i18n 只更新了中文** → 中英文必须同步，否则切换语言时显示 key 而非翻译文本
8. **VbenForm 使用了不存在的 ComponentType** → 参考第九节完整列表，自定义组件需先在 `adapter/component/index.ts` 注册
