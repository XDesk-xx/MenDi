---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: reopen-incremental-scope-and-compatibility
planningSlot: MVP-D04-A
batchId: 002-changes
actionId: reopen-incremental-scope-and-compatibility-propose-01
actionType: propose
role: author
actor: codex-author
run: "004"
status: completed
actionStatus: completed
outcome: complete
result: planning-ready
nextAction: review-propose
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-16
authorExploreRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/002-explore/run.md
reviewExploreRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/003-review-explore/run.md
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-propose/SKILL.md
---
# MVP-D04-A Author Propose

Owner 阶段指令：propose，关键问题向我提问。

## 直接输入与方法

固定输入为 [002 Author Explore](../002-explore/run.md)及[003 独立 Review Explore](../003-review-explore/run.md)。003 verdict=approved、固定 Author 为 002、独立 actor 与 Author 不同；本会话继续保持 Author，不执行 Reviewer 工作。此前已确认的旧 product 查询 / 写入边界和充分 legacy baseline 决定直接承接，不重问、不改旧 Run。

当前基准仍为 `982159b42d7b6ce88dea0ebf178e13d75514adae`、分支 `delivery/20261016-04-real-usage-repairs-and-release`；前序 Explore / Review 的未提交文件保持。当前阶段首个 Run 是 004，沿 `002-changes` 既有批次，不重建 Change 或另开编号。manual-bootstrap 沿既有人工方式记录阶段，不伪报产品 action start / save / submit 成功。

实际读取稳定安装的 `skills/actions/propose/SKILL.md` 和目标 `.agents/skills/openspec-propose/SKILL.md`（generatedBy 1.14.1）。固定 OpenSpec context / list 确认 root 为 `D:/Projects/MenDi`、repo-local / spec-driven。当前 Change 已绑定，因此跳过 new change；按真实 proposal → specs / design → tasks 指引与完成依赖编写产物，未跳过任何 artifact。实际指引与阶段状态保存在本 Run artifacts，起点见 [start commands](artifacts/start-commands.json)。

已复核项目 context、根路线图 D04-A、相关主规格及当前 scope / 关联 / 批次、生命周期提交、正式验收、Action / Run 和普通测试写入口。中文、历史保留、不自动安装、按操作确定输入及不增加轮次目录约束具体落实到产物和任务；未复制 context 为方案正文。新模型没有实施，现行产品行为不因本文改变。

## 本阶段 Owner 关键决定

依赖顺序提问并等待当前会话实际答复，未以沉默作为选择；字段命名和内部模块等可逆技术细节由 Author 收敛。

| 问题 | Owner 实际答复 | 方案落点 |
| --- | --- | --- |
| 旧格式写入须迁移，是否支持已有活动 Change / draft 的项目 | 支持完整的 open / closed 记录，保留活动 Change 和 draft | 不强迫先 Close；区分正常 draft 与 pending / 未确认执行，迁移收据不替代原协作交接 |
| 已交付依赖只做同 Delivery，还是支持跨 Delivery 的结构化核对 | 同轮次修复一起支持跨 Delivery 的结构化依赖核对 | 纳入同项目已登记 Delivery 的 product 来源；直接来源核对，不建递归依赖调度平台 |
| 跨 Delivery 结构化依赖是否接受 manual-bootstrap | 按建议：product 可核对；manual-bootstrap 只作说明 | v1 来源可只读核对完成 / Close，不强制迁移来源；人工事实不自动满足硬依赖 |
| 新版是否为旧 pending 保留受控 resume 写入例外 | 不保留例外：必须使用旧版恢复完成，再由新版迁移 | 新版所有旧格式普通写入、旧 resume / finish 都拒绝；旧中断先用旧版在原恢复授权边界处理 |

002 / 003 已确认的两项决定仍适用：旧 product 可只读查询，写入先预览并显式迁移；充分旧范围与收口可标明旧格式基线，不补造 Open Run，真实缺口或矛盾拒绝。以上产品选择不授予本阶段实际迁移、安装、恢复或实施权限。

## 正式产物与收敛结果

