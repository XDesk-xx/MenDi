---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: reopen-incremental-scope-and-compatibility
planningSlot: MVP-D04-A
batchId: 002-changes
actionId: reopen-incremental-scope-and-compatibility-explore-01
actionType: explore
role: author
actor: codex-author
run: "002"
status: completed
actionStatus: completed
outcome: complete
result: proof-supported
nextAction: review-explore
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-16
stageSkillRef: skills/actions/explore/SKILL.md
upstreamSkillRef: .agents/skills/openspec-explore/SKILL.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/001-delivery-open/run.md
---
# MVP-D04-A Author Explore

Owner 原始授权：owner 授权激活 MVP-D04-A「Reopen 增量范围与兼容」，开始 explore。保持 Author，只针对必要疑点做真实 proof，不提前实现，不修改 DreMo 或稳定安装；完成后停在独立 review-explore。

## 激活、方法与范围

源码与工作起点为 `982159b42d7b6ce88dea0ebf178e13d75514adae`，分支 `delivery/20261016-04-real-usage-repairs-and-release`；开始前工作树干净。实际采用固定 OpenSpec 1.14.1 的 `new change reopen-incremental-scope-and-compatibility` 创建 scaffold，并读取真实 status 和 proposal instructions，见 [激活命令](artifacts/activation-commands.json)与[规划背景](artifacts/proposal-instructions.json)。目标 root 为 `D:/Projects/MenDi`，schema 为 `spec-driven`；只有 `.openspec.yaml`，未写 proposal / design / specs / tasks 或 Change 级 explore.md。

本次实际读取当前稳定安装的 `skills/actions/explore/SKILL.md`、目标 `.agents/skills/openspec-explore/SKILL.md`（generatedBy 1.14.1）及项目 OpenSpec 工具指导。人工 bootstrap 不支持产品 Action 写入，本次沿既有人工方式保存激活、批次、Author Run 和 next；没有伪造 `action start / instructions / submit` 的产品成功。真实规划背景通过固定 OpenSpec 公开 CLI 直接取得。上游的通用探索限制按 Owner 已明确授权的 Change 激活、必要 proof 与 Run 交接适用，不提前实施产品行为。

项目 context 要求中文、唯一根路线图、按影响验证与历史保留；本轮只细化路线图 §7 MVP-D04-A 的必要疑点，B 的同轮结果组合与 C 的方法改进不纳入。读取现有 `delivery-lifecycle`、`delivery-workspace`、`delivery-verification` 规格及 `project-entry` 的相关格式 / 目标约束；不另造近似能力或提前定稿 delta。现行规格仍是已发布合同，本 Run 的候选不改变它。

新 Delivery 的首个 Change Run 为 `002`，批次 `002-changes`，只绑定 MVP-D04-A。B / C 未激活，累计成功归档仍为 10。修改前当前 manifest 仅保存一份 [before-manifest](artifacts/before-manifest.json)；不复制旧 Run 或 DreMo 证据树。

## 必要疑点与实测

可重建入口为根 `scripts/mvp-d04-a-explore.ts`，使用当前 `src` 的真实产品函数和既有受控测试准备；CLI 读回使用仓库 `dist`。现有 A/B 夹具代表已交付基线，新输入真实使用 P10/P13，不声称对 DreMo 的 P09/P10-L 做过操作。夹具的阶段批准是明确的记录输入，真实 Full Test 命令、Close、Reopen、bind、首次 Explore Run 和新进程查询均发生在新建隔离目录；它们不是本 Change 的实际 Reviewer 批准，也不是根 D04 的正式 Full Test。

