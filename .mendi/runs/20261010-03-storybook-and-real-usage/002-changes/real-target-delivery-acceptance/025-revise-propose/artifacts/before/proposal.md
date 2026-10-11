## Why

D03-A / B 已提供 Storybook 工作路径、稳定安装和目标 OpenSpec 方法接入，但有限环境 proof 尚不能证明 Agent 能用 MenDi 在真实 Vue 项目完成交付。按已批准的 016 / 017 探索，把验收收敛到一份从空目录建立的 Vue + Naive UI 工程，验证实际规划、实施、交接与结果，避免双目标重复流程。

## What Changes

- 在 `tests/fixtures/d03-c-vue-project/` 从空目录使用官方 Vue 脚手架建立唯一受控工程；先准备空壳，再在目标真实 OpenSpec Change 中规划计数器，获必要审核后实现 `CounterPanel.vue` 的加一、重置和禁用。App 与 Storybook 使用同一个组件，不复制 Explore 探针或旧实现作为起点。
- 使用 B 已验证的仓库外 MenDi 安装及固定 OpenSpec 1.14.1 入口，实际取得目标方法、context / rules 和 instructions，按阶段保存真实 Run；方案不重复创建已绑定 Change，归档不重复同步规格。
- 目标自行维护依赖、锁文件、独立 pnpm workspace、`.vue` 类型检查、stories、有限测试及浏览器验证。Storybook 使用 10.6.1 项目脚本、官方 CLI 和浏览器；本轮不启用 MCP。
- 在唯一 Vue Apply 留下确实未执行的交互与浏览器验收任务，由另行获授权的新 Author 会话从合法 continuing 恢复完成；独立 Reviewer 实际审核，Author 不自签，不要求 Owner 逐阶段审核演示项目。
- 保留 Vue 一次实际 Archive、正式 Full Test 的明确受控业务失败、范围内修复、独立定向补审、原完整集合新整次执行及首次 Close，全部在具体目标授权成立后执行。普通类型负例和测试失败不冒充正式结果。
- 无 UI 仅沿用适用工程结果并补变化；Reopen / 新 Open / 旧 PASS / unknown 沿用 D02-C 的适用结论，取消无 UI 完整生命周期和第二轮重复交付。六个工作分组内按独立完成单元拆分任务，分别记录工程、Author 与 Reviewer 的实际结果；取消范围不勾成执行通过。

## Capabilities

### New Capabilities

无。根 C 是既有 MenDi 能力的工程示例与组合验收，不增加产品行为合同，使用 `skip_specs: true`。

### Modified Capabilities

无。沿用 `project-entry`、`action-runs`、`storybook-integration`、`test-execution`、`delivery-verification` 与 `delivery-lifecycle` 的现有合同；不编造规格 delta。计数器业务规格由后续目标自己的 OpenSpec Propose 形成，不能与根 MenDi 规格混用。

## Impact

主要实施位于唯一目标工程及根 C 当前 Run；必要时调整根工程对该独立 Vue 项目的格式 / 类型检查归属，Vue 源码与目标 TS 脚本由目标自身真正检查。默认不改 MenDi 产品源码，不扩展旧 HTML 夹具、旧 proof 或无关测试；发现具体接线缺陷才按影响局部处理。

完整设计、命令入口、预算、真实会话任务和授权见 `design.md`；`tasks.md` 保留六组、23 项待做工作（0/23），任务数来自完成单元，不是数量门槛。当前只完成规划，尚未创建实际 Vue 目标或实现计数器，旧 Run / verdict 保持原样；交接独立 Review Propose，不自动 Apply、Archive、正式 Full Test / Close、Git 或子智能体。
