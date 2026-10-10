# Proposal

## Why

MVP-D01-B 已能跨进程保存 Action / Run 和独立审核交接，但尚未提供完整阶段 instructions 的受控读取；rejected 或实际操作者更换后没有正常处置入口，残留锁阻断查询，保存故障说明还依赖上游 status。023 的真实 proof 和 024 的独立批准支持在 MVP-D01-C 内收敛这些必要边界，再接通 Explore / Propose 与对应审核方法。

## What Changes

- 为当前 Explore / Propose 及相应 Review 提供只读 `action instructions`：读取固定 OpenSpec 1.14.1 的完整当前 artifact 指引、目标 context / rules、输出位置与直接依赖，由 Agent 消费；不自动生成产物、提交 Run 或批准。
- `run save` 使用本地配置、当前 product draft、身份、明确正文与安全写入，不要求上游进程可用；正式 submit、Action 开始 / 继续、固定 Author 校验继续要求原有必要输入。
- 增加显式 Owner `action resolve` 的两种受限处理：交接未完成的 Explore / Propose Author 或 Reviewer 工作；在 rejected 后建立同阶段 Author 修订。决策保存在新工作 Run，不修改旧 Run / verdict、不代签或跨阶段回退。
- 增加不依赖上游的只读 `workspace diagnose`，在有锁时报告当前实际文件、指定失败现场与写者存活观察；本轮不提供自动或产品解除锁命令。确需人工解除时要求新的 Owner 明确授权、停止所有该目标写者、核对同一 token 与实际提交状态，不能把 pid 不存在当充分授权。
- 补充最简 Explore / Review Explore / Propose / Review Propose 和 OpenSpec 工具指导，将核心 proof、依赖消费、方案一致性与独立 verdict 明确分工。完善 proof 脚本的新临时父目录准备，保留历史结果。
- 统一探索材料：新 Explore 的分析 / 候选 / proof 摘要写进 Run，不再新增 Change 级 explore.md；既有受审文件原样保留，正式方案承接有效决策。

## Capabilities

### New Capabilities

无。复用现有能力边界。

### Modified Capabilities

- `project-entry`: 完整 instructions 的公开 CLI 协议、身份和路径校验；明确本地保存 / 诊断不启动固定工具，而依赖上游的操作继续验证工具和根。
- `action-runs`: 按需阶段 instructions、仅依赖本地的 draft 保存、受限 Owner 决策生成新工作 Run、阶段方法与探索材料的责任分工。
- `delivery-workspace`: 按操作区分本地 / 上游输入，以及锁存在时的只读现场诊断与人工处置边界。

## Impact

后续 Apply 涉及 `src/adapters/openspec.ts`、Action / Run 与 workspace adapter、application、CLI 参数 / 驱动、对应产品 Skills、相关测试与 proof 脚本；保持 TypeScript、普通 check 和现有安全写入方式，无新增运行依赖。现有人工 bootstrap 写入限制、旧 Run / verdict、OpenSpec 原生配置保持兼容。

不实现身份认证、跨阶段回退、持久 stop / abort 操作、解除锁命令、Archive / 归档恢复或第二 Change 产品激活；Apply / Archive 的阶段接线与主动回退归 MVP-D01-D，Git、正式 Delivery Full Test / Close 维持独立授权边界。
