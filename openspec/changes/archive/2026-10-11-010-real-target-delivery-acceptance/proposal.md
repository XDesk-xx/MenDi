## Why

D03-A / B 已提供 Storybook 路径、稳定安装和目标方法接入。D03-C 通过一个从空目录创建的 Vue + Naive UI 工程，确认稳定 MenDi 能组织真实 OpenSpec 工作与独立交接，并实际使用 Storybook；当前只需一次最小真实使用。

## What Changes

- 沿用 023 从不存在的目录直接调用官方 create-vue 创建的唯一受控空壳；目标真实方案独立批准后实现一个 CounterPanel 的加一、重置与禁用，App / Storybook 共用组件，不复制旧实现或补造规划历史。
- 使用固定 MenDi / OpenSpec 入口实际读取目标方法、instructions 和任务，按现有合法阶段完成目标方案、Apply 和必要独立审核。目标记录只留在目标 openspec/ 与 .mendi/；根 Run 汇总结果和少量直接引用，不重复目标阶段或复制证据树。
- 目标维护自己的 UI 依赖、锁、配置、真实 Vue 类型检查、三个 stories、有限交互和官方 CLI / 浏览器使用结果；至少一次稳定 MenDi 普通 focused 测试运行目标脚本。本轮不启用 MCP。
- 取消额外新 Author 恢复、目标 Archive、正式 Full Test 失败注入 / 修复 / 专门补审 / 完整重跑、首次 Close、五项 full runner 和额外预算负例。目标合法停在 Apply 独立批准后的待 Archive，不声明上述取消范围已验证。
- 无 UI 工程与 A / B / D02-C 的未变化结论按适用范围沿用；保留历史 Run / verdict，取消项明确标注，不记为执行通过。

## Capabilities

### New Capabilities

无。根 C 是既有能力的一次使用验收，skip_specs: true 保持，不创建 MenDi delta。

### Modified Capabilities

无。现有项目入口、Action / Run、Storybook 与测试合同不改变；目标计数器规格由目标自己的 Propose 形成。

## Impact

实施范围为 tests/fixtures/d03-c-vue-project 的最小组件、stories、配置与说明，以及根当前 C 的必要进度和结果交接。默认不改 MenDi 产品源码、其他 fixtures、旧 proof、历史 Run 或稳定安装；实际产品问题先报告，不允许目标工作自行扩散修改。

当前根 tasks 为四组 10 项，3/10，已有空工程 / 依赖 / 方法 / 准备短验有效结果保留；未执行组件和目标阶段。本次 025 revise-propose 只收敛方案与当前交接，停独立 Review Propose，不实现代码、启动 Agent 或执行目标 / 根生命周期和 Git。具体记录边界、取消项及执行限制见 design.md / tasks.md。
