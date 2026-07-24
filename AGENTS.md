# nbplus-vue 前端开发指南

本文件为 Claude Code 在 `nbplus-vue` 前端项目中工作时的指导性说明。

## 常用命令

以下命令默认已在 `nbplus-vue` 目录下执行，并使用 `pnpm`（`preinstall` 已强制要求）。

**Node.js 版本注意**：项目 `package.json` 要求 Node.js `>=20.19.0`，并锁定包管理器为 `pnpm@10.33.2`。当前环境可用的高版本 Node 安装在 `/www/server/nodejs/v22.18.0/` 和 `/www/server/nodejs/v24.15.0/`。执行任何 `pnpm` 命令前，请先把目标 Node 版本的 `bin` 目录加到 `PATH` 最前面：

```bash
export PATH=/www/server/nodejs/v22.18.0/bin:$PATH
# 然后即可正常使用 pnpm
pnpm -v
pnpm -F @vben/admin typecheck
```

**类型检查范围**：`vue-tsc` 会顺带解析 workspace packages 的源码，因此 `packages/` 下的类型错误也会出现在输出中。`packages/` 属于 vben 官方包，不主动修复；执行类型检查时只关注并报告 `apps/admin/src/` 下的错误。可用以下命令过滤：

```bash
pnpm -F @vben/admin typecheck 2>&1 | grep -E "^src/"
```

| 任务 | 命令 |
|------|------|
| 安装依赖 | `pnpm install` |
| 启动 admin 应用开发服务 | `pnpm dev:admin` |
| 通过 `turbo-run` 启动所有应用 | `pnpm dev` |
| 构建 admin 应用 | `pnpm build:admin` |
| 构建全部应用 | `pnpm build` |
| 全量类型检查 | `pnpm check:type` |
| 代码检查 | `pnpm lint` |
| 代码格式化 | `pnpm format` |
| 单元测试 | `pnpm test:unit` |
| 运行单个单元测试文件 | `pnpm vitest run --dom path/to/file.spec.ts` |
| 完整检查 | `pnpm check`（循环依赖、依赖声明、类型、拼写） |
| 清理后重新安装 | `pnpm reinstall` |

## 工作区结构

`pnpm-workspace.yaml` 包含以下目录：

- `apps/*` — 应用。主应用为 `apps/admin`（生产环境管理后台 SPA）。其他示例应用包括 `web-antd`、`web-ele`、`web-naive`、`web-tdesign`、`web-antdv-next`、`backend-mock`。
- `playground` — 位于根目录的演练场应用，通过 `pnpm-workspace.yaml` 单独纳入 workspace。
- `packages/*` — 共享框架包（`@core/*`、`effects`、`constants`、`utils`、`types`、`icons`、`locales`、`preferences`、`stores`、`styles` 等）。
- `internal/*` 和 `internal/lint-configs/*` — 构建工具、ESLint/Prettier/Stylelint/Tailwind 配置、`vite-config`、`vsh` 辅助 CLI、`turbo-run`。
- `scripts/*` — `clean.mjs`、`vsh`、`turbo-run`、部署脚本。
- `docs/` — VitePress 文档站点。

`turbo.json` 编排 `build`、`preview`、`build:analyze`、`dev`、`typecheck`、`test:e2e` 等任务。

## `apps/admin` 架构说明

基于 Vben Admin v5 + Ant Design Vue 构建。使用 `#/*` 路径别名指向 `src/*`。

关键区域：

- `src/api/` — API 客户端与命名空间。
  - `src/api/request.ts` — `requestClient` 配置为 `responseReturn: 'data'`，自动注入认证头、语言头，统一错误弹窗，并支持 `silentError` 选项。
  - `src/api/core/` — 认证、用户、菜单、上传、验证码、个人中心。
  - `src/api/sys/` — 系统配置、字典、用户、验证码驱动。
  - `src/api/error-codes.ts` — `BizCode` 枚举，必须与后端 `ErrorCode` 保持同步。
