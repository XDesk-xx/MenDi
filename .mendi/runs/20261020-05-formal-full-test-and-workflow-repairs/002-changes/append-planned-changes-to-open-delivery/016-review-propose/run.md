---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-review-propose-01
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "016"
status: completed
actionStatus: completed
outcome: complete
verdict: changes-requested
result: proposal-stale-formal-run-type-scenario
nextAction: revise-propose
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/015-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/015-propose/run.md
---

# D05-B 独立 Review Propose（固定 Author 015）

**结论：changes-requested；仅一项可局部修订的阻断规格冲突。** 固定审核对象为 [015 Author Propose](../015-propose/run.md) 中的 proposal、design、四份 delta specs 和 15 项 tasks；对照 [014 Review Explore](../014-review-explore/run.md) approved、013 P01～P07、根路线图 §7 D05-B 和已 Archive 的 D05-A 当前正式执行代码。OpenSpec strict 的结构校验不能替代对已交付产品合同的语义检查。本 Review 未修改任何 Author 方案或历史 Run/verdict。

## 已成立的方案内容（可保留）

1. 新增 `delivery change add` 的范围仅是 open、可写 product-v2 当前轮的一个/多个槽位，不自动 bind/激活/OpenSpec new/Reopen/Archive/正式 Full Test/Close；保留原 binding、active Change 与此前 Run。需要 Owner 明确范围授权来源；Actor 字符串不能认证真人授权，后续 bind 另需实际 Owner 授权。
2. `design.md:44–52` 提供有限 `scopeAdditions` 提交前/后快照与真实受管 Run 的关联；针对 013/014 真实证明的 `recordRound` 完整 scope 等式不兼容，区分旧 Open/正式 passed/failed/Repair/Review 的历史轮次归属与当下最新完整范围资格，不迁移或伪造旧 Run。
3. `design.md:54–62` 选择独立 `delivery-change-add` typed Run 和专属追加指针 `scopeAddRunRef`，避免覆盖活动 Change 的 `latestRunRef` 或把追加收据冒充 `deliveryRunRef`。正式测试已稳定完成的 passed/failed 可以安全追加，但同时使旧结果失去当前 Close 资格，下一步待明确授权 bind。
4. `design.md:64–78`、四份 delta 和 tasks 已规定：拒绝 closed/legacy/历史轮重复 slot/非法依赖与 baseline、pending/lock/running/unknown/未决 Repair/Review；在锁内复核本次直接输入、收据/manifest 一致提交和读回；同 `requestId` 幂等、不同输入冲突、部分提交显式有限恢复，不把旧 PASS 用于新范围，也不提前实现通用版本管理器。
5. 15 项 tasks 的内容与各阶段目标基本一致，尤其历史 Open 与 Full Test/Repair/Review 读回、同轮多槽位、活跃 Change、旧 passed/failed、重放/竞争/中断/Close 负例被列入真实 product-v2 隔离测试；无需重复问已在根路线图确认的 Owner 产品方向。

## 阻断 Finding

**F1 · 高 · MODIFIED `action-runs` 继续承诺已废止的新版正式 Run 类型。**

- 受审路径：`openspec/changes/append-planned-changes-to-open-delivery/specs/action-runs/spec.md:5–11`。该 MODIFIED Requirement 的 `Scenario: Full test follows multiple archived changes` 明确以“Author **显式正式执行**”为 WHEN，却以“本次 Run 为 `015-delivery-full-test`”为 THEN。
- 已归档 D05-A 的真实现行新执行：`src/application/delivery-full-test.ts:27–38` 对新正式 Full Test 只接受显式 `groups-v1`，随后调用 `runGroupAttempt`；`src/application/group-attempt.ts:80–96` 实际为新 Run 写入 `actionType: 'delivery-test-attempt'`，即上述编号条件下应是 `015-delivery-test-attempt`。现有 `src/core/delivery-runs.ts:14–25,48–61` 虽仍能识别 `delivery-full-test`，那是**旧 command 的历史读取**，不能由解析器支持反推当前可新建该类型。
- **实际影响：** 此项若不改，会在当前仍被修改的正式规格中保持“新增 command 型 Run”的错误承诺，Apply/测试可能按照旧类型设置期待，从而破坏 D05-A groups-v1 唯一新正式验收路径。它不是当前源码已经错误新建该类型的证据，是受审 delta 与现行产品语义不一致。
- **要求 Author：** 只在 D05-B 的 `specs/action-runs/spec.md` 局部修订相应 scenario，改写为新完整 groups-v1 正式执行的 `015-delivery-test-attempt`（编号仅为示例，真实编号取共享 Delivery 当前可分配序号）；将旧 `delivery-full-test` 明确限定于已提交历史的只读兼容。必要时同步相关示例文字或任务，不回写已归档 D05-A 的规格/Run。更新后再独立 `review-propose`。**无需新增 Change、重做 Explore、增加 Owner 决策或提前改代码。**

## Reviewer 独立 proof 与限制

本 Reviewer 的可重放 [reviewer-proof.ts](artifacts/reviewer-proof.ts) 采用真实当前源码检查和纯内存核心函数，不执行 Author 原有会生成/清理隔离目标的 Explore 实验。独立 [proof-results.json](artifacts/proof-results.json) 保存固定 Author、关键受审位置与产品代码行号、15 项任务核对、F1 的新旧正式类型冲突、其他四份 delta 的行为覆盖以及当前旧 Open/Attempt 在同轮新增范围后 `recordRound` 拒绝归属的直接负例。该负例证明需要已设计的历史范围链，**不声称新的 `delivery change add` 已实现**。

- Reviewer 证明脚本严格 TypeScript 编译检查 exit 0、无诊断；完整命令、退出码与原始 stdout/stderr 在 [reviewer-typecheck.json](artifacts/reviewer-typecheck.json)。
- Reviewer 实际运行固定 OpenSpec 1.14.1 `validate append-planned-changes-to-open-delivery --strict --json`：exit 0、issues 为空；原始完整回执在 [openspec-validation.json](artifacts/openspec-validation.json)。校验成功并不会识别已废弃的业务场景。
- 首次执行 Reviewer 脚本的个别字符串定位断言与 Design 实际措辞不符，修正尚未提交的 Reviewer 自有脚本的文本定位后独立运行成功并才保存最终结果。这是 Reviewer 检查脚本的问题，不是产品缺陷或 Author 新版 writer 的失败。
- 当前尚无真实 change-add CLI；本次不测试新增正式收据写入、跨文件恢复与锁竞争，留待 Apply 实现后按 tasks 验证。没有执行根 MenDi Delivery 的正式 Full Test/Close，也没有修改任何历史或提交 Git。

## 交接

**下一步：`revise-propose / author / changes-requested`。** 保留 015 原文、014 Explore 的 approved、013 proof 及 012 D05-A Archive 不变。只需局部修订 F1，再交独立 Reviewer 复核；其它已明确方案无须重新设计。

本轮只保存 016 独立 Review Propose Run/artifacts 并更新当前 manual-bootstrap manifest 的 next；不执行 Apply、Archive、正式 Full Test、Close、Git、安装或 DreMo 写入。
