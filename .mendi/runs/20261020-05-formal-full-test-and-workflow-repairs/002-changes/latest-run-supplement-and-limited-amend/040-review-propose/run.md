---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: latest-run-supplement-and-limited-amend
planningSlot: MVP-D05-D
batchId: 002-changes
actionId: latest-run-supplement-and-limited-amend-review-propose-02
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "040"
status: completed
actionStatus: completed
outcome: complete
verdict: changes-requested
result: amend-comment-mode-discriminator-required
nextAction: revise-propose
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/039-revise-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/039-revise-propose/run.md
---

# D05-D 独立 Review Propose：039 修订

**最终 verdict：changes-requested。** 固定 [039 Author revise-propose](../039-revise-propose/run.md)，直接复核 [038 独立 Review Propose](../038-review-propose/run.md) 的 F1/F2/F3，保留既有 033–038 的完整 Run/verdict。当前 [036 Owner 授权 approved](../036-review-explore/run.md) 中精确小写 `owner 授权` 只针对 MenDi D05-D 研发，并明确不授权真实 DreMo；035 原 rejected 作为当时原消息的历史结论仍成立。本 Reviewer 没有修改 Author 的 Proposal/Design/Specs/Tasks、产品源码、任何旧 Run 或授权文书，也没有启动 Apply。

## 原有三项 Findings：方案文字已解决

- **038 F1 已解决（时间真实性）：** `proposal.md:9,13`、`design.md:25–29,68`、`specs/run-post-submission/spec.md:28–41`、`tasks.md:11–12,25` 一致区分系统实际 `recordedAt` 与可空且永远标为 `unverified` 的 `sourceClaimedCollectedAt`。旧 Change/Delivery Run 不存在可信 `approvedAt/submittedAt`，不得以用户声明、mtime 或新操作时间认证历史批准前后的取证时间；假称 verified 的输入须拒绝。无迁移历史时间账本、无伪造批准先后。
- **038 F2 已解决（amend 幂等）：** `proposal.md:10`、`design.md:33–35,45–53`、`specs/run-post-submission/spec.md:43–44,58–60`、`tasks.md:5,19,23` 明确 CLI 需 `--request-id`，单 Run 首版最多一个 confirmed amend；同 ID 同输入只读回，改输入或第二不同 ID 均拒绝，pending 由本请求显式恢复。没有让 Apply 选择覆盖还是排序。
- **038 F3 已解决其核心可信展示原则：** `design.md:38–43`、`specs/run-post-submission/spec.md:50–52,73–82`、`specs/delivery-workspace/spec.md:81–87`、`tasks.md:17–19,25` 对任意自由评论使用 `kind=unreviewed-comment/authoritative=false`，隔离于被审核正文、Proof、机器正式摘要、PASS、verdict、next；即使文字虚称重新 approved 或旧失败通过也不能使官方结果变化。**但 CLI 如何选择“评论”或“正文更正”仍有一个新可执行性缺口 F4。**

保留 037/038 已成立的方案部分：Change 活动 binding 与 Delivery `deliveryRunRef` 的真实当前指针及全轮共享 Run 占号、下游 draft 阻断；合法 Delivery Repair/Review 的有限类型；原 submitted `run.md` 字节不变，aftercare 作为旁路 confirmed 事实；锁/intent/原件/confirmed 的有界恢复；无 Reviewer 自动批准和正式 Full Test/Close 旁路。16 项 Tasks 尚未执行，新 CLI 未实现，批准或拒绝都是规划审核，不宣称 runtime 漏洞。

## 新 Finding F4 · MEDIUM · 同一 amend 输入无法确定“更正”还是“自由评论”

- **直接冲突：** `design.md:35` 规定唯一命令 `run amend --project --run --role --actor --request-id <id> --body <markdown> --reason <text>`；没有显式 `kind`/评论输入或精确定义的正文标记语法。与此同时，`design.md:37–39`、`specs/run-post-submission/spec.md:46–56` 和 `tasks.md:17–18` 要求**拒绝任何不能机械证明为纯排版的正文替换**，却又要**允许自由文字作为未审核评论保存**。
- **歧义负例（纯方案输入碰撞，不是已执行的新 CLI）：** 假设旧正文为“审核未批准”，`--body` 所给文件为“审核已批准”。如果这是正文替换，就必须拒绝；如果这是事后评论，就允许保存但必须是非权威隔离对象。对外请求字段却完全相同，当前 Specs 并未定义如何辨识调用者的意图。实现者不得在 Apply 猜正文差异、词语或 AI 语义来确定分支。
- **要求的局部修订：** 在设计/正式 Specs/Tasks 中明示**机器可观察且用户可选择的输入模式**，例如 `--kind presentation-only|unreviewed-comment` 或互斥的 `--body` 与 `--comment`，由 Author 在既有 D05-D 范围内定稿即可，不强求具体命名。`presentation-only` 输入是完整旧正文候选，仅机械安全空白差异可确认，否则拒绝；`unreviewed-comment` 输入仅存旁路非权威评论、不能作为替换后的原正文、不能进入正式 status/next/verdict/审查证据。若缺模式、模式与输入冲突，应拒绝。
- **必须增加的 Apply 场景：** 同样的文本通过 `presentation-only` 分支应因实质替换拒绝，通过 `unreviewed-comment` 分支可保存但必须始终隔离且不改变原审核；模式缺失、冲突组合、安全排版正例，以及同 requestId 改变模式或内容、第二不同 requestId 的幂等/单次上限负例。查询与跨进程读回都需保持原 Run 原字节/verdict/next。
- **严重性范围：** F4 是面向用户的 CLI/Spec 合同未定义且两项 REQUIRED 场景会产生歧义，必须在实施前收敛；它不是当前 product-v2 的现存漏洞，也不推翻 F1/F2 或 F3 的非权威隔离方向。无需重做 033/034 proof、新建 Change、恢复 035 rejected 或再申请 Owner 授权。

## 独立材料与限制

Reviewer 新建 [reviewer-proof.ts](artifacts/reviewer-proof.ts) 读取**当前** 039、038、036 和正式 Proposal/Design/3 份 Specs/Tasks，交叉验证 F1–F3 及原合同，并以一份完全相同的 amend 参数展示 F4 的两种不等价处理要求。机器 crosswalk 与原文件/行号及正负例输入在 [reviewer-results.json](artifacts/reviewer-results.json)。此项是独立的**规划语义核验**，不是尚不存在的新产品 amend 运行测试。

独立实际执行固定 OpenSpec 1.14.1 `validate latest-run-supplement-and-limited-amend --strict --json`：**exit 0、1/1 valid、0 issues**；真实命令与全部 stdout/stderr 在 [openspec-validation.json](artifacts/openspec-validation.json)。Reviewer 自有 TypeScript proof 的严格 `tsc -p` **exit0、零诊断**，原始凭据见 [typecheck-results.json](artifacts/typecheck-results.json) 及 [tsconfig.json](artifacts/tsconfig.json)。OpenSpec 结构通过并不消除 CLI 语义歧义，任务未实施也不构成产品失败证据。

本轮只新增独立 `040-review-propose` Run/artifacts 与人工 D05 manifest 当前交接；不重复复制 038、034 的旧 proof、无新正式 Full Test、无测试目标外数据写入。未执行 Apply、Archive、根 D05 Full Test/Close、Git 提交、安装或 DreMo 操作。

**下一步：`revise-propose / author / changes-requested`。** 只需在当前 D05-D 规划内修补 F4 并重新交独立 `review-propose`，其他已正确承诺保留。
