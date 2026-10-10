---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: storybook-lightweight-integration
planningSlot: MVP-D03-A
batchId: 002-changes
actionId: storybook-lightweight-integration-propose-01
actionType: propose
role: author
run: "004"
status: completed
result: planning-ready-for-review
date: 2026-10-10
stageSkillRef: .agents/skills/openspec-propose/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/storybook-lightweight-integration/003-review-explore/run.md
nextAction: review-propose
nextRole: reviewer
---

# MVP-D03-A Author Propose

Owner 指令：“propose，按更新后的路线图收敛 MVP-D03-A，明确官方 CLI 入口、服务归属、执行环境和 MCP 条件。”保持 Author，承接 [003 独立 Review Explore](../003-review-explore/run.md) 已批准的 002 与更新后的路线图 §6.2 / MVP-D03-A，完成规划后停在独立 Review Propose；本 Run 没有 Reviewer verdict。

## 已完成产物

- [proposal](../../../../../../openspec/changes/storybook-lightweight-integration/proposal.md)、[design](../../../../../../openspec/changes/storybook-lightweight-integration/design.md)：目标锁定 CLI、预览 / 有限测试分工、服务归属、执行环境、按需指导与条件 MCP。
- 两份 delta：[storybook-integration](../../../../../../openspec/changes/storybook-lightweight-integration/specs/storybook-integration/spec.md) 为新能力，[action-runs](../../../../../../openspec/changes/storybook-lightweight-integration/specs/action-runs/spec.md) 完整保留原要求的两份场景并补可选 Storybook 选择 / 兼容；主规格未同步。
- [tasks](../../../../../../openspec/changes/storybook-lightweight-integration/tasks.md)：13 项全部未勾，各组包含自身测试 / 方法文档，最后只综合验证与 Author 交接；B / C、实际 Archive 和正式 Delivery 验收保持后续边界。

按项目 [Propose 方法](../../../../../../skills/actions/propose/SKILL.md) 与已安装 OpenSpec Propose Skill，读取固定 1.14.1 context / list / status、能力库存、相关完整规格及各 artifact instructions / 已完成依赖，按实际输出路径形成材料。当前记录仍为 manual-bootstrap，使用既有人工 Run / manifest，不迁移产品记录。

## 收敛决策与真实依据

1. **CLI / 分工**：目标项目拥有 Storybook 10.6.1 及 scripts。预览用项目 `storybook dev`，有限测试用 `vitest run --project storybook`；官方 `storybook tools` / `storybook skills` 补充发现、预览与方法入口。本轮读取安装包 dispatcher，并直接运行本地 binary 的两项帮助（exit 0）；证据见 [tools help](artifacts/storybook-tools-help.log)、[skills help](artifacts/storybook-skills-help.log)。没有启动服务 / 执行业务 tools，帮助列出的能力不算成功调用；Apply 的任务 3 负责实际认证。
2. **服务归属**：本次拥有的活跃 child 可复用和停止；既有服务需核对目标、配置、启动来源与访问位置，仅复用不取得停止权。未知 HTTP / story ID / 端口不证明归属，不自动处置，不建立服务注册表或凭历史 PID 恢复停止。
3. **执行环境 / 准备**：仅沿用 Windows x64 / Node 22.23.2 / pnpm 11.22.0 / HTML-Vite 锁定组合的受审事实；目标自身配置、依赖和浏览器明确准备。计划只将独立 UI fixture 从根 TypeScript 扫描排除，保留它自己的严格 typecheck，显式 `test:ui` 必须先检查目标类型和准备状态；根检查继续覆盖维护源码 / 测试 / 脚本。没有在本轮实施排除或新增脚本，当前本机检查仍是已准备 UI 依赖的环境。
4. **MCP**：目标按需启用官方 addon，宿主连接；dev feature、docs manifest、测试 addon 启用与真实工具发现 / 调用分别核对。当前 fixture `addons: []`、无 MCP，不能由已安装 Vitest plugin 推导 MCP test-run；CLI / 脚本 / 浏览器主路径无需 MCP。未连接能力标记未认证，Storybook review URL 不给 MenDi verdict。

原始 [002 proof](../002-explore/run.md) 与 [003 独立重放](../003-review-explore/run.md) 仍适用于未变化基线：真实两份交互 story、错误失败 / 修复新结果、已知 child 复用 / 停止、无 UI Open / 查询，以及当时 check / build。未重跑全部旧实验，不将其解释为任意服务、Vue、MCP、独立安装或真实全流程验收。新 Apply 测试按场景组织，不扩写旧长 proof，不新增 hash / 递归 Ref gate。

## 验证与限制

- [validation.json](artifacts/validation.json)：固定 OpenSpec `validate storybook-lightweight-integration --strict --json` exit 0，valid=true、issues=[]。
- [openspec-status.json](artifacts/openspec-status.json)：四类规划产物 done；[只读 apply inputs](artifacts/apply-inputs.json) 为 ready、0/13。上游 isComplete / readiness 只表示规划齐备，未实施也未批准。
- [specs instructions](artifacts/specs-instructions.json)、[design instructions](artifacts/design-instructions.json)、[tasks instructions](artifacts/tasks-instructions.json) 保存各一份实际原始返回；没有复制历史 Run 树或旧原始日志。两项 CLI 帮助只确认本次版本入口和语法，业务工具与 MCP 仍按任务补实际验证。
- 本轮只写规划与当前交接，未改产品 src / tests / scripts / Skills、根 package / lock 或受控 UI fixture；因此沿用 003 的既有工程结果，不以文档编辑重跑实现回归。[artifact-assessment.json](artifacts/artifact-assessment.json) 核对本地文档链接、0/13 任务和交接文件 diff 检查；CLI status / next 实际读回见 [handoff-readback.json](artifacts/handoff-readback.json)。

## 独立 Review Propose 交接

Author 结果 planning-ready-for-review；下一步 `review-propose / awaiting-review / reviewer`，当前输入只指向本 004。Reviewer 重点核对：四项边界是否落实于规格 / design / tasks，根与 UI 类型检查是否无漏项，未知 / 外部服务是否安全且没有虚构通用识别，CLI 帮助与业务调用是否区分，条件 MCP / HTML 与 D03-B / C 的真实支持范围是否准确。

保留 003 及以前 Run、编号和 verdict，D03 保持 open / manual-bootstrap，累计归档数 7。没有执行 Apply、Archive、Git 写入、正式 Full Test / Close、下一 Change 激活或 `.tmp` 清理。
