# Design

## Context

见 [Proposal](proposal.md)。013 Author Explore 的 P01～P07、014 独立 Reviewer 的 R01～R05 已确认：现有 `bindChange` 无法新增未规划 slot；`projectRound` 能在同一 r001 表达范围追加，但旧 `recordRound` 依赖 `round.scope` 与旧 Run.scope 相等，新增后旧 Open、真实正式 `passed/failed`、Repair/Review 都可能无法归属；只撤销 `deliveryRunRef` 仍会错误回到 `delivery-next`。014 approved 只授权进入方案，不代表 writer 或并发恢复已实现。

MenDi 根为 manual-bootstrap；产品 CLI 只写隔离 v2 product。D05-A 的 groups-v1 完整正式结果/typed Close 已归档为 014，D05-B 不得回退该合同。当前源码的可复用边界：`readScope`、`projectRound/readRounds`、`readWorkspace/updateWorkspace`、`scanRunNumbers`、`bindChange`、`recordRound`、`currentDeliveryRun` 和本轮 `deliveryNext`。

## Goals / Non-Goals

**Goals**

- 当前 `open`、可写 product-v2 的当前轮有显式、可追溯且幂等的“追加计划”写操作；保留旧轮、旧 binding、活动 Change。
- 已稳定 ended `passed` / `failed` 时仍允许追加，历史记录可按原真实范围读取，但不能再用于新范围 Close。
- 独立收据、受管写入、同轮有限范围演进、当前执行资格失效和 status/next 在同一提交边界一致。
- 真正的 running/unknown、未解决 Repair/Review、closed/legacy、无效依赖、路径冲突严格 fail-closed。

**Non-Goals**

- 无需为每次追加 Reopen 或建立通用任意回滚/分支的 scope 版本系统；不增加自动 OpenSpec new/bind/Reviewer/Archive/Full Test/Close。
- 不修改或迁移 MenDi 根 manual-bootstrap、D01–D05-A 真实历史、DreMo；不添加外部 Full Test PASS 旁路或自动发布。

## Decisions

### D1. 独立 CLI 与多槽位声明，授权不由 actor 冒充

建议新入口 `delivery change add --project <path> --input <change-add.json> --role author --actor <id>`，输入示意：

```json
{
  "requestId": "append-owner-approved-01",
  "ownerDecision": "Owner 明确批准在当前轮新增后续计划的来源说明",
  "reason": "当前交付增加一项有界能力",
  "additions": [
    {"slot": "C", "title": "新增能力", "dependsOn": ["B"]}
  ]
}
```

使用既有 `readScope` 对完整拼接后范围做依赖、去重、非空及环检测，拒绝历史轮用过的 slot 与非法跨 Delivery 基线（以 `deliveredBaselines` 的当前受控真实 Close 核对为准）。`requestId` 对同轮成功结果固定不变，重放相同实际输入返回原收据，输入不同则冲突，不允许请求覆盖旧计划。CLI actor 表示调用 Author 而不是验证真实 Owner 身份；Host/Agent 需要持原 Owner `owner 授权` 指令，写入有限的决定来源，不能从模板文字推断授权。原因和授权来源是审计事实，不额外增加审核 Action。

*替代方案*：让 bind 隐式扩容、将追加操作等价于 Reopen。两者都会越过 Owner 二次授权或违反未 Close 的轮次身份。

### D2. 给当前轮保存有限 scope 追加链，旧 Run 仍按提交时范围归属

在结构化当前轮增加**单向追加条目**，例如 `scopeAdditions: [{ requestId, runRef, beforeScope, addedSlots, afterScope }]`，每条必须严格满足上一条 afterScope = 下一条 beforeScope、后范围为在原顺序末尾纯追加、goal 不变、历史轮/已归档 binding 不被修改；最终 afterScope 恰为权威 `round.scope`。没有追加的老轮没有字段仍可读；新条目只对应真实 submitted、同轮同 Author 的 typed 追加收据。它是该轮最小化的**不可变范围里程碑**，不是通用版本管理器或接受任意回滚的历史列表。