| 疑点与目的 | 实际方法和结果 | 对方案的影响与限制 |
| --- | --- | --- |
| Reopen 覆盖了什么 | 在受控 producer / consumer 场景真实 Full Test passed、真实 Close 后执行 Reopen P10/P13。新顶层 scope 只剩 P10/P13；Delivery ID、首次日期、旧 binding / batch、Full Test / Close 引用保持。 | 问题是历轮范围缺少明确持久化表达，不是旧绑定 / 收口记录被删；不能只改文案。 |
| 直接保留旧槽位或跨轮 dependsOn 能否解决 | 把旧槽位并入新 scope，返回 `invalid-scope / 新一轮不能复用旧绑定槽位`；让 P10 dependsOn 旧 A，返回 `invalid-scope / 依赖指向范围外槽位`；两者均未占号且 manifest 原字节保持。 | 简单数组拼接不可用；Propose 必须区分本轮工作依赖与已交付基线，不能让旧项成为新待完成项。 |
| 旧 PASS 是否被自动消费 | 原正式结果仍为 passed，但 scopeMatch=changed；Reopen 默认 next=change-bind，不显示本轮 verification；以旧正式入口 Close 被 `delivery-state-conflict` 拒绝，新范围完成检查也拒绝。 | 沿用现有旧 PASS 拒绝方向；新增轮次归属仍须贯穿正式执行、修复与 Close，不能仅因旧 outcome=passed 放行。 |
| 当前轮工作是否误用旧批次 | 显式 bind P10 时 currentBatchId 仍为 null；首次实际 Explore 才新建 `018-changes`。原批次及原 Full Test / Close 文件原字节保持。 | 复用现有延迟建批次机制，不新增轮次目录或移动旧 Run；历史归属必须另外可核对。 |
| 直接历史材料和普通查询的边界 | 从 Reopen 的直接 before-manifest 恢复原 scope；仅在隔离目标暂移该输入后，普通 status 仍成功，而显式同一 Reopen resume 报 `incomplete-mendi-state`；finally 恢复原文件。 | 缺少迁移确需材料只阻断迁移 / 对应操作，不提升成普通查询 gate。此负例不是迁移预览实现。 |
| 在 v1 加候选字段是否已有效 | 给合法 v1 结构加入与顶层矛盾的 rounds / currentRoundId，现有解析器仍选顶层 scope；formatVersion=2 被当前解析器明确拒绝。 | 不能手改目标添加“新字段”后声称修复。推荐版本化新模型并同时修改必要读写者，使旧工具拒绝不认识的新格式。 |
| 人工格式与早期 product 的兼容边界 | 隔离 manual-bootstrap 直接输入可查询，生命周期写入报 `manual-state-read-only`，查询 / 拒绝后入口和 manifest 原字节保持；真实旧 product 夹具无 openRunRef，但直接 before-manifest 和真实 Close 可核对旧范围。 | 不自动迁移人工历史；不能把新版本的 Open Run 字段追补成所有旧记录的必要输入，迁移来源须如实区分。 |

详细观测见 [proof result](artifacts/proof-01/result.json)、[命令原始回执](artifacts/proof-01-command.json)与[旧格式来源观测](artifacts/legacy-baseline-observation.json)。隔离真实正式结果的直接读回和原始 stdout / stderr 已另存为 [fixture formal result](artifacts/proof-01/fixture-formal-result.json)、[stdout](artifacts/proof-01/fixture-full-stdout.log)、[stderr](artifacts/proof-01/fixture-full-stderr.log)；不只留在 `.tmp`，也未复制整个夹具历史。夹具输入由现有 tests、fixtures 和新 proof 脚本重建。

## Owner 已确认的兼容决定

在上述事实调查中通过当前会话主动澄清，未以等待或工程判断代替 Owner：

1. 旧 product 在未显式迁移前：Owner 选择“建议：旧格式继续可查询，写操作要求先预览并显式迁移，避免继续覆盖范围”。因此新版本应保留旧格式只读查询，写入必须先完成独立授权的迁移；这里没有授权实际迁移任何目标，也不声称现有稳定包已经实施此限制。manual-bootstrap 不自动迁移。
2. 首次 Open Run 缺失但直接材料充分：Owner 选择“建议允许：直接范围与收口充分时标明旧来源，缺口明确拒绝”。因此允许把可核对范围明确标为“旧格式基线”，保留真实来源，不补造 Open Run；材料不足或矛盾仍拒绝迁移。可识别的旧基线不代表能够证明未知更早轮次；预览必须明示重建边界，不能猜造旧轮或把未知历史宣称完整。

这两项是已确认的产品选择，不需下一阶段重新索取同一决定；未来实际目标迁移写入仍须单独明确授权。

## 候选比较与 Propose 收敛建议

| 候选 | 判断 |
| --- | --- |
| 在原 scope 并入旧槽位，其他逻辑不改 | 实测违反现有唯一绑定 / 新槽位准入；也会把历史成果重新放入本轮完成集合，不采用。 |
| v1 仅追加 rounds，继续让顶层和新数组独立可写 | 实测旧读者忽略新字段，可能继续覆盖当前范围；存在两个权威来源，不采用。 |
| 明确新格式，统一历轮范围与当前轮选择；提供 v1 只读及授权迁移 | 推荐候选。现有记录化 open/reopen、直接基准、批次和正式收口已提供可复用身份与来源，无须重建通用历史平台。具体字段 / 版本值、命令形态及关系归属由 Propose 收敛，不把本 Run 的候选名当合同。 |

推荐方案至少需要共同解决：

