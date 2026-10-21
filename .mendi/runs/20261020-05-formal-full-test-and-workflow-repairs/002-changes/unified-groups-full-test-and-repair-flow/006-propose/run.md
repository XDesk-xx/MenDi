---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-propose-01
actionType: propose
role: author
actor: codex-author
run: "006"
status: completed
actionStatus: completed
outcome: complete
result: proposal-ready-for-independent-review
nextAction: review-propose
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-propose/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/005-review-explore/run.md
---

# D05-A Author Propose：新 groups-v1 正式整次验收与修复交接

上一步独立 Reviewer 005 已针对 004 修订给出 approved；003 的 changes-requested 与 002/004 proof 均为不可覆盖的真实历史。本次只形成 OpenSpec 方案，未执行 Apply。

## 正式规划材料

- [proposal](../../../../../../openspec/changes/unified-groups-full-test-and-repair-flow/proposal.md)：统一未来 groups-v1 正式完整执行，直接生成本次 passed，取消新多来源 verification。
- [design](../../../../../../openspec/changes/unified-groups-full-test-and-repair-flow/design.md)：版本辨识的组正式 Run、逐组报告与清理核对、Repair/Review / 环境例外、旧 command 经审核修复后首次新组准入、status/next/Close 当前权威结果。
- [tasks](../../../../../../openspec/changes/unified-groups-full-test-and-repair-flow/tasks.md)：4 个工作组、13 项可追踪任务；每组同步相关测试与文档，应用阶段才可逐项勾选。
- specs delta：delivery-verification、test-execution、delivery-lifecycle、action-runs；改当前可写行为，保留旧 command、group attempt、verification、Close、Run/verdict 只读。

## Explore 直接证据与决定

- 002/004 隔离 proof 的 P01 证明普通失败继续独立项、P02 证明安全环境阻断可恢复全量运行、P03 证明旧 command failed 经受控审核后的首次组准入缺口、P04 证明旧部分 retest 多来源 verified 与新政策冲突；003/005 独立 Review 的 005 为 approved。
- Owner 已明确：新正式全量 groups-v1 的全部必需组、报告与清理稳定且 Run 读回确认时，由本次 Full Test Run 直接 passed；无需新的 delivery verification 或例行 Owner 决策。正式 Close 仍要独立授权。
- 实质代码/断言/执行配置修复保留 delivery-repair → 独立 review-delivery-repair；纯可核实环境准备问题不新增空 Repair/Review Runs，安全后完整重跑；unknown 停现场判断。

## 准入和验证

OpenSpec 1.14.1 的 proposal/specs/design/tasks 均为 done；严格 validate --strict exit0，无问题。校验回执在 [artifacts/openspec-validation.json](artifacts/openspec-validation.json)。
项目当前 manual-bootstrap，只记录真实人工 Author Propose，不冒充产品 Action CLI 提交；没有运行根正式 Full Test、修改 src/tests/skills 或 DreMo、归档、Git 提交与发布。

## 交接

此 Author Propose 已完成，交独立 Reviewer 执行 review-propose，不自签批准、不自动进入 Apply。