调整 `recordRound`：历史 `summary.roundId` 和 `summary.scope` 必须唯一匹配所属轮的原始 scope（首条 beforeScope）或其已提交 append afterScope；老缺 roundId 的兼容仍只允许迁移收据前的实际历史；Close 等 `completionScope.completed` 应根据该 Run 当时范围对应的 archived binding 解释，而不是拿新完整范围否定旧已提交成功。历史 Run 查询路径只读说明事实，不能仅凭属于该轮就获得**当前 scope 适用**；正式新写入的 eligibility 用当前 `round.scope` 严格比较。

需同样处理历史 `delivery-open` / `delivery-reopen` 的生命周期摘要、旧 `delivery-test-attempt` / legacy command、已提交 Repair/Review；不递归要求全部历史说明、所有旧日志在普通 query 时重新认证。现有历史轮不变，不把旧范围迁移成新轮。

*替代方案*：直接把旧 Run.scope 改成新 scope 会伪造曾经的测试范围；只清 `deliveryRunRef` 又会使旧显式读取报 invalid-round-record，P05 已证实。

### D3. Append Run 与当前阶段是两个独立权威入口

引入受管 typed `delivery-change-add` Run（共享 Delivery 占号，`.mendi/runs/<delivery-id>/<nnn>-delivery-change-add/run.md`），包含 Author/actor、requestId、Owner 来源、reason、roundId、before/afterScope、已有当前指针和实际追加槽位。每次成功提交新 Run；其定位通过当前轮的 `scopeAddRunRef` / 最近追加条目，而**不把该收据放入现有 `deliveryRunRef`**，因为该字段代表正式执行/生命周期当前进展，且活动 Change 时产品禁止二者并存。

若旧 current `deliveryRunRef` 是 finished 正式 passed/failed、Open/Reopen，则在同一原子提交中**撤销它的当前执行资格指针**；`fullTestRunRef`、`testAttemptRunRef` 等旧 typed 指针保留为历史定位，但消费逻辑必须结合本次 scope 与当前本轮资格验证而不是读出旧 PASS。活动 Change 的 latestRunRef、actor、状态完全不变；已有合法活动 Change 前不存在需要被本操作结束的正式执行。

普通 `status/next`：已有活动 Change 时返回其实际阶段；无活动但追加后有未 bind 槽位，返回 `change-bind` / 等 Owner 授权；所有槽位已归档且没有新待办才进入 `delivery-next`。单独查询追加收据读取当前轮有限来源，不从历史最大目录猜 next。D05-A 的 typed Close 仍只消费最新当前 `testAttemptRunRef` 与 `deliveryRunRef` 一致的**本轮完整新 PASS**。

*替代方案*：复用现有 deliveryRunRef 存新增收据，会破坏 activeChangeId 与 deliveryRunRef 互斥，造成当前 Owner 交接错位。

### D4. 准入和恢复：区分“已结束失败”与“仍在修复/未知”

`add` 前在只读状态判断当前可写与可解释：state=open、formatVersion=2、目标/轮次/已有 binding 有效、没有 pending/旧迁移问题与其他写者；当前 full Attempt 的 `phase=finished`、直接报告、清理和持久读回都稳定后，即使 `formalOutcome=failed` 也可进入新增范围决定。**未决 Author Repair/独立 Review**、前台仍运行、locked/unknown/中断或资源归属不明拒绝，防止新 scope 绕过真实修复。合法活动 Change 可继续，前提没有冲突 Delivery 操作。

采用项目既有锁、写入观察与真实 Run 序号分配：写前获取并固定请求字节/manifest，锁内重复验证；保存动作意图和本次受管收据，然后一次提交可由 `projectRound` 计算的新当前轮投影与受管指针。每步完成、读回一致后才应答成功。未知写入保留锁、必要 `*.tmp`、收据编号与原快照，不自动删除或再次执行。显式恢复首先核对原操作身份、请求、归属进程实际已停止、已产生的物理效果；若已完成返回 already-completed，未完整则只补明确可确定的当前一次动作，无效果时按既有现场授权流程处置。

