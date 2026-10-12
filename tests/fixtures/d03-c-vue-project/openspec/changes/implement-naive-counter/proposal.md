# Proposal

## Why

当前目标仍为官方 Vue 空壳，尚无可由应用与 Storybook 共同使用的业务组件。本 Change 用一个计数器完成稳定 MenDi / OpenSpec 的真实阶段交接和 Storybook 最小使用，取得可独立审核的组件行为与有限工程结果。

## What Changes

- 新增唯一 CounterPanel，默认显示 0，支持初值 5、加一、重置到 0 和禁用不变；App 只挂载该组件。
- 使用 Vue Composition API、`script setup` TypeScript 与 Naive UI 按钮，App 和三个 stories 共用同一实现。
- 增加默认、已有数值、禁用三个 stories，使用既有 Storybook Vitest plugin / Chromium 做有限交互断言。
- 将 `verify:stories` 映射到 MenDi 普通 focused 测试，保留目标 check / build，并增加 build-storybook；通过官方 CLI 预览和宿主真实浏览器核对交互、页面错误及本次服务收尾。
- 目标阶段与结果只写本目标；独立 Review Apply approved 后停待 Archive。

## Capabilities

### New Capabilities

- `naive-counter`：应用和 Storybook 共用的可加一、归零及禁用的本地计数器。

### Modified Capabilities

无。目标现有主规格为空。

## Impact

影响本目标 `src/App.vue`、新增 `src/components/CounterPanel.vue` / stories、`.storybook/`、Vitest 配置、package.json 和使用说明；依赖沿用已安装及锁定版本，不重建项目或升级工具。必要原始输出只存本目标受控 artifacts / `.mendi/`，维护 TS / Vue 和配置由目标真实类型检查覆盖。

本 Change 不新增后台、Router、Pinia、持久化或通用 runner。不执行额外新 Author 恢复、目标 Archive、正式 Full Test / failure / repair / Close、五项 runner、预算负例、Git 或清理；取消项不计通过。
