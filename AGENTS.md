# nbplus-vue 前端开发指南

本文件为 AI 在前端项目工作时的入口指引：只放命令、红线与指针。具体规范在 `.agents/` 主题文件中，**按任务类型选读对应主题即可，不要一次全读**。

## 常用命令

以下命令默认已在 `nbplus-vue` 目录下执行，并使用 `pnpm`（`preinstall` 已强制要求）。

**Node.js 版本注意**：项目要求 Node.js `>=20.19.0`，锁定 `pnpm@10.33.2`。当前环境可用的高版本 Node 在 `/www/server/nodejs/v22.18.0/` 和 `/www/server/nodejs/v24.15.0/`。执行任何 `pnpm` 命令前，先把目标 Node 版本的 `bin` 目录加到 `PATH` 最前面：

```bash
export PATH=/www/server/nodejs/v22.18.0/bin:$PATH
```

| 任务 | 命令 |
|------|------|
| 安装依赖 | `pnpm install` |
| 启动 admin 开发服务 | `pnpm dev:admin` |
| 构建 admin 应用 | `pnpm build:admin` |
| 类型检查（只看应用错误） | `pnpm -F @vben/admin typecheck 2>&1 \| grep -E "^src/"` |
| 代码检查 / 格式化 | `pnpm lint` / `pnpm format` |
| 单元测试 | `pnpm test:unit`；单文件 `pnpm vitest run --dom path/to/file.spec.ts` |
| 完整检查 | `pnpm check` |

`vue-tsc` 会顺带解析 workspace packages 源码；`packages/` 属 vben 官方包，类型错误不主动修，只关注 `apps/admin/src/` 下的错误。

## 红线（每次会话必须遵守）

- **沟通语言**：始终使用中文沟通、写代码注释；技术术语、标识符、命令、路径保持原样。
- **代码检索**：跨文件依赖先用 `codegraph explore` / `codegraph node` 查证，禁止凭文件名或记忆猜测关联。
- **API 字段**：全部 camelCase，与后端 Request/Response 保持一致；后端新增 `ErrorCode` 时必须同步 `src/api/error-codes.ts` 的 `BizCode`。
- **HTTP 错误处理**：`request.ts` 已自动弹出错误提示；只有需要根据特定 `BizCode` 做 UI 副作用时才 `catch`，且 `catch` 内部不要再调用 `message.error()`。错误对象就是后端 JSON 响应体（`error.code`、`error.message`）。
- **时间展示**：始终使用 `#/utils/time`（如 `formatUnixTime`）；禁止裸 `new Date(ts)` 或裸 `dayjs(ts)`。
- **国际化**：每个新业务页面必须创建 `src/locales/langs/zh-CN/{module}/{page}.json`；新增键先查 `common.json` 复用；删代码时同步清理翻译键；日常只维护 `zh-CN`。
- **主题适配**：字号、颜色、圆角禁止写死，跟随 Vben 偏好设置的 CSS 变量（细则见 `.agents/theme.md`）。
- **页面组织**：单个 `.vue` 文件控制在 300-400 行以内，超过必须拆分；`index.vue` 不堆积业务逻辑与 template 细节。
- **组件目录**：`src/components/` 子目录统一 kebab-case。
- **v-model 陷阱**：业务组件用 `modelValue` 而非 `value` 作 v-model 属性时，必须在 `src/adapter/form.ts` 的 `modelPropNameMap` 中声明。
- **实现前检查**：先确认 `packages/effects/layouts/src/widgets/`、`packages/stores/src/modules/`、`packages/preferences/` 和 `apps/admin/src/api/core/` 是否已有现成方案。
- **违规申辩机制（规范不是绝对）**：当严格遵守某条规范会带来明显更差的结果时，允许提出违反方案，但必须在实施前**醒目标出**：① 违反了哪个文件的哪条规则；② 违反带来的收益；③ 遵守的代价与违反的风险（优缺点必须客观，不夸大）；由开发者决定是否接受。未经声明的违反不允许；已被接受的个案不构成新规范，下次遇到仍需重新声明。

## 页面典范（新增/重构时优先复制其结构）

| 典范模块 | 路径 | 代表形态 |
|----------|------|----------|
| 用户管理 | `apps/admin/src/views/sys/user/` | 标准表格 CRUD |
| 字典管理 | `apps/admin/src/views/sys/dict/` | 左右布局（左侧分类 + 右侧列表） |
| 菜单管理 | `apps/admin/src/views/dev/menu/` | 父子树管理 |

## 按需加载指针

| 任务类型 | 先读 |
|----------|------|
| 列表页、表格、操作列、批量操作、弹窗刷新 | `.agents/table.md` |
| 页面组织与拆分、抽屉表单、页面典范详解 | `.agents/page.md` |
| 样式、暗色模式、字号、主题适配 | `.agents/theme.md` |
| 组件命名、shared/ 目录、composables、拖拽 | `.agents/components.md` |
| 语言包与翻译 | `.agents/i18n.md` |
| 审批引擎页面（流程/实例/待办 + registry 详情跳转注册） | `apps/admin/src/views/approval/`、`apps/admin/src/views/demos/approval/` |

**写页面前务必先读典范源码**（上表三个模块），以标杆代码为准，文字规范只是索引。

## 维护本文件的规范

- 本入口只放命令、红线与指针；具体细则一律写进 `.agents/*.md` 主题文件，禁止往本文件追加具体规则。
- 行数是软约束（本文件 ≤60 行、主题文件 ≤150~180 行）；超限时先考虑拆分或下沉，而不是无限制追加。
- 规范与代码现状冲突时，以代码为准并更新对应主题文件，不要在入口打补丁。
- 新增主题文件时，必须在本文件指针表登记一行。
- **时效性策略**：规范默认信任，不做全量验证；仅在 ① 规范与眼前代码直接矛盾、② 规范引用的类/方法/路径在代码中找不到、③ 用户提及相关模块近期重构 时，对被触发的单条规范做代码核实。发现漂移时：事实性过期（类改名/路径变更，代码证据确凿）直接修复对应规范文件并在回复中告知用户；行为规则与代码现状不符时不得自行修改，报告用户裁决（可能是规范过期，也可能是代码未遵守规范）。