- `src/views/` — 页面组件。业务模块放在 `src/views/{module}/`；框架页面（登录、MFA、404、个人中心、关于）放在 `src/views/_core/`。
- `src/router/` — `routes/core.ts` 定义静态认证路由；`access.ts` 根据 `GET /menu/all` 生成动态路由；`guard.ts` 处理 token 校验和动态路由注入。
- `src/store/` — 业务 store 建立在 `@vben/stores` 框架 store 之上：
  - `useAuthStore` — 登录、MFA、登出、`fetchUserInfo`。
  - `useAdminUserStore` — 业务扩展字段（邮箱、手机号、权限）。
  - 框架 store（`useUserStore`、`useAccessStore`）位于 `@vben/stores`，不要在业务代码中重复定义。
- `src/adapter/` — VbenForm 适配器（`src/adapter/form.ts`）和组件注册表（`src/adapter/component/index.ts`）。自定义组件需先注册为 `ComponentType` 才能在表单中使用。
  - 业务组件若使用 `modelValue` 而非默认的 `value` 作为 v-model 属性（如 `Edit`、`ImageUpload`、`AvatarUpload`、`CaptchaPinInput`），必须在 `src/adapter/form.ts` 的 `modelPropNameMap` 中声明，否则 VbenForm 无法正确双向绑定。
- `src/components/` — 业务公共组件（上传组件、验证码、字典控件、wangEditor 等）。通过 `unplugin-vue-components` 自动按需加载。
- `src/locales/langs/` — i18n JSON。业务页面语言包放在 `zh-CN/{module}/{page}.json`；`_core` 页面和组件级文案放在根目录。
- `src/utils/time.ts` — 用于将后端返回的 UTC 时间戳按用户所选时区展示。

## 开发规范

- **API 字段**：全部使用 camelCase，与后端 Request/Response 保持一致。
- **HTTP 错误处理**：`request.ts` 已自动弹出错误提示；只有需要根据特定 `BizCode` 做 UI 副作用时才需要 `catch`，且 `catch` 内部不要再调用 `message.error()`。
- **错误对象结构**：由于配置了 `responseReturn: 'data'`，抛出的 error 就是后端 JSON 响应体（`error.code`、`error.message`），不是 `error.response.data.code`。
- **国际化**：每个新业务页面必须创建 `src/locales/langs/zh-CN/{module}/{page}.json`；路由 `meta.title` 必须使用 `$t()`。**日常开发只需维护 `zh-CN` 中文语言包，`en-US` 等其他语言上线前统一翻译，不必每个改动都同步。**
  - **复用优先于新建**：新增键之前先查 `common.json`（其次 `core/`、`components/`）是否已有同文案的键。通用字段标签（状态、创建时间、更新时间、操作、删除、编辑、确认等）直接引用 `common.*`，禁止在模块包里重复定义 `fields.status`、`fields.createdAt` 这类键。
  - **功能删除/重构时同步清理语言包**：删代码时顺手删掉对应翻译键，避免沉淀（历史教训：约 200 个沉淀键几乎全部来自功能改造后未清理）。
  - **动态拼接键组按组保留**：`$t(\`sys.file.options.status.${row.status}\`)` 这类形式的键无法靠静态 grep 判活；选项组（`options.*`）保持成组定义在模块内，不拆散、不抽 common。
  - **`ui.*` 是框架键**：`ui.formRules.*`、`ui.placeholder.*` 由 `packages/locales` 提供，应用层直接引用即可，不要在 apps 里重复定义。
  - **审计方法**：`$t('...')` / `t('...')` 静态键可与语言包做全量 diff 排查缺失/沉淀，但三元/变量拼接（如 `$t(type === 'mobile' ? 'a' : 'b')`）会产生误报，需人工确认。
