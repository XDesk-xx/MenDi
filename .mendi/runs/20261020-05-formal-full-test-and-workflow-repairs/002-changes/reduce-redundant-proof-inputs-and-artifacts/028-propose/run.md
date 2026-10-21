---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: reduce-redundant-proof-inputs-and-artifacts
planningSlot: MVP-D05-C
batchId: 002-changes
actionId: reduce-redundant-proof-inputs-and-artifacts-propose-01
actionType: propose
role: author
actor: codex-author
run: "028"
status: completed
actionStatus: completed
outcome: complete
result: proposal-ready-for-independent-review
nextAction: review-propose
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-propose/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/027-review-explore/run.md
---

# D05-C Author Propose：轻量化 proof/inputs/artifacts

固定 026 Author Explore 及 027 独立 Reviewer approved；原 Reviewer Run/verdict、D05-A/B Archive 014/015 和 Git checkpoint 不改。MenDi 根仍为 manual-bootstrap；本次 Run 仅人工按原协议记录，不冒称安装版 CLI 写入根项目。

## 定稿与源证据

OpenSpec Change 根：openspec/changes/reduce-redundant-proof-inputs-and-artifacts。已正式编写 proposal.md、design.md、tasks.md、两份 delta：action-runs / test-execution。依据 026/027 的真实历史 D04-B 114 request/107 report、7 缺失均为 not-run/unknown/interrupted，以及隔离 0B stdout 文件缺失会令通过状态变 unknown/ENOENT。

首版明确定义**保留 stdout/stderr 两份物理文件，包括 0B**，不重做 TestExecution formatVersion=1 和 groups-v1 正式报告/资源清理/恢复合同。未来的单源证据辅助只用于当前明确 opt-in 的测试/Proof 场景采集，把同一真实原件的重复副本改为受管且可定位的引用；临时唯一原件在清理前实际保存一份，不凭“可重建”覆盖失败/unknown。旧 D01–D05-B 提交的历史不改、不清理。

14 项未开始任务分组覆盖辅助/输入判定、三处 opt-in 采集、Skills/README、旧双日志及正式组安全负例、跨进程读取、工程和独立交接；Apply 未开始。

## 真实结构验证与交接

固定 OpenSpec 1.14.1 strict validate 实际 exit0、1/1 valid、0 issues，全部四类 planning artifact status done，具体命令/摘要见 artifacts/openspec-validation.json。结果只证明规划有效，不是新代码验收。

Author 028 Propose 完成，交**独立 Reviewer review-propose**；不自行给 approved。不进入 Apply/Archive、Git Commit/Push、D05 正式 Full Test/Close、稳定安装或 D05-D 激活。
