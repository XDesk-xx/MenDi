---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: storybook-lightweight-integration
planningSlot: MVP-D03-A
batchId: 002-changes
actionId: storybook-lightweight-integration-review-propose-01
actionType: review-propose
role: reviewer
run: "005"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: apply
nextRole: author
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/storybook-lightweight-integration/004-propose/run.md
---

# MVP-D03-A Review Propose

Owner 指令：review-propose，重点检查服务归属、根工程检查与 UI fixture 依赖准备的职责，以及 MCP 的可选边界，保持简单，不增加新的 gate。使用项目 [Review Propose 方法](D:/Projects/MenDi/skills/actions/review-propose/SKILL.md)，固定独立审核 [004 Propose](../004-propose/run.md) 与 proposal、design、两份 delta specs、tasks。

**verdict：approved。** 无阻断发现，方案可进入 Apply；13 项任务尚未实施。批准方案及验证安排，不代表官方 CLI 业务调用、MCP、独立安装或实际交付已认证。未修改 Author、方案或实现后自行批准。

## 重点审核

| 重点 | 结论与落实位置 |
| --- | --- |
| 服务归属 | design §3 与 Preview service ownership 区分本次拥有、明确外部归属和未知服务。HTTP 200 / 相同 story ID / 历史 PID 不能赋予复用或停止权；外部服务复用不取得停止权，失去活跃身份时停止处置。tasks 3.2–3.3 有同 child 复用、自身停止读回、同 ID 异目标、端口冲突和外部服务仍存活的真实负例。工作方法保留直接事实，不新增服务注册 / 恢复平台。 |
| 根与 UI 检查 | design §5、tasks 2.1–2.2 只将独立 UI fixture 从根 TypeScript 扫描排除，根维护源码 / 脚本 / 测试仍真正检查；新 UI 场景用标准 Node API 调用目标 binary，避免将 UI 包重新引入根类型依赖。`test:ui` 承接目标依赖 / 浏览器检查及 fixture 严格 typecheck，包含 src、Storybook、Vitest 与浏览器脚本。无 UI 依赖的根检查、缺准备明确失败、故意类型错误拒绝均有验证安排，避免只排除文件而漏验。 |
| MCP 可选性 | design §4、Conditional MCP capabilities 与 task 4.2 明确目标启用、宿主连接和真实能力调用分别核对。未启用 / 未连接 / 未调用按事实标记，脚本 / CLI / 浏览器主路径继续；无须为通过本 Change 安装可选 MCP。fixture 中安装 Vitest plugin 且 addons 为空，不能据此宣称 MCP test-run；Storybook review 链接也不替代 MenDi verdict。 |
| 官方 CLI 与结果 | 本轮核对 004 保存的 tools / skills help 与目标实际 dispatcher：指定 dev / tools / skills 走本地 core，其余入口可能回退远程 CLI。design §2 限定已安装入口、不自动下载，以真实帮助确认语法；tasks 3.1–3.2 将帮助、实际业务调用、返回 URL 和浏览器观察分开，尚未验证的业务能力留在 Apply 实验。 |
| 方法选择与引用 | action-runs delta 完整保留被修改要求的两份原场景，并加入显式 Storybook、旧记录与缺失可选指导的兼容场景。复用单个 --tool / toolGuidance，未选择不读取；未知 / 重复 / 身份错误在占号前拒绝。没有给 Run / next 添加 UI 必填字段，也不把历史说明、方法缺失或 UI 环境变成普通查询的通用前置。 |
| 任务和适用范围 | 13 项按方法兼容、环境准备、CLI / 服务、有限测试 / MCP 与综合交接组织；任务包含各自正负例。无服务的 Vitest 路径、缺陷真实失败、修复新结果、旧结果保留和未知服务不误杀均有覆盖安排。只沿用 002 / 003 的 Windows / HTML-Vite 受控基线；Vue、冷安装和真实完整交付按 D03-B / C 另验，不由旧 PASS 推导。 |

独立核对官方 [MCP API](https://storybook.js.org/docs/ai/mcp/api)：toolsets 默认开启不等于条件已满足，docs 依赖框架 manifest，test 需要 addon-vitest 已安装并启用。方案保留实际发现 / 调用条件，与文档一致。[10.6 发布说明](https://storybook.js.org/releases/10.6) 确认 tools / skills CLI 与实验性 Vue 支持；不据发布说明宣称本目标能力已执行成功。

## 实施注意点（非阻断）

当前 `biome.json` 的 `!tests/fixtures/**` 排除了全部 fixtures。design §5 的“UI fixture 仍参与维护格式 / lint”是待实现安排；Apply 在任务 2 的检查职责中明确纳入该受控 UI 目标的维护 TypeScript，保留旧敏感夹具、lock、生成物和历史材料的排除。无需为此另建 revise-propose 或增加检查命令 / gate，Review Apply 核对实际范围即可。

本 Change 的根检查与 `test:ui` 用于验证这次接入；后续小改动仍按 AGENTS 判断影响，不把所有 UI 全流程或旧 proof 重跑固化成每次 Review 的手续。服务来源、版本和结果记在当前 Run，不另建证据表或全量 hash。

## 验证与限制

- 固定 OpenSpec 1.14.1 `validate storybook-lightweight-integration --strict --json`：exit 0，valid=true、issues=[]，见 [validate.json](artifacts/validate.json)。
- `instructions apply --change storybook-lightweight-integration --json`：exit 0，ready，0/13；返回的 proposal、两份 specs、design、tasks 均已读取，见 [apply-inputs.json](artifacts/apply-inputs.json)。工具状态只证明规划结构，不代替本次语义判断。
- 核对当前 methods / Run 指导允许值、CLI 参数、根 package / TypeScript / Biome、fixture tsconfig 和已安装 Storybook dispatcher。002 / 003 的真实 proof 与独立重放仍适用，本轮只审方案，没有重跑旧 UI 实验或把其扩展成新 CLI / MCP 验收。
- 未改产品 src、tests、scripts、Skills、package / lock、fixture、004 或更早 Run；不提前实现方案，不执行 Archive、Git 写入、根正式 Full Test / Close 或下一 Change。D03 保持 open / manual-bootstrap、累计归档数 7。

## 交接

下一步 Author `apply`，next 仅直接引用本 005；固定 Author 和规划产物从本 Run 定位。按已批准方案实施并记录真实结果，再交独立 Review Apply；不增新 gate，不要求补齐全部旧材料。

人工 manifest、README / context 短交接已同步，CLI [status](artifacts/status-final.json) / [next](artifacts/next-final.json) 读回 `apply / awaiting-author / author`，直接引用本 005；所改交接文件的 `git diff --check` 通过。