- **时间展示**：始终使用 `#/utils/time`（如 `formatUnixTime`）格式化时间；当前项目关闭手动时区切换，默认按浏览器本地（系统）时区展示，但 `time.ts` 仍保留 `.tz()` 时区反显能力以便未来恢复切换；禁止使用裸 `new Date(ts)` 或裸 `dayjs(ts)`。
- **页面代码组织**：单个 `.vue` 文件应控制在 300-400 行以内，超过时必须拆分。
  - 页面目录结构：`index.vue`（页面入口与顶级状态） + `data.ts`（表单 schema、表格 columns、常量） + `composables/*.ts`（业务逻辑与数据操作） + `components/*.vue`（弹窗/复杂 UI 块）。
  - `index.vue` 禁止堆积大量 template 细节、多个 Modal 或复杂表单逻辑。
  - 函数体控制在 40 行以内，遵循单一职责与 early return。
  - 拆分组件时，如果某个组件明显可被多个页面复用（如通用树、通用选择弹窗、通用工具栏），应优先考虑提升到 `src/components/` 或 `packages/` 作为公共组件，并在实现前提示用户确认。
- **实现前检查**：先确认 `packages/effects/layouts/src/widgets/`、`packages/stores/src/modules/`、`packages/preferences/` 和 `apps/admin/src/api/core/` 中是否已有现成方案。

## 偏好设置与主题适配规范

Vben Admin 的「偏好设置」会把字号、主题模式、圆角、主题色等同步到 CSS 变量和 `html` 类名上。所有自定义组件、页面样式、富文本内容区都应**主动跟随**这些偏好，而不是写死固定值，确保切换偏好时整体视觉一致。

Vben 偏好设置注入的关键变量/类：

| 偏好项 | 来源/变量 | 说明 |
|--------|-----------|------|
| **字号** | `--font-size-base`（默认 `16px`） | 正文基础字号 |
| **主题模式** | `html.dark` 类 + `data-theme` | 暗色/亮色模式 |
| **主题色** | `--primary`、`--success`、`--warning`、`--destructive` 等 HSL 变量 | 主色、功能色 |
| **文字/背景色** | `--foreground`、`--background`、`--muted`、`--card`、`--border` 等 | 语义化颜色 |
| **圆角** | `--radius`（默认 `0.5rem`） | 全局圆角基准 |

### 1. 字号

**正文/基础文本**必须跟随 `--font-size-base`，禁止写死 `14px/16px`：

```css
/* ✅ */
font-size: var(--font-size-base);
/* 或不设置，继承父级 */

/* ❌ */
font-size: 14px;
font-size: 16px;
```

**标题、提示、辅助文字**使用相对单位或 Tailwind 语义类，保持层级：

```css
/* ✅ CSS 相对单位 */
h1 { font-size: 1.75em; }
h2 { font-size: 1.5em; }
.tips { font-size: 0.875em; }

/* ✅ Tailwind 语义类 */
<h1 class="text-2xl">标题</h1>
<p class="text-base">正文</p>
<span class="text-sm">辅助提示</span>
```

### 2. 颜色

使用 Vben 语义化 CSS 变量，确保暗色模式自动切换：

```css
/* ✅ */
color: hsl(var(--foreground));
background-color: hsl(var(--background));
border-color: hsl(var(--border));

/* ❌ */
color: #333;
background-color: #fff;
```

### 3. 圆角

组件/卡片/按钮的圆角优先使用 `--radius` 或基于它的 `calc()`，不要硬编码具体像素：

```css
/* ✅ */
border-radius: var(--radius);
border-radius: calc(var(--radius) * 0.5);

/* ❌ */
border-radius: 8px;
border-radius: 4px;
```

### 4. 暗色模式

暗色模式通过 `html.dark` 类切换。自定义样式需要区分明暗时，优先用 Tailwind 的 `dark:` 前缀，或在 `:global(.dark ...)` 中覆盖：

```css
/* ✅ Tailwind */
<div class="bg-white text-black dark:bg-black dark:text-white"></div>

/* ✅ CSS */
.my-component {
  background-color: hsl(var(--card));
}
:global(.dark .my-component) {
  background-color: hsl(var(--card));
}
```

### 5. 允许写死 px 的场景

以下情况可以使用固定像素，因为它们不属于「可缩放/可主题化」的视觉层级：

- 边框线粗细：`border: 1px solid ...`
- 图标描边、装饰性线条
- 必须固定尺寸的设计元素（如图表刻度、特殊徽章）

### 6. 富文本内容区示例

`apps/admin/src/components/rich-text-view/rich-text.css` 是规范样例：

