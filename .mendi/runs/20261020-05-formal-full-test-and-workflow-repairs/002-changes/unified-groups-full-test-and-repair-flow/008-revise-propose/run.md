---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-revise-propose-01
actionType: revise-propose
role: author
actor: codex-author
run: "008"
status: completed
actionStatus: completed
outcome: complete
result: revised-proposal-ready-for-independent-review
nextAction: review-propose
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-update-change/SKILL.md
revisesRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/006-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/007-review-propose/run.md
---

# D05-A Author Revise Propose

依 007-review-propose changes-requested 局部修订 006-propose 的正式方案。保留 006、007 原文与 verdict，不撤回 005 Explore approved；本 Run 不是产品实现或独立 Reviewer 批准。

## F1：旧 command 写入与历史读取

007 指出 delivery-verification delta 的 Full command actually passes or fails 场景仍像是允许保存新正式 command。已保留原 Scenario 名称并限定 WHEN 为查询已存在的旧 delivery-full-test / 必要子结果；THEN 仅解释历史真实 passed / failed，不启动新 command、不创建/改写 Run，也不将旧 PASS 用于新版 Close。新 command 正式输入须在占号前拒绝，旧已存结果仍可读。

## F2：新版 Close 唯一 typed 指针

明确选择 testAttemptRunRef，不使用旧 fullTestRunRef 的输入参数别名。新 Close 的该输入必须等于当前轮 manifest.testAttemptRunRef 和最新 manifest.deliveryRunRef，目标为 attempt.version=2 的完整 groups-v1 delivery-test-attempt，且本次正式结果、全部必需组、真实清理/读回、批准/基线和材料适用性均有效。

Close Run 自身保存 typed testAttemptRunRef 和相应 v2 acceptance 快照；rounds 的 typed 指针验证、closed 完整性及 readback 必须同步支持。不把 v2 attempt 塞进旧 manifest.fullTestRunRef。历史 fullTestRunRef / verificationRunRef 与已完成旧 Close 保持原合同只读，新 Close 拒绝旧 command passed、v1 verified、旧选择器、混用 selector、陈旧进展及 unknown。

## 文件与验证

仅修订既有 openspec/changes/unified-groups-full-test-and-repair-flow 中的 specs/delivery-verification/spec.md、specs/delivery-lifecycle/spec.md、design.md D5 和 tasks.md 3.2/3.3。Proposal、其他两份 delta 与 13 项任务数量均不变。

OpenSpec 1.14.1 validate unified-groups-full-test-and-repair-flow --strict --json 实际 exit 0、valid true、issues=[]；对历史只读、typed 选择器、轮次及对应测试任务作一致性检查。校验简要证据见 artifacts/openspec-validation.json。

这是 manual-bootstrap Author 修订记录，不声称产品 Action CLI 写入成功；未修改产品源码、真实 Full Test、DreMo、历史 Run、Close、Git 或发布。现交独立 Reviewer review-propose，不自签 approved 或进入 Apply。
