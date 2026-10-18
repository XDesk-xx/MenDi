# Design

## Context

动机见 proposal 的 Why。002 Explore 与 003 独立审核的结论是当前设计输入：`lifecycleTargets` 用新 scope 覆盖顶层；binding 和批次保留；旧正式结果仍可读，但不能 Close 新轮；v1 读者忽略轮次扩展字段。迁移不是把旧 Run 改成新合同，也不能靠复制旧槽位解决。

当前工程已有项目锁、原子文件替换、Delivery 占号、pending 与直接输入复核。`core/records.ts` 同时解释格式和当前 scope，`core/batches.ts` / `associations.ts` 解释批次与绑定，`lifecycle-store.ts` 处理三种生命周期提交。新模型须统一这些消费点；普通 query 与需要写入的准入不能共用一个“仅新格式”检查。

本阶段只编写方案。现有实现、主规格、002 / 003 Run、DreMo 与稳定安装保持。具体外部包版本不变，产品修复版版本号留在 D04 发布方案确定。

## Goals / Non-Goals

**Goals:** 让一份权威轮次范围驱动现有工作流；旧记录只读兼容，必要迁移可解释、可恢复；同项目内的已交付 product 成果可明确作为基线；保留既有协作身份及实际结果。

**Non-Goals:** 通用版本 / 依赖调度器、跨项目依赖、自动历史补全、人工历史转 product、同轮多次测试结果组合、其他工具升级，以及在本 Change 执行真实目标迁移或发布。

## Decisions

### 1. 新项目入口与 manifest 采用 formatVersion 2，Run 与执行记录分别兼容

项目入口和新 / 已迁移 manifest 使用 `recordingMode: product / formatVersion: 2`。旧工具会因不认识该格式拒绝，而不会忽略轮次字段后继续覆盖。单纯在 v1 加字段不可用，Explore 已直接验证；也不引入一套平行 sidecar 范围权威。

| 入口 / manifest | 新版读取与写入 |
| --- | --- |
| product v1 / v1 | 维持旧查询；普通写入拒绝，明确要求迁移 |
| product v2 / v2 | 按新轮次模型读取及执行已授权写操作 |
| product v2 / v1 | 允许旧登记 Delivery 只读查询 / 作为直接基线来源；选定旧 Delivery 时可显式迁移，不自动改其他 manifest |
| product v1 / v2 | 无对应迁移 pending 时为矛盾记录；不猜恢复 |
| manual-bootstrap | 按现有人工格式只读；不迁移、不满足产品结构化硬依赖 |
| 未支持版本 / 非法组合 | 明确拒绝，不退回宽松解释 |

Run 和测试执行记录的 schema 不随项目版本机械改号。历史 formatVersion 1 Run / result 原字节保持，现有动作路径和解析仍可使用。新建生命周期、正式 Full Test 和 repair 数据增加必要 `roundId`；Action / Archive Run 仍由 Change binding 和批次唯一确定所属轮，无须重复存一份可独立修改的身份。

已迁移 manifest 保存 `migrationRunRef`，只作迁移收据及旧记录编号边界，不是当前工作指针。早于该收据的旧生命周期 / 正式 / repair 记录缺新 `roundId` 时，用已保存的唯一范围 / 关联解释；之后新建的相应记录必须有正确归属，不能无限接受“旧格式省略”。迁移前已有 draft 保留原头部，按这条明确旧边界继续保存 / 提交。普通查询不因此读取迁移收据正文。

### 2. 一份权威轮次与受校验的当前投影

manifest 的主要新增表示为：

```text
formatVersion: 2
id / title / openedOn                 原 Delivery 身份与首次日期
rounds[]                             按实际先后保存
  id: r001, r002, ...                 Delivery 内稳定，不依赖日期
  origin
    kind: open | reopen | legacy-baseline
    runRef                           真实记录化 open/reopen 才有
    sourceRefs                       legacy 仅列实际来源，不造 Open
  openedOn / reason                  真实可用事实；首轮不造 reopen reason
  scope
    goal
    plannedChanges[]                 本轮新增槽位
  state: open | closed
  currentBatchId                     未开始为 null
  deliveryRunRef?                    本轮当前 Delivery 进展
  fullTestRunRef?                     本轮最近正式结果
  closeRunRef? / closedOn?            本轮真实收口
currentRoundId
activeChangeId                       唯一当前活动 Change，保留现有入口
changeBindings[] / changeBatches[]    全 Delivery 追加历史，身份 / 路径不变
migrationRunRef?                     仅显式迁移产生
```

