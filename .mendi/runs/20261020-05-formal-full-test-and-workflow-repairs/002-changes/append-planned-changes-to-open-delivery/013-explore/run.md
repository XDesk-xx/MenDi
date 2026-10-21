---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-explore-01
actionType: explore
role: author
actor: codex-author
run: "013"
status: completed
actionStatus: completed
outcome: complete
result: proof-supported
nextAction: review-explore
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/explore/SKILL.md
upstreamSkillRef: .agents/skills/openspec-explore/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/012-archive/run.md
---

# D05-B Author Explore：未 Close Delivery 追加计划 Change

Owner 原始授权：Owner 授权激活 D05-B：未 Close Delivery 追加 Change CLI，进入 Proof Explore。

固定 OpenSpec 1.14.1 原生 new change 已创建本 Change scaffold；根项目仍为 manual-bootstrap，采用既有人工记录模式关联现有 002-changes 批次的 013-explore，不冒称产品 change bind 写入成功。

本次只执行真实 Proof Explore：现有 slot 绑定限制、当前轮追加及依赖、执行中/unknown/正式 PASS 或 failed 后追加的准入、安全一致性与历史保留。

## 依据、方法与范围

唯一长期路线图 §7 D05-B 要求：仍 `open` 的 Delivery 在当前轮追加计划槽位，保留旧绑定/原轮/历史 Run，可在原 Full Test 稳定 passed 或 failed 后追加；新增槽位另获授权才 bind/activate，旧正式结果不得用于新范围 Close。当前没有 `delivery change add` 产品入口，`bindChange` 只能关联既有槽位，`reopen` 只能用于 closed 后新轮。后续 Propose 不得改变 Owner 已定方向。

本 Run 的 [proof.ts](artifacts/proof.ts) / [proof-results.json](artifacts/proof-results.json) 实际调用现行 `bindChange`、`readScope`、`projectRound`、`readWorkspace` 和真实 `groups-v1` Full Test；[proof-failed.ts](artifacts/proof-failed.ts) / [proof-failed-results.json](artifacts/proof-failed-results.json) 再以真实中段失败覆盖稳定 `failed` 情形。两套 strict TypeScript 检查均 exit 0，分别见 [typecheck.json](artifacts/typecheck.json) 与 [typecheck-failed.json](artifacts/typecheck-failed.json)。

实验中的“追加”是只在隔离 product-v2 测试夹具中模拟更新 scope，**不是已经支持的产品写入功能**；测试 actor/reviewer 仅为夹具数据。第一次 P04 运行因未预料当前 `recordRound` 的严格检查，exit 1 / `invalid-round-record`；Author 在本次尚未交接的 013 Run 中调整 proof，将这一真实失败转成显式断言，并重新运行后 exit 0。第一次失败自有夹具通过准确的 nonce marker、realpath、无锁验证后定向清理；没有扫描并删除其他同名前缀的目录。

## 七项真实 Proof

| 编号 | 实际观察 | 设计含义 |
| --- | --- | --- |
| P01 | `bindChange` 对未计划 C 返回 `planning-slot-not-found`，原 manifest 字节未变 | 需要单独追加 CLI，不能偷用 bind |
| P02 | 在当前 `r001` 的 scope 中模拟追加 C 依赖 B，`projectRound` 和 parser 接受；原 A/B archived binding、轮次数及 activeChangeId 不变 | 既有轮次模型有追加基础，不必 Reopen 或自动 bind |
| P03 | `readScope` 对重复 slot、未知依赖和依赖环均拒绝 `invalid-scope` | 复用现有数据完整性合同 |
| P04 | 真实 Full Test `formalOutcome=passed`；仅扩大 current-round scope 并保留 `deliveryRunRef`，读回拒绝 `invalid-round-record`；旧 Run 未改 | **不能只改 plannedChanges**，必须同步失效当前正式验收 |
| P05 | 模拟撤销当前 `deliveryRunRef` 后当前新 scope 可以查询，但 `next` 仍显示 `delivery-next`；旧 Run 的显式 `inspectAttempt` 仍因 scope 不匹配拒绝 `invalid-round-record` | 新增槽位应提示 bind；更重要的是旧 PASS 失去当前适用性**不等于旧历史不可读** |
| P06 | scope 追加后，`delivery close` 使用旧 passed Run 仍拒绝，未生成 Close、原 Run 未改 | 历史 PASS 不得对新完整范围收口 |
| P07 | 真正执行 `passed/failed/passed` 的完整 groups-v1，`formalOutcome=failed`；追加范围亦触发 `invalid-round-record`，撤销当前指针后旧失败 Run 查询仍无法归属原 scope | 稳定 failed 未 Close 同样必须允许追加并保留旧失败查询，不能强迫先 Close/Reopen |

## Propose 必须解决

1. **不可变历史与轮次归属：** `src/core/round-records.ts` 目前以旧 Run.scope 与**当前** round.scope 完全相等定位；更新本轮范围会让既有 passed/failed Run 丢失查询归属。必须提供可验证的同轮范围追加历史/旧版本归属，不能修改旧 Run.scope 或伪造旧验收。
2. **范围修改与当前验收入口的事务一致性：** 新命令必须保留旧记录和结果，但令当前正式 PASS/failed 对新增范围失效；当前 `deliveryRunRef` 和 `status/next` 不能仍宣称 `delivery-next`。需恢复到待 bind 新槽位的交接，而不是自动 bind、激活、Full Test 或 Close。
3. **必要准入：** 同轮新增 slot/title/dependsOn/reason/Owner 来历、历史轮 slot 去重、依赖环/基线 Close、已有 active Change 继续、不修改旧轮/绑定/归档编号。已稳定 finished passed 或 failed 且无未解决修复审核时可追加；running/unknown、未确认清理、pending、锁、closed 拒绝，旧记录不改写。一次可追加多个并保留原顺序，重复提交不能二次增加。
4. **受管记录与中断：** 是否使用一个独立 Delivery 操作 Run/追加收据、如何让 `currentRoundId` 投影与实际进展权威一致，由 Propose 固定最小合同；不能对历史状态作静默补丁或把新计划自动视为批准。
5. **验证界限：** 此处已覆盖关键现实差异，但尚未交付新 CLI。后续 Apply 必须包含有活动 Change、真实已 finished passed/failed、旧历史显式查询、closed/unknown/锁拒绝、重复/中断以及跨进程读回的隔离产品回归，不用本次探索结论冒充实现通过。

## Owner 关键问题与交接

Owner 已在路线图明确允许未 Close 且 Full Test 已稳定 passed/failed 时追加、保留旧 Run、重做完整验收和 bind/激活授权边界。当前没有新的阻断性 Owner 决策；上述为待 Propose 固定的技术合同，不重复询问。D05-B **Author Explore 已完成**，交独立 `review-explore`；本次未进行 Proposal/Apply、独立 Reviewer 签署、Archive、Git、D05 正式 Full Test/Close 或部署。