对于重复请求，避免新占号前就触发未知 writes；只有同一 requestId、同一输入已提交且读取当前 manifest 可证一致才幂等返回；冲突输入拒绝。不要使用全库 hash 扫描或整树证据复制。

*替代方案*：无类型直接改 JSON 或把所有 failed 一律拒绝。前者无法诊断中断，后者违背 Owner 要求并掩盖安全 settled failed 的历史审计。

### D5. 旧历史只读与当前资格隔离贯通

调整 `src/adapters/workspace.ts` 当前读回、`src/core/round-records.ts` 归属解释、`src/application/project.ts` 查询/绑定、`src/core/delivery-next.ts` 交接、`src/application/{group-admission,delivery-lifecycle,delivery-repair}` 中真正需要的来源与当前准入，避免旧 summary.scope 矛盾被当成永远失效的历史。不能只在 `status` 上把报错屏蔽：显式查询历史 Full Test 和 Repair/Review 也必须能在原范围读取，且当前写入不得消费陈旧结果。

将 `delivery change add` 接到 CLI arguments/help、受管方法、新 Input 合同；方法实际描述对未 Closed、Owner 授权和停顿的要求。旧 Open/旧 command/旧 v1 attempts 只能历史只读，不开启新写模式。

## Risks / Trade-offs

- **[历史 Run 归属匹配过宽]** → 仅允许当前轮完整、按追加顺序且有受管 submitted 收据的 scope 快照；roundId 必须唯一，当前资格仍检查**最新** scope。伪造历史已完成不予接纳。
- **[旧 passed 仍可 Close]** → 新增后同锁撤销当前 Delivery 结果，Close/正式验收比较最新 scope 和指针；负例验证旧 passed 与 passed→added→新 Full Test 前不同阶段。
- **[合法活动 Change 被意外打断]** → 追加收据使用独立 typed 指针，bind/latestRunRef 与当前批次不动；隔离模拟各种阶段并跨进程查询。
- **[中断导致重复槽位或恢复失效]** → 真实独占/意图/幂等请求、读回验证、unknown 保存现场；不扫描编号或删除其他任务的 tmp。
- **[旧 Run 查询引发无关完整重验]** → 历史查询只核对最小真实身份、轮次/收据范围关系及被指定源；实际消费才重新验证必要直接依赖/报告。
- **[追加在合法 failed 与未解决 Repair 之间混淆]** → 明确执行已结束安全且没有未决修复审核才允许，状态未知一律拒绝。
- **[能力复杂度蔓延]** → 只扩展当前轮 scope 并保存有限 append 事实，不提供任意编辑已有 slot、删除、前插、跨轮合并或通用 scope 版本管理 UI。

## Migration Plan

1. D05-B 新 writer 仅在未来的 product-v2 目标上工作；无 `scopeAdditions` 的旧轮继续按当前 read/write 兼容格式；D01～D05-A 已提交历史不改。
2. 先做 typed 收据/范围快照与 parser/状态读回及恢复协议，随后追加 CLI；在隔离真实 product-v2 目标做 A/B→C 的前后状态、活动 Change 和 finished passed/failed/Close / 旧 Open / Repair / Reviewer 历史可读回归。
3. 同步 CLI/Skills/README 与完整测试，按 MenDi 规则交独立 Reviewer；只有另行授权后 Archive、整个 D05 Full Test、Close、Git 或版本/安装发布。
4. 回退不能使用不识别本轮新收据和 scopeAdditions 的旧版本接管已经追加的目标；若已存在成功追加，保留实际现场，由识别新格式的版本按单独授权处置，不倒改旧 Run。

## Open Questions

无须等待 Owner 的产品方向决策：Owner §7 D05-B 已确认未 Close 可追加、旧 finished passed/failed 保留与新验收重新全量、明确 Owner/bind 边界。字段名与局部模块划分只要维持上述稳定协议，可在 Apply 保持最小实现并经独立 Review 验证。