```css
.rich-text-content {
  font-size: var(--font-size-base, 14px); /* 跟随偏好，未设置时回退 14px */
  line-height: 1.75;
  color: hsl(var(--foreground));
}

.rich-text-content h1 { font-size: 1.75em; }
.rich-text-content h2 { font-size: 1.5em; }
.rich-text-content h3 { font-size: 1.25em; }
.rich-text-content code { font-size: 0.9em; }
```

新增组件或页面样式前，先检查是否存在上述变量/类可用；如果必须自定义，也应按「基础值用 CSS 变量、层级用相对单位」的方式书写。

## 组件目录命名规范

`apps/admin/src/components/` 下的**子目录统一使用 kebab-case（短横线连接的小写）**命名，避免使用 camelCase 或 PascalCase：

- ✅ `quick-config-drawer/`
- ✅ `vxe-table/`
- ✅ `captcha-pin-input/`
- ✅ `online-devices/`
- ✅ 单字目录保持小写，如 `dict/`、`upload/`
- ❌ `captchaPinInput/`、`onlineDevices/`、`wangEditor/`

目录内部的 `.vue` 文件可使用 **PascalCase**（如 `DictSelect.vue`、`TableActions.vue`）或 **kebab-case**（如 `move-modal.vue`），但建议在一个项目内保持统一；当前项目公共组件文件以 PascalCase 为主，页面局部组件文件以 kebab-case 为主。

## 功能模块对外提供的组件能力

某个业务功能需要向**其他模块**提供可复用组件时（如系统参数模块的 `quick-config-drawer` 被文件管理页引用），不要直接放到 `apps/admin/src/components/`（那是通用 UI 原语的位置），而是放到该功能模块自己的 `shared/` 目录下：

```text
apps/admin/src/views/sys/config/
├── components/                    # 页面组件 + 模块内部复用的组件
│   ├── config-form.vue            # 页面私有
│   ├── config-item-list.vue       # 页面私有
│   └── config-value-input.vue     # 模块内部复用（列表页和抽屉共用）
├── shared/                        # 本功能对外暴露的复用能力
│   └── quick-config-drawer.vue    # 被文件管理页引用
├── composables/
└── index.vue
```

- `shared/` 只放**跨模块引用**的组件；模块内部多个页面/组件共用的组件仍然放在 `components/`。
- `shared/` 下文件统一使用 **kebab-case**，单文件即可，避免为单组件再套一层目录。
- 引用方式：`import QuickConfigDrawer from '#/views/sys/config/shared/quick-config-drawer.vue';`
- 如果某个能力确实需要子组件/工具文件，再升格为 `shared/{capability}/index.vue`。

## Composables 命名规范

`composables/` 下的文件名与导出的函数名保持一致，统一使用 **camelCase** 的 `useXxx.ts`：

- ✅ `useConfigForm.ts`（导出 `useConfigForm()`）
- ✅ `useFile.ts`（导出 `useFile()`）
- ❌ `use-config-form.ts`、`use-file.ts`

## 表格与操作列规范

### 1. 表格相关组件目录

**vxe-table 专用组件统一放在 `apps/admin/src/components/vxe-table/` 下**，非表格通用组件再放 `apps/admin/src/components/` 根目录。已有示例：

- `vxe-table/BatchActionDropdown.vue` — 批量操作下拉
- `vxe-table/ImgPreview.vue` — 单元格图片预览
- `vxe-table/CellInlineEdit.vue` — 单元格行内编辑
- `vxe-table/TableActions.vue` — 行内操作列按钮封装

新增 vxe-table 专属能力（如单元格状态标签、表格内嵌表单等）优先放到该目录，避免 `src/components/` 根目录过度膨胀。

### 2. 行内操作列设计

表格行内操作按钮统一使用 vxe-table 渲染器 `TableActions`（内部封装 `apps/admin/src/components/vxe-table/TableActions.vue`），保持全站操作列视觉与交互一致：

- **不主动缩小按钮**：除非特殊场景或为对齐布局，禁止随意加 `size="small"` 让按钮变小，保持默认尺寸。