- [proposal](../../../../../../openspec/changes/reopen-incremental-scope-and-compatibility/proposal.md)：明确本轮修复、formatVersion 2 与旧格式写入兼容变化、跨 Delivery 基线及不发布 / 不操作目标的边界。
- [design](../../../../../../openspec/changes/reopen-incremental-scope-and-compatibility/design.md)：确定单一权威 rounds / currentRoundId、受校验的顶层投影、唯一槽位 / binding / batch 归属、新正式记录 roundId 与明确旧记录编号边界；迁移复用锁、占号、pending 和文件提交原语。
- 三份 delta 位于当前 Change 的 `specs/delivery-workspace/`、`specs/delivery-lifecycle/`、`specs/delivery-verification/`：共修改 12 个已有 requirement 并保留其全部原场景，新增 8 个必要行为 requirement。未新增近似 capability 或改主规格。
- [tasks](../../../../../../openspec/changes/reopen-incremental-scope-and-compatibility/tasks.md)：8 组、27 项待实施任务，按模型 / 查询写入 / 生命周期 / 基线 / 验收 / 预览 / 提交恢复 / 当前接线安排。每项包含可核对完成方式，测试和必要方法与各组同时落地；后续实际审核 / Archive / 发布作为普通 workflow follow-up，不勾成实施完成。

关键技术选择：

1. 新项目 / manifest 采用 v2 阻止旧读者忽略新字段继续写入；历史 Run / 测试结果不机械改版或补写。范围只在 rounds 中权威保存，所有保留顶层字段统一投影；新轮顶层不再假装保有旧轮“当前” Full Test / Close。
2. Action / Archive 通过唯一槽位绑定和批次定位轮次，不给所有旧记录重复加字段；新的生命周期 / formal / repair 明确所属轮，旧记录只在迁移边界内唯一映射。迁移收据作为格式来历与边界，不成为当前业务进展。
3. baselineDependencies 使用同项目登记 Delivery、planningSlot 和指定 closeRunRef 核对已交付 product 事实；普通 query 不展开来源，必要消费只读直接完成事实，不借来源后来 Reopen 或累计数增长判旧完成无效，不递归来源旧审核 / 日志。
4. 迁移只改当前选定 manifest 和必要入口；其他 Delivery 文件保持原样，旧 / 新混合登记可读。完整活动 draft 保留原 actor / Action / 正文与当前 next；旧 pending / 未确认执行须旧版恢复，不留新版旧格式写例外。
5. preview 不占号或写文件；apply 从实际直接输入重算并锁内复核，不信任被改写的预览候选。新迁移意图 / pending 的中断只按明确原 receipt 继续，不从最大号猜、不重复追加轮次或改终态；没有 intent 的现场不推测恢复。
6. A 不改变现行同轮失败修复后新整次执行合同；B 的聚合政策、D04 包版本和实际发布仍在各自边界。跨 Delivery 的新行为尚未实施或通过运行验收，不能沿用 Explore 的现状 proof 宣称已经支持。

## 验证与限制

- 固定 OpenSpec `validate reopen-incremental-scope-and-compatibility --strict --json`：首次及最终均 exit 0，最终 valid=true / issues=[]，见 [final validation](artifacts/validate-final.json)。未通过移除场景或缩减 scope 消除提示。
- OpenSpec status：proposal / specs / design / tasks 全部 done，planning complete；这里只说明产物齐备，不表示 Apply 完成或 Reviewer 批准。所有 27 个 tracked task 均为未完成。
- 已从实际主规格逐个核对 MODIFIED requirement 名称和原场景保留，核对 3 个 capability、全部任务未勾及无模板占位，见 [planning consistency](artifacts/planning-consistency.json)。该辅助检查不代替方案语义审核。
- 本次只有规划产物及必要 Run / manifest / README / context 状态变化，不运行行为测试或再跑已有效的工程回归；未修改实现、既有测试 / proof 脚本、产品 Skills、主规格、路线图、三份反馈原件、包版本或稳定安装，未操作 DreMo、Git、根正式 Full Test / Close 或 Archive。
- 新模型的成功迁移、draft 后续继续、跨 Delivery 直接核对、连续同日多轮和恢复故障仍是 Apply 场景。方法文本或 strict validation 不构成这些行为的证据，旧失败与 approved 保持原样。

## 交接

Author 结果为 `planning-ready`，无 verdict，保持 Author。下一步仅独立 `review-propose`，固定审核对象为本 004 Run 和当前 Change 的六份方案文件（proposal / design / tasks / 三份 delta）。Reviewer 应核对四项新 Owner 决定与两项承接决定、全部写入口的兼容边界、直接基线读取范围及迁移交接 / 恢复语义。未激活 B / C，不自动 Apply。