- 一个权威的历轮范围模型和当前轮选择；首次 open 与每次 reopen 都有稳定来源。同日多次不能靠日期区分，可复用已有生命周期 Run 身份或选取等价稳定标识；不增加轮次目录。当前顶层字段若保留，只能由统一逻辑生成投影，并检测与权威范围的矛盾。
- query、bind / Action / archive、批次选择、verificationScope、正式测试 / repair / Close 共同消费当前轮；历史范围与收口按需直接查询，不在 next 堆积历史。不向旧 submitted Run 添加新必填字段，已有 v1 结果通过明确归属关系读取；不能只改 Reopen 写入点。
- 跨轮依赖以已交付能力为基线，当前轮 dependsOn 仍用于当前待完成工作。采用必要的直接身份核对，不重复绑定旧槽位，也不让历史已交付能力变成本轮新增义务；最终表示和准入在 Propose 明确。
- 旧 product 读取、迁移 preview 与实际写入分开。仅读取重建各轮实际所需的直接 open/reopen、scope / before-state、Close 和关联材料；充分旧来源可明示为 legacy baseline，真实缺口报具体问题。不得扫描所有历史正文、添加全库 hash 或递归未知 Ref 前置。
- preview 应说明目标、来源、已知范围 / 轮次、当前选择、关联及验收归属和实际差异。授权写入重新核对预览所用直接输入、当前身份 / 路径和冲突，保留旧 Run / verdict / 日志 / 归档编号。旧格式新写命令的迁移要求按 Owner 决定统一施加，不能只在 Reopen 提示而其他写者继续改旧格式。
- 复用项目锁、原操作占号、pending 与本地显式 resume 的有界机制。迁移及新 Reopen 必须覆盖中断 / 重入、同日连续轮次，不能在恢复时重复追加轮次或改已提交终态。当前实现可参照 `src/adapters/lifecycle-store.ts` 与现有 `tests/lifecycle-writes.test.ts`，这属于代码调查和既有测试覆盖位置，不声称本轮重跑过其完整矩阵。
- A 只建立轮次归属与兼容基础，不决定 B 的同轮多次执行组合、候选汇总结论或改变现行“修复后新整次执行”合同；不借 A 的旧格式兼容绕过当前验收要求。

预期规格落点为现有 `delivery-workspace`（格式、查询、关联、批次）、`delivery-lifecycle`（open/reopen/close/恢复、显式迁移边界）与 `delivery-verification`（轮次归属和旧结果消费）；`project-entry` 是否需 delta 取决于最终 CLI / 格式协议。代码调查的直接影响面为 `core/records.ts`、`core/lifecycle-transition.ts`、`core/associations.ts`、`core/batches.ts`、`core/delivery-verification.ts`、相关 application / adapters、CLI 输出与参数、自有方法和场景测试。正式规格与文件划分仍由 Propose 决定；没有在 Explore 提前拆出迁移平台或编码方案。

## 验证、限制与交接

- `node scripts/mvp-d04-a-explore.ts <当前 Run artifacts 下的新目录>`：exit 0，8 组有断言的实际观测；核心事实来自产品调用 / 新进程读回，不是字符串 sentinel。首次执行没有失败；未重复运行长链以凑统计。原始回执和必要直接日志见上。
- `pnpm check`：exit 0，140 个维护文件格式 / lint 通过，src / scripts / tests 的 TypeScript 检查全部通过，见 [engineering check](artifacts/engineering-check.json)。新增 `.ts` proof 纳入既有 scripts 真正类型检查，未改检查配置；此前显式 `pnpm typecheck` 也通过，不据此声称产品修复通过。
- 本次未修改 `src/`、现有 tests / fixtures、产品 Skills、主规格、包版本或稳定安装。新增的是受控探索脚本、scaffold 与本 Run / artifacts，并更新当前 manifest、README 和 context 的协作状态。未读写 DreMo 当前记录，未执行目标迁移、根正式 Full Test / Close、Archive、Git、安装或清理；隔离 proof 的目录保留，不作为唯一必要输入。
- 未实现或验证新格式的迁移成功 / preview 准入、连续同日多轮、新格式 cross-round PASS 绑定和中断恢复矩阵。这些明确留给后续受审设计与 Apply 场景验收；当前结果只确认现有行为及方案必须处理的边界，不能写成新能力 PASS。
- 上游保持 proposal ready，design / specs / tasks blocked。Author 结论为 `proof-supported`，无 verdict；下一步仅独立 `review-explore`，固定对象为本 `002-explore/run.md`。Reviewer 核对 Owner 两项决定、上述实际 proof 和限制，不从工具成功推导批准，不自动进入 Propose。
