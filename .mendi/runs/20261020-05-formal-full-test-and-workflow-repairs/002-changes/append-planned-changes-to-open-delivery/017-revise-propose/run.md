---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-revise-propose-01
actionType: revise-propose
role: author
actor: codex-author
run: "017"
status: completed
actionStatus: completed
outcome: complete
result: reviewer-f1-corrected-for-independent-review
nextAction: review-propose
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-update-change/SKILL.md
revisesRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/015-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/016-review-propose/run.md
---

# D05-B Author Revise Propose — 修订 016 唯一 Finding F1

固定 016 独立 Reviewer changes-requested 与 015 Author Propose；只修订 action-runs delta 中一个既有正式 Full Test 场景，不改 013–016 历史 Run/verdict，也不修改 D05-A Archive 014。

## F1 原因与实际修订

- 原场景将新正式执行登记为 015-delivery-full-test，和已交付 D05-A groups-v1 唯一新正式入口不一致。
- 保留原 MODIFIED Requirement 及 Scenario 标识，改为本次 groups-v1 全量新正式执行使用 015-delivery-test-attempt（015 仅示例，实际按 Delivery 共享编号分配），与 Changes 批次同级。
- 旧 delivery-full-test 只针对已提交 command Run 的只读历史兼容，不是新正式写入类型。
- 事实核对：src/application/delivery-full-test.ts 仅允许 groups-v1；src/application/group-attempt.ts 的 actionType 为 delivery-test-attempt；src/core/delivery-runs.ts 保留旧类型解析用于历史。

## 校验与计划影响

- OpenSpec 1.14.1 strict validate 真实 exit0、valid true、issues=[]，proposal/specs/design/tasks 状态均 done；命令与结果摘要见 artifacts/openspec-validation.json。
- 除上述 action-runs spec 一处场景外，Proposal、Design、其它三份 specs、15 项任务保持原样；没有增加 Owner 新决策或新的 Change。
- 审核后才能 Apply，本次没有改产品源码、运行真正 D05 Full Test、Archive、Close、Git commit/push 或稳定安装。

## 交接

Author 017 revise-propose 完成，交独立 Reviewer review-propose；不自签 approved。本 MenDi 根项目为 manual-bootstrap，阶段通过现有人工记录方式登记，不冒称 CLI 产品写入成功。
