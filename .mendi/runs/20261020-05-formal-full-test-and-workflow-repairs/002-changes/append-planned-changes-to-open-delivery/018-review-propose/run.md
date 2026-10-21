---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-review-propose-02
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "018"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: revised-proposal-approved-for-apply
nextAction: apply
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/017-revise-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/017-revise-propose/run.md
---

# D05-B 独立 Review Propose（固定 017 Author 修订）

**verdict：approved，仅批准 D05-B 当前 Propose 进入 Apply；无剩余 Propose 阻断 Finding。** 固定 Author 是 [017-revise-propose](../017-revise-propose/run.md)，其局部修订针对 [016-review-propose](../016-review-propose/run.md) 的唯一阻断 F1。此前 016 `changes-requested`、015 原方案、014 Explore approved、013 proof、已归档 D05-A 的历史与结果均不回改。本次没有宣称新 `delivery change add` writer 已实现。

## F1：与 D05-A 实际正式 Run 类型一致

- D05-B 当前 `openspec/changes/append-planned-changes-to-open-delivery/specs/action-runs/spec.md:9–11` 的 MODIFIED Requirement 在 `Full test follows multiple archived changes` 场景下，已经明确 **Author 新 `groups-v1` 完整正式 Full Test 实际创建 `015-delivery-test-attempt`**。数字 `015` 明确仅为此前最大 Run 占号 `014` 的示例，不是永久硬编码，真实新 Run 使用共享 Delivery 当前下一可用序号。
- 同一 THEN 明确旧 `delivery-full-test` 仅对已提交历史 command 只读解释；它不是新正式写入类型。该修订与 `src/application/delivery-full-test.ts:27–38` 的 `groups-v1` 唯一新分流、`src/application/group-attempt.ts:80–96` 的 `actionType: delivery-test-attempt` 一致。现行 `src/core/delivery-runs.ts` 保留两种类型的 parser 为真实历史兼容，不能据此新增旧 command 正式执行。
- Reviewer 独立调用 `deliveryDefinition/deliveryLocation` 核对示例 `015` 的 typed `delivery-test-attempt` 和 legacy `delivery-full-test`，确认为不同类型但同 Delivery 顺序编号。F1 **已解决**。无需再次修订同类旧场景，也不再要求更改 D05-A 已归档规格。

## 其它已批准的 D05-B 方案保持有效

- Proposal、Design、其余 `delivery-workspace` / `delivery-verification` / `delivery-lifecycle` 三份 delta 与 15 项 Tasks 的内容仍与前次审核基础一致。当前改变的是 `action-runs` delta 的 F1 局部场景，没有引入新的产品决策。实际四份 delta 均可读、任务数为 15。
- 限定在 product-v2 当前 open 轮由 Owner **明确授权追加**一个/多个合法槽位，并由 Author 执行；命令的 actor 与 Owner 来源文字不能在宿主处替代实际授权。追加不等于绑定，不自动 activate/OpenSpec new、Reopen、Archive、Full Test 或 Close；待绑定项须另按既有 Owner 授权完成 bind。
- `scopeAdditions` 与 typed `delivery-change-add` 收据要让旧 Open、真实 finished passed/failed、Repair/Review 保持提交时范围的历史只读归属，而新当前 scope 成为独立的准入权威。追加收据用专用 `scopeAddRunRef`，不篡改合法活动 Change 的当前阶段 Run 或把它放入旧 `deliveryRunRef`。追加后旧 PASS 失去当前 Close 资格，待 bind 时 `status/next` 不能沿旧正式 PASS 返回。
- 完整输入与依赖校验、历史轮唯一性、基线 Close、同 `requestId` 幂等与冲突、锁内复核、受管原子持久化、读回、pending/unknown/运行中/未决 Repair Review 的阻断和有界显式恢复，已在 Design 与 Tasks 中具有实现落点。Apply 必须以**真实隔离 product-v2 writer** 和并发/中断测试证明，不能把 013 的模拟 append 或 014 的纯模型 proof 冒充实现验证。

## Reviewer 独立 proof

本轮新建 [reviewer-proof.ts](artifacts/reviewer-proof.ts) / [tsconfig.json](artifacts/tsconfig.json)，并实际重放保存 [proof-results.json](artifacts/proof-results.json)。该 proof 读取本次固定 Author 017、016 原 findings、当前四份 delta/Proposal/Design/Tasks 和已归档 D05-A 的真实现行代码，完成四项直接语义断言：F1 修复、实际 typed parser/共享序号、有限历史范围归属的 Design 保留，以及独立收据/当前进展/恢复边界的合同一致性。

- Reviewer 自身严格 TypeScript 编译：`node node_modules/typescript/bin/tsc -p <018 artifacts/tsconfig.json>`，**exit 0、stdout/stderr 均为空**；完整实际命令与读回原始结果在 [typecheck-results.json](artifacts/typecheck-results.json)。
- Reviewer 自行重跑固定 OpenSpec 1.14.1 `validate append-planned-changes-to-open-delivery --strict --json`：**exit 0、1/1 valid、0 issues**；完整原始 stdout/stderr 在 [openspec-validation.json](artifacts/openspec-validation.json)。此结果仅证明 OpenSpec 结构有效，审核批准建立在前述独立语义核对上。
- 根据 Review Propose 自有方法，局部复审只针对 017 实质修改与受影响的合同，不机械复跑 013/014 的真实/模拟 Full Test proof；原 016 已确定的同轮旧历史归属不兼容仍是**待 Apply 解决的实现障碍**，不因为方案明示安排该任务而再次变成 Explore/Propose 阻断。

## 限制与停止

本次未执行新的产品 `delivery change add` 写操作（尚未实现）、真实 Delivery Full Test/Close、Archive、Git、稳定安装或 DreMo 读写；`pnpm check/build` 是 Apply 实现阶段的验收义务，不能用本次严格校验代替。若实际实施改变 scope lineage、合法已完成 `failed` 的追加策略、Owner 权限或不可逆恢复语义，应在实际影响范围内按 MenDi 约定处理和再审，不借当前 `approved` 绕过新增风险。

**交接：`apply / author / awaiting-instruction`。Reviewer 停止，不自动 Apply；此 verdict 只批准现行修订方案。**