- **图标 + 文字**：每个操作按钮必须同时有图标和简短文字，避免纯图标按钮语义不清。
- **文案简短**：优先 2 个字，如 `编辑`、`删除`、`详情`、`启用`、`禁用`、`预览`、`迁移`。
- **两主 + 更多**：最多直接平铺 2 个操作；第 3 个及之后的操作统一收进「更多 ▼」下拉菜单。
- **隐藏文字开关**：`TableActions` 提供 `showLabel` 属性控制平铺按钮是否显示文字，`moreShowLabel` 控制「更多」按钮是否显示文字。「更多」按钮默认只显示图标（`lucide:more-horizontal`），不显示「更多」二字。
- **危险操作**：删除等危险操作使用红色样式，必要时通过 `confirmTitle` 触发二次确认。
- **加载状态**：需要异步反馈的按钮可设置 `loading: true` 或 `(row) => boolean`。
- **列宽预留**：操作按钮 ≥ 3 个（含收进「更多」的）时操作列默认宽度 `200px`；仅 2 个操作时用 `160~170px`；隐藏文字可适当收窄。
- **禁用单元格 title 提示**：vxe-table 全局默认 `showOverflow: true`，操作列单元格会被赋予原生 `title`，悬停时显示为「编辑删除更多」等拼接文本。操作列必须显式设置 `showOverflow: false`，避免原生 title 干扰。

**标准用法：在 `columns.ts` 中使用 `cellRender: { name: 'TableActions' }`**：

```ts
import { useTableDelete } from '#/utils/table';

{
  title: $t('common.operation'),
  width: 180,
  fixed: 'right',
  showOverflow: false,
  cellRender: {
    name: 'TableActions',
    attrs: {
      actions: [
        {
          key: 'edit',
          label: $t('common.edit'),
          icon: 'lucide:pencil',
          hidden: !canUpdate,
          onClick: (row: XxxItem) => onEdit(row.id),
        },
        {
          key: 'delete',
          label: $t('common.delete'),
          icon: 'lucide:trash-2',
          danger: true,
          confirmTitle: $t('common.confirmDelete'),
          hidden: !canDelete,
          onClick: (row: XxxItem) => useTableDelete(deleteXxxApi, row.id, row.name, onRefresh),
        },
      ],
    },
  },
}
```

**非 vxe-table 场景**：直接使用 `TableActions` 组件（如 `sys/dict/components/item-list.vue` 中的原生 table）。

**特殊场景**：若操作列需要依赖组件内的响应式状态（如 `loading` 随 `ref` 实时变化），可在 `.vue` 模板 slot 中直接使用 `TableActions` 组件。

## 列表详情与抽屉规范

标准 vxe-table 列表页的新增/编辑/详情，**默认使用右侧抽屉（Drawer）承载表单**，与 `sys/user`、`sys/role` 等模块保持一致：

- **默认右侧抽屉**：列表页的主表单（新增、编辑、详情）统一走 `useVbenDrawer`，`placement` 为右侧。不要随意改用中间弹窗（Modal）或把抽屉放到其他位置。
- **详情入口**：列表中代表业务主键的字段（如名称、标题、用户名、编码等，通常放在第一列但不是必须）使用 `CellLink` 渲染，点击后打开详情抽屉。
- **详情 = 同一表单的只读态**：新增/编辑/详情**共用一个抽屉表单组件**，不单独维护详情页。CellLink 打开时通过 `setData({ ...row, readonly: true })` 传入只读标记，表单据此进入详情态：隐藏确认按钮 + 禁用全部控件（antd `Form :disabled` 或 VbenForm `disabled`）。
- **禁用态必须保证回显**：ApiSelect/PageSelect 等数据选择组件默认 `immediate` 加载，禁用不阻断数据请求，可正常显示已选值的 label；若某处设置了 `:immediate="false"`（如选择类弹窗的性能优化），详情态打开时必须手动 `reload()` 后再赋值，避免禁用下只回显原始 ID。
- **抽屉中的内容弹窗**：抽屉内部若需要二次交互（如选择器、确认框），可再使用弹窗；但列表到表单的层级默认是抽屉。
- **非 list 规范页面以弹窗为主**：「我的消息」等不属于列表页规范的个人功能页，详情交互以弹窗（Modal）为主，不强制套用抽屉规范。

