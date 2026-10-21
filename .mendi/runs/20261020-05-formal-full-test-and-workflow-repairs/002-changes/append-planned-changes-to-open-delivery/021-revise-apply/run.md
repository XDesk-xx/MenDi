---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-revise-apply-01
actionType: revise-apply
role: author
actor: codex-author
run: "021"
status: completed
actionStatus: completed
outcome: complete
result: reviewer-f1-f2-repaired
nextAction: review-apply
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/apply/SKILL.md
upstreamSkillRef: .agents/skills/openspec-apply-change/SKILL.md
revisesRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/019-apply/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/020-review-apply/run.md
---

# D05-B Author Revise Apply

固定独立 Reviewer 020 changes-requested 的 F1 intent 递归嵌入和 F2 历史 scope Run 编号顺序两项。原 019 Apply / 020 Review / 证据及 verdict 保持不变。

## F1：停止历史 intent 的递归复制

020 独立 Reviewer 的真实七次连续追加中，旧 writer 的 intent 从 4,087B 增长到 1,230,931B；本次仅修复该局部责任，不交给 D05-C。

`src/adapters/change-add-store.ts` 仍在锁内核对旧收据和 intent 原字节，但新 intent 不再把它们的完整 Base64 放入下一份。仅对当前轮实际已有 `scopeAdditions` 中的历史受管 Run/intent 保存 `directDigests`（路径 + SHA-256）；其它直接输入继续保留原行为。恢复时比对全部对应真实文件；`src/adapters/scope-additions.ts` 逐项检查历史已提交摘要链，旧格式无此字段的记录继续兼容，不建立全库证据表。

新增 `tests/change-add-review-repair.test.ts` 在同一个隔离 product-v2 目标真实追加 C–I 七次，逐次读取 submitted 收据、范围/轮次及摘要，实测新 intent 字节为 **4,075 / 6,323 / 8,732 / 11,519 / 14,684 / 18,227 / 22,148**；新 intent 没有旧 intent 的嵌套原文。篡改第二次 intent 后第八次追加被拒绝，还原后原范围仍可读取。大小只是有界实测，不是文件大小或追加次数的硬门槛。

## F2：原始范围归属具有真实 Run 编号时序

`src/core/round-records.ts` 在原 scope/roundId 一致性校验之外，基于实际 `scopeAdditions[].runRef` 的 Delivery 序号构造互斥的生效区间：每个旧 scope 只接受上次追加完成后、下次追加收据之前生成的 Run。追加收据编号不能被冒充为前后任一历史测试。对没有追加字段的旧轮保持原读取合同，不修改旧 Run/verdict 或降低新正式验收/Close 的当前完整范围准入。

`tests/change-add.test.ts` 和 `tests/rounds.test.ts` 补入“首追加前旧 Run 可读、追加后 Run 伪称旧 scope 被拒绝”的正反例；七次真实追加再次核对第一段与最后段的合法归属及非时序历史拒绝。

## 实际验证与限制

- [engineering-results.json](artifacts/engineering-results.json)、[check.log](artifacts/check.log)、[build.log](artifacts/build.log)：`pnpm check`、`pnpm build` 均实际 exit 0，格式、lint、src/scripts/tests TypeScript 通过。
- [affected-tests.tap.log](artifacts/affected-tests.tap.log) 与 [affected-tests-result.json](artifacts/affected-tests-result.json)：同时运行 11 个测试文件，实际完成 **21 项 pass、未观察到 fail**，随后因外层 `spawnSync` 执行时限而 `SIGTERM/ETIMEDOUT`，**不是一次完成的全部通过**。原始日志保留，不伪改成功。
- [remaining-tests-result.json](artifacts/remaining-tests-result.json) / [remaining-tests.tap.log](artifacts/remaining-tests.tap.log)：将未完成的五个历史/轮次/Close/Reopen/迁移文件拆分复验，**16/16 pass、exit 0**。此前模型/追加针对性重跑 **11/11 pass**。新七次追加和恢复断点也在实际记录中通过；仍未声称单次 11 文件全套通过。
- OpenSpec 1.14.1 `validate append-planned-changes-to-open-delivery --strict --json`：1/1 valid、0 issues，15/15 tasks 仍为已完成；`git diff --check` exit 0。没有执行 MenDi 根正式 Full Test/Close。
- [line-counts.json](artifacts/line-counts.json) 记录物理代码行数（含空行，排除 fixture 自带 node_modules）：`src/` 前列为 delivery-lifecycle 369、group-attempt 362、openspec/workspace 并列 347；`tests/` 为 action-write 468、planning-cli 445、delivery-repair 396；`scripts/` 为 mvp-d01-c 679、d01-d 488、d01-a 464。本次受影响的新 store 为 316 行、scope-additions 为 87 行、round-records 为 90 行；只针对真实 F1/F2 维持现有模块边界，不为压行数引入转发层。

## 交接

021 Author `revise-apply` 已完成两项修复。原 019 Author Apply、020 Reviewer 的 `changes-requested` 及全部已有 proof 不改；根项目依然 `manual-bootstrap`，本次仅保存实际人工阶段和证据，不冒称产品 Action CLI 写入。交独立 **review-apply**，不自签 approved、不 Archive、Git、D05 正式 Full Test/Close、安装或修改 DreMo。
