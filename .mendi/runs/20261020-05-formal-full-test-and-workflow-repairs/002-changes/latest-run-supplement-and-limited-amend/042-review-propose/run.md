---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: latest-run-supplement-and-limited-amend
planningSlot: MVP-D05-D
batchId: 002-changes
actionId: latest-run-supplement-and-limited-amend-review-propose-03
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "042"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: f4-amend-kind-and-f1-f3-resolved-proposal-approved
nextAction: apply
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/041-revise-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/041-revise-propose/run.md
---

# D05-D 独立 Review Propose：041 修订

**正式结论：approved（限规划，可以进入本 Change Apply）；没有剩余 Propose 阻断项。** 本轮固定 [041 Author revise-propose](../041-revise-propose/run.md)，由 [040 Review Propose changes-requested](../040-review-propose/run.md) 的 F4 驱动。保留 037/038 的原记录及 F1–F3 修复、034 的技术 approved、035 当时授权拒绝和 [036 新 Owner 授权 approved](../036-review-explore/run.md)，不改其原字节和 verdict。仅批准 MenDi D05-D 研发，绝不授权对 DreMo 035 或其他项目进行实际补证。

## F4 的独立方案核验

**原阻断 F4 已解除**：不再由同一 `--body` Markdown 输入猜测“正文更正还是自由评论”，现行 Proposal/Design/新 delta spec/Tasks 中均为调用者指定的严格双模式：

- `run amend --request-id <id> --kind presentation-only --body <file>`：唯一输入是旧正文的完整候选；仅机械可验证的普通段落安全空白差异可形成**展示更正版**，非空白字符/证明事实或审核含义变化直接拒绝。
- `run amend --request-id <id> --kind unreviewed-comment --comment <file>`：唯一输入是自由评论；旁路保存 typed `kind=unreviewed-comment, authoritative=false`，在查询中始终标明“事后未审核”。文字即使称“重新 approved”或“旧失败已通过”，仍不能更新正文、Review 判决、机器 PASS、正式摘要、证明来源、next。
- 缺/未知 `kind`、缺模式专有输入、`--body` 与 `--comment` 同时出现，以及输入与模式不匹配，必须**在任何 aftercare 写入前拒绝**，不能根据文本、差异或 AI 自动改选分支。
- **同一输入字节、不同 kind 的负例合同明确**：旧正文“审核未批准”，送入“审核已批准”时，`presentation-only` 认定实质替换并拒绝，`unreviewed-comment` 仅隔离非权威评论而不变更原 Run/正式 Query。
- 唯一 `aftercare/amend` 槽位的幂等输入身份包含 `requestId`、`kind` 和直接内容；同 ID、同模式、同内容回读已确认结果；同 ID 改模式/内容、另一个不同 ID 或 pending 时错误切换请求，一律拒绝。首版每 Run 最多一个 confirmed amend，不覆盖已提交旧 Run。

上述规则具体见 `proposal.md:10`、`design.md:33–43,45–55`、`specs/run-post-submission/spec.md:43–68`、`tasks.md:5,17–19,23`。不把项目中的静态英文案例当成已经实现的新 CLI 负例。

## 已经修复的 F1–F3 未回退

- **F1 时间来源**：仅系统生成的本次 `recordedAt` 是后续保存时间；可空 `sourceClaimedCollectedAt` 标 `unverified`，绝不假定旧 Change/Delivery Run 具备可信 submittedAt/approvedAt 或根据 mtime/自述认证批准前后的真实采集时刻。无证据的 `verified` 断言拒绝；无需改旧 Run 或历史时间数据库。见 `design.md:25–29,68`、新 Spec 第 28–41 行、Tasks 2.1/2.2。
- **F2 明确请求及单次上限**：supplement JSON 和 amend CLI 各有 requestId；`amend` 单 Run 至多一次 confirmed，重试需相同 ID/kind/直接输入，否则拒绝；写失败保留现场且显式 resume，只接受同请求，未确认不当作 PASS。见 `design.md:35,45–55`、新 Spec 第 66–79 行和 Tasks 3.3/4.1/4.2。
- **F3 自由评论不认证事实**：`unreviewed-comment` 始终 `authoritative=false`，与原审批正文/结果/证明摘要物理和查询语义隔离。不能通过新评论获取或改变已批准 verdict/Full Test PASS。见 `specs/run-post-submission/spec.md:50–56,81–90`、`specs/delivery-workspace/spec.md:81–87` 和 Tasks 3.1/3.2/4.3。

同时保留 Change 活动 binding.latestRunRef 与无活动 Change 的 Delivery deliveryRunRef 两条当前权威指针、currentRoundId/共享占号/下游 draft 退出边界；只允许合理的非正式 Delivery Repair/Review 受控对象，禁止改历史 Archive/Close/Full Test。系统 Run `run.md` 原始字节、原 Owner 批准历史与交接指针均不由 aftercare 原地覆盖。使用原 write.lock、显式受管路径、intent/必要原件/最终 confirmed、只读查询及未知失败保留，未引入全库 hash 链/自动审核。

## Reviewer 独立核对与可追溯材料

Reviewer 新建 [reviewer-proof.ts](artifacts/reviewer-proof.ts)，只读固定 041、040、039、036/035，现行 Proposal/Design/3 份 delta Specs/16 项未开始 Tasks 及必要 product 类型/规则，执行 **9 组当前合同交叉核对**和 **9 项明确输入/响应合同矩阵**；每组记录实际文件、行号和原句，机器证据见 [reviewer-results.json](artifacts/reviewer-results.json)。本轮的 9 项是**规格覆盖与语义判断**，并非新产品的可运行测试；新补证 CLI 尚未在本 Change Apply 实现，不能用本批准冒充执行验收。

独立实际运行 OpenSpec 1.14.1 `validate latest-run-supplement-and-limited-amend --strict --json`：**1/1 valid，0 issues，exit0**。原始命令及 stdout/stderr 唯一一份在 [openspec-validation.json](artifacts/openspec-validation.json)。再次调用 `status --change ... --json` 验证 Proposal/Specs/Design/Tasks **4/4 done，planningComplete=true**，但 Tasks 本身 **16 项全部待 Apply**。Reviewer 自有 TypeScript proof 和 Author 041 的 TS 收口脚本分别按严格 TS 类型检查，均 **exit0，零诊断**，真实命令与输出在 [extra-validation.json](artifacts/extra-validation.json)；原 [tsconfig.json](artifacts/tsconfig.json) 可重放 Reviewer 检查；`git diff --check` 通过。

## Apply 后续真实验收重点与停止边界

Apply 应在**隔离 product-v2** 中运行真正 CLI 的两模式正反例、缺/未知 kind、两输入同时存在、同 ID 换 kind/内容、第二 ID、正常排版更正、原 Run/verdict/next 的跨进程字节/语义一致性。还需真实执行 Change Author/Reviewer 与 Delivery Repair/Review 两条当前指针，后续 draft、错误角色、Closed/archived/legacy/manual、受管文件越界/symlink、源变化、锁/intent/confirmed 各断点及显式恢复，确保半提交不冒充已确认。第三方目标 DreMo 不在本次测试写入范围。

**交接：`apply / author / awaiting-instruction`。** 本 Reviewer 仅新增当次审核 Run/自有 artifacts 并更新 D05 manual-bootstrap manifest；不修改 041 Author 的 Proposal/Design/Specs/Tasks、旧 Run/verdict 或 MenDi 产品源码。不执行 Apply、Archive、根 D05 正式 Full Test/Close、Git checkpoint/push、稳定安装或 DreMo 写入。
