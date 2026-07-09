# nbplus-vue

基于 [Vben Admin v5](https://github.com/vbenjs/vue-vben-admin) 二次开发的企业管理后台前端项目。

## 环境要求

- Node.js `>= 20.19.0`
- pnpm `10.33.2`（项目已锁定，请勿使用 npm/yarn）

## 常用命令

```bash
# 安装依赖
pnpm install

# 启动 admin 开发服务
pnpm dev:admin

# 构建 admin 应用
pnpm build:admin

# 类型检查
pnpm check:type

# 代码检查
pnpm lint

# 完整检查
pnpm check
```

## 仓库维护方式

本项目 fork 自 [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin)，并在此基础上进行业务二次开发。

### 远程仓库约定

| 远程名 | 地址 | 用途 |
|--------|------|------|
| `origin` | `https://gitee.com/wfuren/nbplus-vue.git` | 我们自己的业务仓库，日常 push/pull 都在这里 |
| `upstream` | `https://github.com/vbenjs/vue-vben-admin.git` | 官方 Vben Admin 上游仓库，用于同步官方更新 |

### 同步官方更新

由于 Vben Admin 是一个完整的项目模板，不是 npm 插件，因此**无法一键升级**，只能手动合并官方代码。

推荐小步快跑，定期同步，避免长期堆积导致冲突爆炸。

```bash
# 1. 拉取官方最新代码
 git fetch upstream

# 2. 查看当前分支与官方的差距
git log --oneline --left-right --graph main...upstream/main

# 3. 找到分叉点，评估需要合并的范围
git merge-base main upstream/main

# 4. 创建一个专用的同步分支来合并，不要直接在 main 上操作
git checkout -b sync/upstream-$(date +%Y-%m-%d) main
git merge upstream/main

# 5. 解决冲突后，本地测试通过再合并回 main
pnpm check:type
pnpm lint
pnpm build:admin

# 6. 测试无误后合并并推送
git checkout main
git merge sync/upstream-$(date +%Y-%m-%d)
git push origin main
```

### 减少冲突的建议

- 业务代码尽量写在 `apps/admin/src/` 下，少改动 `packages/@core/*`、`packages/effects/*` 等核心包。
- 不要写无意义的 commit message（如 `1`、`2`、`暂存`），请使用 `pnpm commit` 或遵循 conventional commit 规范。
- 同步频率建议每月至少一次，切忌半年或一年才同步一次。

### 分支约定

- `main`：主分支，与官方 `main` 保持同步，并承载我们的业务代码。
- `sync/upstream-YYYY-MM-DD`：临时同步分支，用于合并官方代码并解决冲突，合并后删除。
- 功能开发请从 `main` 切出 `feat/xxx` 或 `fix/xxx` 分支，通过 PR/MR 合并回 `main`。

---

> 更多开发规范请参考项目根目录的 [AGENTS.md](./AGENTS.md)。