每个 planned slot 在全 Delivery 历轮中唯一；每个 binding 根据 `planningSlot` 归属唯一轮次。批次由成员的 binding 归属核对，不能跨轮混成员；轮次保存自己的当前批次。不向旧 binding、batch 或 Run 强加一组重复的 roundId。现有首次实际 Run 才建批次的时机不变。

保留现有顶层 `goal / plannedChanges / state / currentBatchId / deliveryRunRef / fullTestRunRef / closeRunRef / closedOn / reopenedOn` 的当前投影，以降低 CLI / 宿主接线变化。统一读取 / 转换逻辑生成并严格比较，写者不能分别维护。`openedOn` 始终为 Delivery 首次日期；顶层 `reopenedOn` 只在当前轮确为 reopen 时投影。

Reopen 锁内用同一次已占号操作追加一次 `rNNN`，当前轮改为新轮。新轮没有自己的 Full Test / Close，故顶层不再指向旧轮的结果；这些引用完整保存在旧轮，不能保留成“当前”指针。恢复基于原 intent 和目标状态复核，同日多次与重入不会再次分配轮次。日期、分支名或历史目录最大号均不单独决定轮次。

### 3. 查询显式选择历史，执行入口只用当前轮

现有 `status / next` 默认显示当前轮及简短历史轮次概览；JSON 保留当前 scope，另给 `currentRoundId` 和轮次概要。`status --project <root> [--delivery <id>] --round <round-id> [--json]` 显示指定轮的完整保存摘要，不切换选择、不调用该历史 Change 的活动 status、不把它转成可执行 next。`next` 不增加历史轮次执行入口。

旧 product / manual 查询保持原语义，增加兼容性说明；请求它们没有的结构化轮次时明确拒绝该请求，普通查询仍可用。普通 query 不重建轮次、不展开基线、不重验旧日志；必要当前输入损坏仍报错。迁移后旧正式结果可有明确旧轮归属，但 outcome 与当前适用性仍分开。

### 4. 本轮依赖与已交付基线分开，支持同项目跨 Delivery

计划槽位保留原 `dependsOn: string[]`，只用于同轮 DAG；另可声明：

```json
{
  "slot": "P10",
  "title": "继续扩展能力",
  "dependsOn": [],
  "baselineDependencies": [
    {
      "deliveryId": "d01",
      "planningSlot": "P09",
      "closeRunRef": ".mendi/runs/d01/028-delivery-close/run.md"
    }
  ]
}
```

`baselineDependencies` 省略等价于空数组，规范化比较统一处理；不把既有说明字段自动升格成硬依赖。明确 Close 引用可同时定位新 / 旧 product 的完成事实，无须强制旧来源具备新 roundId。当前项目索引、来源 manifest、对应 archived binding 和指定 Close 的 acceptance 完成快照共同证明所引用的 slot / Change / archiveOrdinal 一致；新格式来源另外核对该 Close 属于已关闭轮次。

来源是同 Delivery 时必须为此前已关闭轮；跨 Delivery 时允许来源后来已 Reopen 或项目累计归档数继续增加，只看所指定真实完成事实。来源加载只读索引、manifest 必要身份 / 归档绑定和指定 Close，不走来源的普通 query，不读取其当前活动 Run、活动目录或上游 status，避免来源后续工作缺件被错误加入旧成果的前置。来源无需先迁移，也不改变 activeDeliveryId。manual-bootstrap、未登记 Delivery、项目外路径、不匹配 / 缺失 Close、非归档完成或重复矛盾引用不能满足硬依赖。缺少旧审核正文、归档内容或测试日志不成为新的前置。

依赖核对不递归进入来源的依赖图，也不要求来源当前同样 closed 或重新验收。范围准入先核对实际声明的直接来源；bind 锁内复核本槽位的基线，正式 Full Test 对本轮声明再直接核对。普通 stage query / instructions / draft save 不扫描其他 Delivery。所有来源同项目，沿用一把项目写锁；实际读取文件仍需受管路径与前后直接输入复核，不能宣传隔离任意编辑器写入。

### 5. 正式执行明确归属，不提前引入 B 的聚合政策

新的 lifecycle、`fullTest` 与 `repair` 摘要写入 `roundId`，解析 / 准入核对 scope、binding 完成项和当前轮一致。Review 沿固定 Author 继承归属。旧数据只在明确迁移边界内按保存的范围及关联解释，不改原记录；无法唯一解释的迁移输入拒绝。