> 这不是硬性强制标准，而是项目默认规范。若因业务需要（如复杂多步骤表单、全屏编辑）必须改用其他形态，应在实现前说明理由。

**标准用法：标题/名称列作为详情入口**

```ts
const canDetail = hasAccessByCodes(['xxx:xxx:detail']);

{
  field: 'title',
  title: $t('xxx.fields.title'),
  minWidth: 160,
  cellRender: {
    name: 'CellLink',
    attrs: {
      hasAccess: canDetail,
      onClick: (row: XxxItem) => onDetailClick(row.id),
    },
  },
}
```

**标准抽屉表单结构**

```vue
<script setup lang="ts">
const emit = defineEmits<{ success: [] }>();

const isReadonly = ref(false);
const rowId = ref<string | undefined>();
const isEdit = computed(() => !!rowId.value);

const [Form, formApi] = useVbenForm({
  schema: computed(() => useFormSchema(isEdit.value)) as any,
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues<XxxSaveParams>();
    drawerApi.lock();
    try {
      await (rowId.value ? updateXxxApi({ id: rowId.value, ...values }) : createXxxApi(values));
      emit('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = drawerApi.getData<XxxItem & { readonly?: boolean }>();
    formApi.resetForm();
    isReadonly.value = data?.readonly ?? false;
    if (data?.id) {
      rowId.value = data.id;
      await nextTick();
      const detail = await getXxxDetailApi(data.id);
      formApi.setValues(detail);
    } else {
      rowId.value = undefined;
    }
  },
});
</script>

<template>
  <Drawer
    :title="isReadonly ? $t('xxx.detail') : rowId ? $t('xxx.edit') : $t('xxx.create')"
    :show-confirm-button="!isReadonly && (!!rowId ? canUpdate : true)"
  >
    <Form :disabled="isReadonly" />
  </Drawer>
</template>
```

## 批量操作规范

所有涉及多条记录的批量操作（批量删除、批量更新字段、批量启用/禁用等）必须保持**统一的交互行为**：

1. **二次确认弹窗**：点击批量操作按钮后必须先弹出 `Modal.confirm` 确认框，明确告知用户即将操作的记录数与操作类型，禁止直接发起请求。
2. **确认按钮倒计时**：确认框的「确认」按钮默认倒计时 **3 秒**，倒计时期间按钮禁用；倒计时结束后按钮恢复可点击状态，文案由倒计时提示恢复为确认文案。
3. **统一实现方式**：
   - **vxe-table 表格场景**：优先使用 `apps/admin/src/components/vxe-table/BatchActionDropdown.vue`，其 `direct` / `field` / `dict` / `select` / `multi` 模式内部已封装 `useTableBatchAction`。
   - **非表格或自定义场景**：直接调用 `apps/admin/src/utils/table.ts` 中的 `useTableBatchAction(apiFn, ids, action, onSuccess, { countdown: 3 })`。
4. **统一文案**：确认弹窗标题、内容、倒计时提示、成功提示统一使用 `common.json` 中的公共键：
   - `common.batchActionConfirmTitle`
   - `common.batchActionConfirmContent`
   - `common.batchActionCountdown`
   - `common.batchActionSuccess`
   - `common.batchActionNoSelection`
5. **空选处理**：调用批量操作前若未选中任何记录，统一提示 `common.batchActionNoSelection`，禁止直接调用接口。
6. **成功回调**：操作成功后统一清空当前已选状态（如表格复选框、树形勾选键），并刷新列表/树数据。

**参考实现**：
- 表格批量删除：`apps/admin/src/views/sys/user/index.vue` 中 `BatchActionDropdown` 的用法。
- 树形批量删除：`apps/admin/src/views/sys/dept/composables/use-dept.ts` 中 `handleBatchDelete` 对 `useTableBatchAction` 的调用。

## 弹窗内容刷新规范

弹窗（Modal/Drawer）加载数据时，遵循**「按需刷新 + 手动刷新兜底」**原则，避免每次打开都重复请求：

