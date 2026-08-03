# nbplus-vben

nbplus 管理后台前端项目，基于 [Vben Admin v5](https://github.com/vbenjs/vue-vben-admin) 构建。

## 技术栈

- Vue 3
- TypeScript
- Vite
- pnpm monorepo
- Vben Admin v5

## 环境要求

- Node.js >= 18
- pnpm >= 8

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动 admin 开发服务
pnpm run dev:admin
```

## 项目结构

```
nbplus-vue/
├── apps/
│   ├── admin/          # nbplus 管理后台
│   ├── backend-mock/   # 后端 mock 服务
│   ├── web-antd/       # Vben 官方示例（antd）
│   ├── web-antdv-next/ # Vben 官方示例（antdv）
│   ├── web-ele/        # Vben 官方示例（element-plus）
│   └── web-naive/      # Vben 官方示例（naive-ui）
├── internal/           # 内部工具与配置
├── packages/           # 共享包
└── ...
```

## 后端服务

nbplus 后端 API 服务地址：

- https://github.com/233cy/nbplus-233cy

## 仓库说明

本仓库已从 Gitee 迁移至 GitHub，后续更新与维护均在此仓库进行。
