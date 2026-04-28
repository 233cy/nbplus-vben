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

| 情况 | 行为 |
| ---- | ---- |
| HTTP 200 + `code !== 0` | 弹出 warning（节流 1.5s），throw error，调用方可 catch |
| HTTP 401 | 由 `authenticateResponseInterceptor` 接管：已登录则弹窗重登录（`loginExpired` 模式），未登录则跳转登录页 |
| HTTP 400 / 403 / 500 等 | 弹出 error（节流 1.5s），标记 `isSystemDown = true`，5s 后恢复；期间所有请求被拦截（登录过期弹窗模式除外） |
| `isSystemDown = true` 期间 | 新请求直接 throw，不发出，避免雪崩 |
| Token 过期（启用 refreshToken） | 自动调用 `refreshTokenApi` 换新 token 后重试原请求 |

**请求头自动注入：**
- `Authorization: Bearer <token>`（从 `useAccessStore` 读取）
- `Accept-Language: zh-CN / en-US`（从 `preferences.app.locale` 读取，后端 `LocaleMiddleware` 据此切换语言包）

**错误对象结构（重要）：**

`responseReturn: 'data'` 配置下，拦截器抛出的 error **直接就是后端响应体**，即：

```typescript
// error 的结构就是后端返回的 JSON：
// { code: 20213, message: '身份验证码错误或已过期', data: null, timestamp: ..., traceId: ... }

const code = error?.code;       // ✅ 正确
const msg  = error?.message;    // ✅ 正确

// ❌ 错误写法（axios 原始 error 结构，此项目不适用）
const code = error?.response?.data?.code;
```

**catch 使用原则：**

request.ts 已托管所有通用错误提示（warning/error 弹窗），**绝大多数情况下不需要 catch**。只有需要根据特定业务码做额外 UI 操作时才 catch，且 **catch 内不要再重复调用 `message.error()`**，否则会出现两个弹窗。

```typescript
// ✅ 正确：只处理特定业务码的 UI 副作用，不重复弹窗
try {
  await someApi(params);
} catch (error: any) {
  if (error?.code === BizCode.SOME_ERROR) {
    // 做 UI 操作，如清空输入框、跳转等
  }
  // 其他错误不处理，request.ts 已弹窗
}

// ❌ 错误：重复弹窗
try {
  await someApi(params);
} catch (error: any) {
  message.error(error?.message || '操作失败'); // request.ts 已弹过一次了
}
```

**silentError：完全接管错误处理**

需要自己控制所有错误提示时，传 `silentError: true` 跳过 request.ts 的自动弹窗：

```typescript
// API 函数层传入（推荐，统一管理）
export function someApi(data: SomeParams) {
  return requestClient.post('/admin/xxx', data, { silentError: true });
}

// 或调用时临时传入
try {
  await requestClient.post('/admin/xxx', data, { silentError: true });
} catch (error: any) {
  // error 直接是后端响应体 { code, message, data }
  // 此时 request.ts 不会弹窗，完全由业务层控制
  if (error?.code === BizCode.SOME_ERROR) {
    message.warning('自定义提示');
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

### 语言包目录结构

```
src/locales/langs/
├── zh-CN/
│   ├── captcha.json          # 验证码组件通用文案（组件级，不属于某个页面）
│   ├── authentication.json   # 登录/注册等 _core 页面
│   ├── common.json           # 全局公共按钮/状态文案
│   ├── profile.json          # 个人中心（_core 页面）
│   ├── upload.json           # 上传组件
│   ├── workspace.json        # 工作台
│   ├── dev/                  # views/dev/ 模块
│   │   ├── menu.json         # views/dev/menu/
│   │   └── curd.json         # views/dev/curd/
│   └── system/               # views/system/ 模块
│       ├── config.json       # views/system/config/
│       ├── dict.json         # views/system/dict/
│       └── captcha-driver.json  # views/system/captcha-driver/
└── en-US/
    └── ...（结构完全相同，由用户自行填充）
