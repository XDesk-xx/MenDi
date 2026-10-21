---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: latest-run-supplement-and-limited-amend
planningSlot: MVP-D05-D
batchId: 002-changes
actionId: latest-run-supplement-and-limited-amend-revise-propose-01
actionType: revise-propose
role: author
actor: codex-author
run: "039"
status: completed
actionStatus: completed
outcome: complete
result: reviewer-findings-f1-f2-f3-revised
revisesRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/037-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/038-review-propose/run.md
nextAction: review-propose
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-update-change/SKILL.md
---

# D05-D Author Revise Propose — 039

根据 038 独立 Reviewer changes-requested 定向修订 037 的 OpenSpec 规划。旧 037/038 与此前 033–036 的 Run/verdict 均不改写。

## F1 · 时间真实性
系统记录本次后处理 recordedAt；来源自述 sourceClaimedCollectedAt 可空且固定 unverified。旧批准时间无可信锚点，不依据自述或 mtime 声称早/晚于旧批准；要求 verified 的无依据时间声明拒绝。

## F2 · amend 身份
amend 命令需 requestId；每个 Run 首版仅一次确认。相同 ID 同输入幂等，同 ID 改输入、第二不同 ID 均拒绝，pending 由同请求显式恢复。

## F3 · 自由评论隔离
自由文字只作 unreviewed-comment/authoritative=false；即使文本声称重新 approved 或旧失败已通过，也不进入审核正文、证明、正式摘要、PASS、verdict 或 next，不靠 AI/关键词证明语义安全。

## 验证与交接
OpenSpec 1.14.1 strict validate 真实 exit0、1/1 valid、0 issues，四类规划产物 done，16 Tasks 尚未启动。真实 crosswalk 和校验摘要在 artifacts/revision-validation.json。

039 Author revise-propose 完成，交独立 review-propose。不进入 Apply、Archive、Git、D05 Full Test/Close，也不修改 DreMo。
