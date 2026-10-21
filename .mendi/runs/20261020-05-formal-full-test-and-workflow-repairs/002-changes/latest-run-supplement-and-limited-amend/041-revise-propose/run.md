---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: latest-run-supplement-and-limited-amend
planningSlot: MVP-D05-D
batchId: 002-changes
actionId: latest-run-supplement-and-limited-amend-revise-propose-02
actionType: revise-propose
role: author
actor: codex-author
run: "041"
status: completed
actionStatus: completed
outcome: complete
result: reviewer-f4-amend-kind-discriminator-resolved
revisesRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/039-revise-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/040-review-propose/run.md
nextAction: review-propose
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-update-change/SKILL.md
---

# D05-D Author Revise Propose 041

038 的 F1/F2/F3 已经由 039 修订并由 040 Reviewer 核验成立。本次仅修订 040-review-propose 提出的 F4：相同正文无法自动区别排版更正与自由事后评论。039/040 和其它先前 submitted Run/verdict 保留。

## F4 — 显式双模式、互斥输入

新 amend 请求必须明确 --kind presentation-only|unreviewed-comment 和 requestId。前者只允许 --body 的完整候选正文并作可机械验证的空白差异；后者只允许 --comment 保存非权威、未审核自由文本。缺模式、未知模式、缺匹配内容和两份输入混用在写入前拒绝，不能根据文本、差异或 AI 推测用户意图。

同一组字句“审核已批准”替换原“审核未批准”，在 presentation-only 必须拒绝；在 unreviewed-comment 则只准隔离为 authoritative=false 的自由评论，原 Run 字节、verdict、正式摘要与 next 不变。相同 requestId 只有 kind 和原输入内容均相同才算幂等；更换 kind/内容或另一个 ID 仍拒绝。修改已落实 Proposal、Design、run-post-submission delta spec 和 Tasks；不扩展 Owner 授权范围。

## 实际校验与交接

F4 定向合同、F1–F3 既有承诺、16 个未开始 Tasks 交叉检查通过；OpenSpec 1.14.1 strict validate 1/1 valid、0 issues，四类规划产物 done。证据见 artifacts/revision-validation.json，收口脚本为 artifacts/finalize.ts，严格 TypeScript 类型检查亦通过。

本 041 Author Revise Propose 交独立 review-propose，不自签批准、不 Apply、Archive、Git、D05 Full Test/Close、安装或修改 DreMo。
