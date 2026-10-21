---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: latest-run-supplement-and-limited-amend
planningSlot: MVP-D05-D
batchId: 002-changes
actionId: latest-run-supplement-and-limited-amend-explore-01
actionType: explore
role: author
actor: codex-author
run: "033"
status: completed
actionStatus: completed
outcome: complete
result: proof-supported
nextAction: review-explore
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/explore/SKILL.md
upstreamSkillRef: .agents/skills/openspec-explore/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/032-archive/run.md
---

# D05-D Author Explore：当前最新 Run supplement / limited amend

Owner 原始消息：Owner 授权激活 D05-D：当前最新 Run 的 supplement / amend，进入 Proof Explore。

范围根据根路线图 §7 D05-D 及 MenDi 当前真实 Run/历史决定：仅最新、当前轮且未被下游消费的 submitted Run；supplement 附加真实证据，amend 只更正有限非实质 Markdown；不得改前置信息、verdict、执行事实、原 Run 编号和下游批准。原始外部设计 mendi-run-amend-supplement-design.md 不在当前仓库根，探索以本项目路线图明确约束为准，不假称已读取原件。

已用固定 OpenSpec 1.14.1 原生命令新建 Change scaffold；MenDi 根为 manual-bootstrap，所以沿现有人工 Run 合同登记，此时仅做真实隔离 product-v2 Proof，不改变产品代码或旧 Run。

## 实际 Proof 与结果

依据根路线图 §7 MVP-D05-D（最新 submitted Run 的 supplement 与有限 amend）。外部原始参考 mendi-run-amend-supplement-design.md 不在当前仓库根，不能声称已核读其全文。此次仅创建 OpenSpec scaffold、当前 033 Run 和独立 product-v2 受控 Proof，**未实施新产品 CLI**。

[proof.ts](artifacts/proof.ts) 真正调用现有 Action APIs，并使用 tests/action-support.ts 可写隔离目标；OpenSpec readiness 为夹具内模拟，不能冒称真实 Reviewer 批准。实际 [proof-results.json](artifacts/proof-results.json) 共 **6/6 通过**，严格 TypeScript --noEmit 退出 0 见 [proof-typecheck.json](artifacts/proof-typecheck.json)。

| Proof | 已观察到的事实 | 新能力必须保留的规则 |
| --- | --- | --- |
| P01 | Author submitted/complete 后，未产生下游 Run 前仍为当前 latestRunRef，next 等待 Review | 当前最新 submitted 可能有可补证窗口，但等待 Review 不等于授权修改 |
| P02 | 同一最新 submitted Run 的普通 save/submit 均拒绝 run-already-submitted，原字节未变 | 新补证必须是独立受控入口，不能取消旧提交保护 |
| P03 | 越界 ../ 路径实际拒绝 unsafe-reference | 附件、差异、原文使用受管安全位置 |
| P04 | 一创建 Reviewer draft，currentRun 即指向它，旧 Author 不再当前，save 拒绝 run-not-current；下一号已是 003 | 下游 draft 就阻断原 Run，不能等审核正式提交 |
| P05 | actor 不同拒绝 action-role-mismatch；实际持锁被 write-in-progress-or-interrupted 阻断且保留实际现场 | 锁、角色和真实当前对象都是准入，不能自动清未知锁 |
| P06 | Reviewer approved 后，原 Author/Review 字节、verdict 和 authorRunRef 均未变；普通 save 拒绝已提交 | 新增证据不得倒灌为原审批前的事实或修改原 verdict |

第一次 Proof 的锁断言错误地预期 write-conflict，实际产品在读取时更早拒绝 write-in-progress-or-interrupted，导致该轮脚本 exit1。已按真实错误码修订并重跑成功；只对自己创建的失败夹具按 nonce marker、realpath、无锁和已保存成功 Proof 精确核对后清理，未处理其它临时目标。

独立执行现有 action 基线回归 node --test --test-concurrency=2 tests/actions.test.ts tests/action-write.test.ts，真实 **23/23 passed、0 failed/skip、exit0**，原始 [TAP](artifacts/baseline-regression.tap.log) 和 [结果](artifacts/baseline-regression.json) 均留存。覆盖既有提交不可重写、Reviewer 身份、占号、锁、部分写入、未知现场；这是底座基线，不证明 supplement/amend 已实现。

## 后续 Propose 的明确设计边界

1. **supplement** 仅针对本轮真实最新、submitted、仍未产生下游 draft/Run/Close 的对象，追加真实证明、来源、角色/actor、事后时间及原因。原则上采用附属受管收据/索引，不修改原 Run 正文、verdict、result、身份、Run 编号和 next，不因事后新材料改变早前已批准结论；若新证据与原批准相矛盾，须显式标记冲突并经 Owner/独立审核，不可静默追认。
2. **amend** 只限排版、错字、普通链接、非实质引用和明确标示的事后附注。必须保存原正文、修改后正文/精确差异、理由、修改者及实际时间。无论 frontmatter 是否变化，只要修改正文审核含义、测试覆盖、错误、授权或最终 verdict，应拒绝有限 amend，走正式修订与独立 Review。如何精确判断语义不变须在 Propose 定稿，不能交 Apply 猜测。
3. 核真实 product-v2/open、当前 Delivery/round/active Change/binding.latestRunRef、submitted、角色/actor、Run 号与后续占号/draft、合法受管路径、锁和并发状态；closed、历史 Run、旧轮、跨 Change、重复提交、未知中断均 fail-closed。只依据目录最大号或 next 文案不充分。
4. 写入时必须可诊断、可恢复和幂等，不创建新生命周期 Run/无意义 Action 或改变 archiveOrdinal；事后补证不可更改已经提交的 Reviewer 审核，Query 可展示来源但不自动批准正式测试。旧 Run 无新字段仍须可读，历史 Run/失败和真实 proof 原件保留。
5. Owner 本轮授权只覆盖 MenDi D05-D 研发，不等于可对 DreMo 035 等外部已批准历史执行补证。未来真实目标补证须当时仍为该 Delivery 最新未消费的 submitted Run，且具备相应独立授权。

## 停止边界

当前没有新的阻断性 Owner 业务问题；实现细节、冲突收据、正文语义保护及断点恢复须在 Propose 形成可审合同。**033 Author Explore 完成，下一步独立 review-explore**。本次不创建 Proposal/specs/design/tasks，不 Apply、Archive、Git、正式 Full Test/Close、发布、安装，也不改旧 Run/verdict 或 DreMo。