正式 Full Test 另外保存本次直接核对的 `baselineFacts`：按当前槽位声明对应到来源 Delivery、slot、Close、Change 和 archiveOrdinal。它是本次准入事实快照，不是第二个可写 scope，也不是基线成果的本轮批准。Close 核对该快照与当前轮声明、当前正式结果和材料适用性，不递归展开来源旧历史。

普通测试子结果继续通过其既有 executionId、Delivery 和父正式记录关联，不给全部测试记录迁移或增建轮次目录。同一轮失败之后，现行 repair → 独立 review → 新整次 Full Test 不变；跨轮旧 PASS、同名 script 或旧 repairApproval 不能满足新轮。没有新验收结论前，轮次修复不能宣称当前候选通过。

### 6. 旧格式写入 gate 与读取解耦，不给旧 resume 开例外

新增一个明确的可写新格式准入，在所有实际写入口、占号、业务命令或原生调用之前执行，并在持锁后复核。覆盖 bind、Action start / continue / resolve、Run save / submit、Archive prepare / execute / finish、普通 test run、正式 Full Test / repair / review / note / submit、Open / Reopen / Close 与旧操作 resume。不能只改一两个 API；也不能把 gate 放进共用读取函数，导致旧 status、instructions 或历史结果不可读。

空目标 Open 直接创建 v2；显式 migration apply / 同次 migration resume 是专用新格式转换路径。旧 product 已有生命周期 / 原生归档 / 测试未完成现场时，新版不恢复旧提交，明确指向旧版恢复和原有 Owner 锁处置边界。恢复完成后重新 preview，再按独立授权 migrate。当前用户已明确选择不保留新版旧格式恢复例外。

普通 Action / Review / repair draft 是已保存工作，不等于半提交：完整且无正在执行写者时允许迁移。Archive prepared / 明确 none 可按完整直接状态迁移；invoking、效果未确认、计数 / 终态部分提交，以及 formal prepared / running 等未确认执行须先旧版恢复。迁移不通过“删锁”将这些状态当作完整。

### 7. 迁移只转换当前选定 Delivery，预览不占号

公开入口：

```text
delivery migrate preview --project <root> --json
delivery migrate apply --project <root> --input <project-local-preview.json> --role author --actor <id> --json
delivery migrate resume --project <root> --run <same-migration-run> --role author --actor <original-id> --json
```

它们是本地记录操作，不执行 OpenSpec、测试、原生归档或安装，返回 `executionMode: local-only / openspec: null / upstreamAccess: not-required`。preview 只输出供审阅的 JSON；调用者明确保存到项目内文件，命令本身不建目录或 receipt。apply 的输入是数据，不信任其中的候选 / 路径：从当前实际文件重新计算计划并比较，拒绝项目外输入、手改目标、陈旧声明或新缺口。

预览包含目标规范路径 / Delivery、原格式、直接来源与真实限制、全部可重建轮次、各 scope 和归属、当前活动交接、计划差异及本次实际直接输入。只读计算预计占号但不保留；apply 锁内再次核对原编号可用，不把它当已占号。

重建先消费所选 manifest、当前直接 Run、真实 Open / Reopen 范围和其必要前态 / Close。确需发现记录化轮次时，只在该 Delivery 的同级 Run 目录中选择 open / reopen 及明确的直接来源，不递归遍历 Change 批次、测试日志或全部审核。旧的 before-manifest / before-project 可能保存为 JSON 字符串，按原格式解释，不改原件。

每个旧 binding / batch / 当前正式结果必须能唯一归属已知轮次，所有已知 closed 轮须有一致直接 Close；不靠 binding 名称还原丢失的目标 / 计划。首次 Open Run 缺失但范围充分时，将最早可核对范围标为 `legacy-baseline`；当前尚未 Close 的合法首轮保持 open，不制造 Close。若更早成果无法归属、历史目标确实缺失或材料矛盾，报告对应缺口，不把未知历史伪装成一轮。

来源完整性只影响本次迁移，不能变成普通 query 的新 gate。origin.sourceRefs 是真实来历说明，普通查询不重新消费这些原件；迁移收据保留本次实际前态，不能因转换后的同路径内容已变化而改写旧来源事实。未知扩展尽量保持原信息，不递归解析未知 Ref，不引入全库 hash / 引用图。真正需要复核的本次直接输入可保留其实际内容和前态；不嵌套复制整个 `.mendi/runs` 证据树。