```

### 目录规则（强制）

- `views/_core/**` 对应的语言包放根目录（`zh-CN/*.json`），不加子目录
- `views/{module}/{page}/` 对应 `zh-CN/{module}/{page}.json`
- 组件级公共文案（如 captcha 验证码组件）放根目录，不属于某个页面
- 如果某个模块下有多个子页面且需要共享部分 key，可在模块目录下建 `common.json`

### $t() key 格式

语言包路径决定 key 前缀：

| 文件路径 | key 前缀 |
|---------|---------|
| `zh-CN/common.json` | `common.xxx` |
| `zh-CN/dev/menu.json` | `dev/menu.xxx` |
| `zh-CN/system/dict.json` | `system/dict.xxx` |
| `zh-CN/system/captcha-driver.json` | `system/captcha-driver.xxx` |

规律：**`{子目录}/{文件名}.{json内key路径}`**，子目录和文件名之间用 `/`，json 内部嵌套用 `.`。

### 使用方式

```typescript
import { $t } from '#/locales';

// 根目录语言包
$t('common.enabled')
$t('captcha.slide')

// 模块语言包
$t('dev.menu.pageTitle')
$t('system.dict.addDict')
$t('system.captcha-driver.saveSuccess')

// 带参数
$t('system.dict.confirmDeleteContent', { name: '性别' })
```

### i18n 开发强制要求

**每新增一个业务页面，必须：**

1. 在 `zh-CN/{module}/{page}.json` 创建对应语言包（**不要放在根目录**）
2. en-US 由用户自行填充，AI 不需要同步创建 en-US 语言包
3. 路由 `meta.title` 使用 `$t()` 而非硬编码字符串

**语言包结构约定：**

```json
{
  "pageTitle": "页面标题",
  "addXxx": "新增xxx",
  "editXxx": "编辑xxx",
  "confirmDelete": "确认删除该记录？",
  "createSuccess": "创建成功",
  "updateSuccess": "更新成功",
  "deleteSuccess": "删除成功",
  "fields": {
    "name": "名称",
    "status": "状态"
  }
}
```

**禁止行为：**
- 把业务页面的语言包放在根目录（如 `zh-CN/menu.json`）
- 在根目录语言包里混入业务页面的 key
- 使用 PowerShell `Set-Content` 写入含中文的文件（会导致编码损坏），必须用 `fsWrite` 工具

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
| `AvatarUpload`  | 头像上传（裁剪 + TUS 分片上传）       |
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
- [ ] `src/locales/langs/zh-CN/{module}/{page}.json` 添加中文翻译（**不要放根目录**）
- [ ] 后端菜单表配置路由（动态路由）或 `core.ts` 添加静态路由
- [ ] 路由 `meta.title` 使用 `$t()` 而非硬编码

---

## 十二、常见错误与建议

1. **API 字段名用下划线** → 必须改为 camelCase，与后端 Request/Response 保持一致
2. **直接修改 `@vben/stores` 的 userStore** → 框架字段用 `useUserStore`，业务扩展字段用 `useAdminUserStore`
3. **硬编码中文字符串** → 必须用 `$t()` 包裹，并同步更新中英文语言包
4. **新增错误码未同步 BizCode** → 后端新增 ErrorCode 时，前端 `error-codes.ts` 必须同步
5. **catch 块中用了 axios 原始 error 结构** → `responseReturn: 'data'` 下 error 直接是后端响应体，取 `error?.code` 和 `error?.message`，不是 `error?.response?.data?.code`
6. **catch 内重复调用 `message.error()`** → request.ts 已托管通用弹窗，catch 内只做 UI 副作用操作，不要再弹窗，否则出现两个提示
6. **动态路由写在 core.ts** → 只有认证相关的静态页面才放 `core.ts`，业务页面走后端菜单
7. **i18n 只更新了中文** → en-US 由用户自行填充，AI 只需创建 zh-CN 语言包
8. **业务页面语言包放在根目录** → 必须放 `zh-CN/{module}/{page}.json`，根目录只放组件级公共文案和 `_core` 页面文案
8. **VbenForm 使用了不存在的 ComponentType** → 参考第九节完整列表，自定义组件需先在 `adapter/component/index.ts` 注册
9. **时间展示未走时区转换** → 禁止直接用 `new Date()`、裸 `dayjs()` 展示时间，必须使用 `#/utils/time` 中的方法（见第十三节）

---

## 十三、时间处理规范

### 架构约定

- 后端所有时间字段统一返回 **秒级 UTC Unix 时间戳**（`number` 或 `string`）
- 前端展示时必须转换为用户时区，时区跟随右上角时区切换器（`useTimezoneStore`，默认设备时区）
- 禁止使用 `new Date(ts)`、裸 `dayjs(ts)` 直接展示，这两种方式不跟随时区设置

### 统一入口：`#/utils/time`

```typescript
import { formatUnixTime, formatDate, formatDateTime } from '#/utils/time';
```

### 使用场景

**场景 1：展示后端返回的时间戳（最常用）**

```typescript
import { formatUnixTime } from '#/utils/time';

formatUnixTime(data.createdAt)               // '2025-03-21 14:30:00'
formatUnixTime(data.createdAt, 'YYYY-MM-DD') // '2025-03-21'
formatUnixTime(null)                          // '-'（空值安全）
```

**场景 2：格式化 Date 对象 / dayjs 对象 / 毫秒时间戳**

```typescript
import { formatDate, formatDateTime } from '#/utils/time';

formatDate(new Date())       // '2025-03-21'
formatDateTime(new Date())   // '2025-03-21 14:30:00'
```

**场景 3：需要直接操作 dayjs 对象（计算时间差、加减等）**

```typescript
import dayjs from 'dayjs';

// 必须调用 .tz() 才能跟随时区设置，否则按 UTC 输出
dayjs.unix(ts).tz().format('YYYY-MM-DD HH:mm:ss')  // ✅
dayjs.unix(ts).format('YYYY-MM-DD HH:mm:ss')        // ❌ 不跟随时区
```

> `dayjs.tz` 的类型声明由 `#/utils/time` 在项目级全局注册，无需在每个文件单独 import 插件。
