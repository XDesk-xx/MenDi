---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: action-runs-and-role-handoff
planningSlot: MVP-D01-B
actionId: action-runs-and-role-handoff-propose-01
actionType: propose
role: author
run: "018"
status: completed
result: proposal-ready-for-review
date: 2026-10-09
stageSkillRef: .agents/skills/openspec-propose/SKILL.md
exploreReviewRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/action-runs-and-role-handoff/017-review-explore/run.md
nextAction: review-propose
nextRole: reviewer
---

# MVP-D01-B Propose

Owner 原始 Change 授权为激活下一 Change、Explore 与核心 proof，后续短指令 `propose` 触发当前范围内方案工作。[017-review-explore](../017-review-explore/run.md) 已独立批准 016，满足进入方案的边界。本会话保持 Author。

## 当前方案产物

- [proposal.md](../../../../../../openspec/changes/action-runs-and-role-handoff/proposal.md)：说明 Action / Run 产品记录、方法选择和最小交接范围；新增 action-runs，修改 delivery-workspace。
- [design.md](../../../../../../openspec/changes/action-runs-and-role-handoff/design.md)：明确四类命令、单当前 Run 指针、固定 Review 对象、方法落点、操作输入和失败现场。
- [action-runs delta](../../../../../../openspec/changes/action-runs-and-role-handoff/specs/action-runs/spec.md)：Action 身份 / 角色、方法、连续号、draft / submit、继续 / 修订、Review 与写入诊断合同。
- [delivery-workspace delta](../../../../../../openspec/changes/action-runs-and-role-handoff/specs/delivery-workspace/spec.md)：保留既有全部相关场景，增加当前产品 Run 查询和必要输入；顺带区分归档后的无活动显示。
- [tasks.md](../../../../../../openspec/changes/action-runs-and-role-handoff/tasks.md)：14 项待实施 / 验证任务，按依赖分组；各组附本组的测试 / 文档，生命周期后续单列而不提前勾选。

按固定 OpenSpec 1.14.1 的 context、status 与逐项 instructions 编写，依赖顺序为 proposal → specs / design → tasks；没有重复创建 Change，也没有跳过任何所需规划产物。两份 delta 对应 proposal 的实际能力路径，主规格不在本轮同步。

## 017 指出的边界如何落实

1. **当前输入与 draft / submit：** product binding.latestRunRef 直接定位当前 Run，状态只解析当前头部，不读取全部历史；draft 正文允许保存，submitted 不允许再改。只有 start / continue 需要更新 Run 和 manifest，save / submit 在固定当前路径替换 draft。修改后失败保留锁与现场，读回后才成功；不是跨文件事务或自动恢复。
2. **Reviewer 继续：** 首次 Review 固定当前完成 Author，后续 Reviewer 继续保持同 actionId 与 authorRunRef，实际校验固定输入而不要求它等于最新 Reviewer Run；三类 verdict 各自形成最小 next。actor 标签只拒绝明显同标签自签，不能认证真实身份，会话独立性仍由 Owner / 实际角色保证。
3. **方法与兼容：** 六个产品阶段方法、修订复用相应 Author 方法、OpenSpec 指导按明确请求加载；开始 / 继续返回实际内容但不声称 Agent 工作已执行。manual-bootstrap 仍只读，当前 B 自身继续人工记录，不强迁移或自动激活第二 Change。

修订建立新 Action / Run，旧 verdict 保留；同阶段继续保持同 Action。本轮提供记录规则和方法基础，不抢先实现 D01-C / D01-D 的完整语义工作、任意回退、原生 Archive Action 或正式 Delivery 收口。

## 验证与沿用

`openspec validate action-runs-and-role-handoff --strict --json` 已返回 valid:true、issues:[]；固定 status 的 proposal、specs、design、tasks 均 done，isPlanningComplete:true。上游这些状态仅证明规划结构齐备，不能代替独立 Review Propose 或表示实现完成。

016 / 017 已批准且仍适用的 8/8 proof、工程 check 与查询记录回归沿用，不因 Markdown 方案编写重新跑全部行为测试。本轮没有修改实现、测试、proof 脚本、依赖或产品 Skills，没有新的实现测试结果可以宣称。

编号依据见 `artifacts/allocation.json`：实际 001–017 已占号，本次新建 018-propose，复用 003-changes。017 及此前正式 Run、编号和 verdict 保持原样；没有为每项检查另建 Run。

最终原始命令与读回保存在 `artifacts/commands.json`、`validation.json`、`planning-status.json`、`workspace-status.json`、`workspace-next.json` 和 `handoff-readback.json`。两份 delta 合计 12 个 requirement / 33 个 scenario，修改的既有 requirement 保留全部原场景；14 项任务均未勾选。当前查询成功，next 为 review-propose / reviewer / executable:false，累计完成 Change 仍为 1。

## 交接

当前 Author 方案可交独立 Reviewer，重点审核字段 / 指针与既有 product v1 的兼容、修改后失败保留锁是否覆盖实际中断点、Reviewer 多 Run 固定对象、方法接线与语义工作的区别，以及最小规则表的修订 / rejected 边界。不存在仍需 Owner 决定才可实施的未定合同；独立 Reviewer 可要求局部方案修订。

当前交接指向本 018 Author Run，next 为 review-propose / reviewer；未生成 Reviewer verdict，不自动进入 Apply。未执行 Git、Archive、正式 Delivery Full Test / Close / Reopen 或下一 Change 激活。