### 8. 迁移用现有提交原语，receipt 不取代协作进展

新增 `delivery-migrate` Delivery Run 类型与对应方法，使用 `migration` 数据块区分格式转换和业务生命周期，避免强套“必须 closed”的 Reopen 前置。复用占号、项目锁、受管替换、`pendingDeliveryRunRef` 和诊断入口，不另建迁移数据库、轮次目录、任务队列或一套持久状态机。

按职责拆分必要的纯轮次 / 投影解释、旧输入到候选转换和迁移存储提交；现有生命周期 adapter 复用文件原语，而不是继续把迁移、跨 Delivery 解析和所有轮次逻辑堆进同一长函数。新模块必须承担实际解析 / 转换 / 提交责任，不为压行数增加纯转发层。

提交顺序为：持锁复核实际 preview 输入与角色 → 独占占号并保存 draft intent / 原输入 → 发布同一迁移 pending（入口升级为 v2，使旧工具拒绝）→ 保存终态 receipt → 替换当前选定 manifest → 提交最终 v2 项目入口并清 pending → 读回原活动交接及转换结果 → 释放本次锁。

receipt 放在 `.mendi/runs/<delivery>/NNN-delivery-migrate/`，不赋给当前轮 `deliveryRunRef`，不替换 binding 的 latestRunRef、原 Action / actor / draft 正文或原正式失败 / 成功指针。manifest 的 `migrationRunRef` 保存该格式事实与旧编号边界；当前 next 仍从原协作对象解释。项目累计归档数、其他 manifest 及所有旧已提交文件不变。

写前拒绝不占号；提交后失败保留本次号、锁、临时文件与已写路径。仅在 Owner 明确核对写者和锁处置后，由原 actor 对明确 receipt 显式 resume：若 intent 已写而 pending 尚未发布，必须核对原入口 / 目标 / 输入仍匹配且无其他 pending，才补本次原 pending；其后只补缺失提交。不得从历史最大号猜对象，不重新计算不同轮次或重跑业务。

同次完整 resume 在目标仍为本次结果时返回 already-completed；后续实际工作已改变目标则拒绝陈旧恢复。普通 apply 发现目标已经迁移时只读返回 already-migrated，不再占号。没有原始 intent 的不完整现场只能诊断，不能推测补造。

## Risks / Trade-offs

- 新格式阻止旧工具继续使用 → 稳定切换前预览并确认目标状态，保留原包；旧 pending 必须先旧版恢复。不得自动降级 / 安装旧包或使用旧工具继续新工作。
- 保留顶层投影可能漂移 → 一处生成并校验，所有写者共用；对矛盾负例直接拒绝，禁止双来源写入。
- 已有 draft 迁移容易丢交接 → 转换只改必要表示，验收逐项检查身份、actor、正文、固定 Author、当前选择和后续继续，不把迁移收据当新阶段。
- 跨 Delivery 依赖扩大读取面 → 限同一项目登记索引和指定直接 Close，按旧完成编号核对，不递归来源依赖 / 审核 / 日志，不迁移来源。
- 旧记录可能没有足够历史 → 明示 legacy 来源和真实缺口；旧 product 普通查询保持可用，迁移缺口不通过“补一个字段”修正。
- 新 roundId 与旧缺省合同并存 → 只在明确旧编号边界允许解释，全部新正式对象核对轮次，旧单次执行 outcome 和日志不变。

## Migration Plan

1. Apply 在新隔离 product 场景实现 v2、v1 只读、受控迁移和相关方法；根 manual-bootstrap 与 DreMo 均保持。
2. 按 tasks 验证真实调用、跨进程读回、旧格式 / 活动 draft、跨 Delivery 基线和提交边界故障；不把 Explore 的旧行为 proof 视为新模型验收，不重放不受影响历史。
3. 经过独立 Review Apply、按授权 Archive 后，进入 D04 的 B / C 与整体出口；本 Change 不单独发布半套测试聚合合同。
4. 到 D04 发布边界，再确定包版本、明确源码 / 包来源、稳定安装检查及目标迁移预览；真实安装和目标迁移各自授权。预览发现旧 pending 时先由旧版在原授权 / 恢复边界处理。
5. 不提供已发生新轮工作后的自动降级：v2 不能被旧工具安全消费。上线前失败保留旧安装与目标原件；迁移中断走同次恢复，完成后发现问题保持现场并按实际影响处理，不能用复制旧 manifest 丢弃新增历史。
