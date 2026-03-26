# 实现前先检查现有方案（前端）

## 核心原则

**在开始实现任何功能之前，必须先确认框架或项目中是否已有现成方案。**

## 检查来源

1. **vben-admin 框架内置功能**
   - `packages/effects/layouts/src/widgets/` — 内置 UI 组件（锁屏、通知、用户下拉、搜索等）
   - `packages/stores/src/modules/` — 内置 store（accessStore、userStore 等）
   - `packages/preferences/` — 全局偏好配置（功能开关、主题、快捷键等）
   - `packages/effects/layouts/src/basic/` — BasicLayout 已集成的 slot 和功能

2. **项目已有代码**
   - `apps/admin/src/components/` — 业务公共组件
   - `apps/admin/src/store/` — 业务 store
   - `apps/admin/src/api/core/` — 已有接口封装

## 行为规范

**发现现有方案时，必须：**
- 直接告知用户"该功能框架/项目已有实现"
- 说明现有方案的位置、工作原理和使用方式
- 询问用户是否需要在此基础上扩展，而不是直接开始新的实现

**禁止行为：**
- 发现框架已有实现，仍然绕过它重新造轮子
- 未经检查就直接开始设计和编码
- 把框架能解决的问题复杂化，引入不必要的后端改动
