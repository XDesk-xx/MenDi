# Proposal

## Why

D04 的 `groups-v1` 已能真实收集独立失败，但现行正式流程允许 `continue / retest` 和跨 Run `candidate-verification` 拼接通过；新执行也不能从“旧 command failed → 完成且获独立批准的 Repair/Review”正确衔接。Owner 已决定：今后的正式 Full Test 必须一次覆盖当前轮全部必需组，结果由这次执行自身形成 `passed`，修复后再全量执行，且不再增加日常 verification 汇总或例行 Owner 决策。

## What Changes

- **BREAKING（仅面向新正式写入）**：`delivery full-test run` 唯一接受明确 `mode: groups-v1`、当前计划全部必需组与真实 runner；缺协议不回落到旧 command。取消新 `continue / retest` 选组及 `delivery verification create` 聚合式验收写入；旧记录仍可按原有类型只读。
- 一次完整正式执行同时保存父 Run、子真实命令、计划/候选/逐组终态、资源清理、失败总览和时间；全部必需组通过、报告有效、读回稳定才由**本次正式 Full Test Run 自身**给出 `passed`。普通失败继续运行不依赖项；必需失败/阻断/未执行、必需 skip/TODO、零业务执行及协议矛盾不能 PASS。
- 保留 `delivery-repair` / 独立 `review-delivery-repair` 对实质代码、断言、执行合同修复的正式记录，approved 后新整次完整执行。已确认的普通环境准备问题（没有材料与执行语义变更、清理已知安全）仅记真实失败与处置证据，可免无意义 Repair/Review Runs 后完整重新执行；不确定 / 锁 / 未确认执行暂停。
- 补齐当前轮旧 command failed、真实修复及独立 Review approved 后**首次**进入新 `groups-v1` 的准入；不要求不存在的旧 `testAttemptRunRef`，不造旧组 PASS，不修改旧失败。
- 同步正式结果状态、`status/next`、当前候选适用性和授权 `Close` 的新结果直消费；兼容只读历史 `delivery-full-test`、旧 `delivery-test-attempt`、`delivery-verification`、旧 Repair/Review/Close。现行组内安全资源隔离、事件、受管路径与负控保持。
- 范围不包括新的通用测试调度平台、缓存拼接/增量正式验收、外部普通 Full 追认 PASS、DreMo 的未授权修改，以及 D05-B/C/D 的其他独立 CLI 与证据管理功能。

## Capabilities

### New Capabilities

无。沿用现有 Delivery 正式验收、执行、生命周期与交接能力。

### Modified Capabilities

- `delivery-verification`：新正式 groups-v1 的唯一准入、单次完整 PASS、实质修复审核和环境例外、旧 command 到新执行衔接及历史只读。
- `test-execution`：明确分组真实报告、依赖阻断、资源确认、取消与完整读回对正式结果的约束；保留底层普通命令事实。
- `delivery-lifecycle`：授权 Close 从新完整正式 Run 直接消费，避免旧 verification 类型误收口；旧 Close / Reopen 事实不变。
- `action-runs`：正式 Run 终态与 next 交接、Repair/Review 与环境重跑的分流及历史读取，不额外生成验证汇总 Run。

## Impact

- 重点：`src/application/{delivery-full-test,group-admission,group-attempt,full-test-admission,delivery-repair,delivery-lifecycle,candidate-verification}.ts`，`src/core/{delivery-runs,group-records,delivery-verification,group-report}.ts`，相关 adapter、CLI 命令 / query / status。
- 方法与协议：`skills/actions/{delivery-full-test,delivery-repair,review-delivery-repair}`、`skills/group-tests.md` 和必要的 CLI 说明。
- tests：独立失败收集、完整 PASS / Close、实质修复 → 审核 → 全量再执行、旧 command 衔接、环境例外与 unknown、旧记录只读；原 D04 的跨尝试聚合测试转为**历史读兼容**，不能继续认定是新正式验收方式。
- 依据：D05-A 002/004 的真实隔离 proof 及 003/005 独立审核、根路线图 §7 的 Owner 已确认决定。本 Change 的 Propose 不实现产品行为，也不使用夹具中的 actor/verdict 认证真实 Reviewer。