1. **默认不自动刷新**：普通弹窗（尤其是仅做选择、确认、轻量编辑的场景）打开时不应自动发起数据请求，避免不必要的接口调用和日志噪音。
2. **右上角刷新按钮**：弹窗标题右侧（靠近原生关闭按钮）应尽量提供刷新按钮，让用户或开发调试时可主动刷新当前弹窗内容。**落位按组件区分**：Drawer 统一使用 `#extra` 插槽（popup-ui 原生提供，位置恰好在关闭 X 左侧）；Modal 无头部操作插槽，统一放在 `title` 插槽内并加 `pr-8` 避让绝对定位的关闭 X（参考 `user-org-modal.vue`、`menu-permission-modal.vue`）。
3. **编辑/详情类弹窗例外**：列表行内的编辑、详情等弹窗，由于需要回显最新数据，打开时应当自动刷新内容；同时也建议保留右上角刷新按钮，方便二次刷新。
4. **实现方式**：
   - 数据选择组件（如 `ApiSelect`/`ApiTreeSelect`）设置 `:immediate="false"`，通过 `ref` 暴露或组件自带的 `reload()` 方法手动触发加载。
   - 表单回显类弹窗在 `onOpenChange`/`onMounted` 中按需调用加载接口。
   - 刷新按钮放在 `title` 插槽内，**保留原生关闭按钮**，不要替换 `closeIcon` 插槽。

**参考实现**：`apps/admin/src/views/sys/user/components/user-org-modal.vue`（选择类弹窗，手动刷新）

## 页面典范（新增/重构时参考）

以下三个模块已按统一规范重构，可作为不同交互形态的**标杆实现**，新增类似功能时优先复制其目录结构与编码模式：

| 典范模块 | 路径 | 代表形态 | 核心结构 |
|----------|------|----------|----------|
| 用户管理 | `apps/admin/src/views/sys/user/` | 标准表格 CRUD | `composables/`（业务逻辑）+ `components/`（弹窗子组件）+ `schema/`（表单/表格配置）+ `index.vue`（组装） |
| 字典管理 | `apps/admin/src/views/sys/dict/` | 左右布局（左侧分类 + 右侧列表） | `composables/` + `components/` + `data.ts`（常量/工具）+ `index.vue` |
| 菜单管理 | `apps/admin/src/views/dev/menu/` | 父子树管理 | `composables/` + `components/` + `data.ts`（常量/树工具）+ `index.vue` |

**统一约定**：
- `composables/`：封装响应式状态、API 调用、副作用。文件名以 `useXxx.ts` 命名。
- `components/`：只放 `.vue` 子组件（弹窗、复杂 UI 块）。
- `schema/`：仅标准表格模块需要，集中管理 `VbenForm` schema 与 `VxeTable` columns。
- `data.ts`：非 schema 类常量、枚举选项、纯工具函数（无响应式状态）。
- `index.vue`：只负责组装页面、事件委托，不堆积业务逻辑与 template 细节。

## 拖拽交互规范

项目已安装 `vuedraggable@catalog:`，**列表/表格/卡片等平级排序应优先使用 `vuedraggable`**，避免手写拖拽 DOM 逻辑。

- **平级列表/表格行拖拽**：使用 `vuedraggable`，拖拽结束后计算新顺序并调用后端排序接口。
- **树形拖拽**：Ant Design Vue 的 `Tree` 组件原生支持 `draggable` + `@drop`，此场景可手写，但应在 `composables` 或 `data.ts` 中封装通用排序计算函数（如 `buildGlobalSortItems`），避免在 `.vue` 中堆积算法细节。
- **禁止**：在 `.vue` 中手写大量拖拽定位、DOM 操作、位置计算代码。

## 配置说明

- `apps/admin/.env` / `.env.development` / `.env.production` 控制应用标题、命名空间、store 加密密钥、开发端口和接口基地址（`VITE_GLOB_API_URL`）。
- `apps/admin/vite.config.mts` 使用 `@vben/vite-config` 的 `defineApplicationConfig`，注册 Ant Design Vue 自动按需加载，开发服务端口为 `2300`。
- 开发环境下 `VITE_NITRO_MOCK=false`，前端预期直接请求真实的 Hyperf 后端。
