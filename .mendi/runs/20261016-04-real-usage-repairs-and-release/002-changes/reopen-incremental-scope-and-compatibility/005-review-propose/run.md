---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: reopen-incremental-scope-and-compatibility
planningSlot: MVP-D04-A
batchId: 002-changes
actionId: reopen-incremental-scope-and-compatibility-review-propose-01
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "005"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: proposal-approved
nextAction: apply
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-16
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/004-propose/run.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/004-propose/run.md
---
# MVP-D04-A 独立 Review Propose

Owner 本会话指令为 `review-propose`，沿用明确的 Reviewer 角色。固定审核对象为 [004 Author Propose](../004-propose/run.md)及当前 Change 的 proposal、design、tasks、三份 delta specs。结论：**approved**，无阻断发现；允许交接 Author Apply，未确认任何新能力已经实现。

## 实际方法与范围

读取稳定安装的 `skills/actions/review-propose/SKILL.md`，核对 AGENTS、当前 manifest / context、已批准的 [003 Review Explore](../003-review-explore/run.md)和 004 的直接产物。稳定 CLI status 确认 manual-bootstrap、review-propose / reviewer，固定 Author 为 004。本次按项目既有人工记录方式保存审核及 next，未调用不支持该格式的产品写命令或伪报 submit 成功。

对六份规划文件逐项审核，并按影响读取现有 records / batches、workspace、project、delivery-runs、lifecycle-store 与 Archive 记录解析，以及相关主规格。未将旧 Delivery artifacts、生成物或全部历史纳入审核；未使用 OCR。003 的现状实验仍可支撑现状判断，本次没有重放旧 proof，也不以其通过替代新格式运行证据。

004 记录的四项新 Owner 决定作为正式交接输入核对：完整 open / closed 及活动 draft 可迁移；同项目跨 Delivery 的 product 基线纳入；manual 仅说明；旧 pending 先旧版恢复、新版不提供旧格式恢复例外。它们均已落到方案和验证任务，未发现与 002 / 003 已确认兼容决定冲突或需要再次由 Owner 选择的产品分歧。

## 语义审核结果

| 重点 | 判断与对应任务 |
| --- | --- |
| 范围权威与旧工具 | v2 入口 / manifest 阻止旧读者继续按顶层写入；rounds 权威、顶层统一投影且拒绝矛盾，Delivery 首次日期和历史身份保持。任务 1.1–1.3、3.1–3.4 覆盖双首次入口、跨轮唯一槽位、同日多轮及恢复。 |
| 当前与历史消费 | 当前轮驱动 bind / Action / Archive / formal / repair / Close；新轮没有自己的旧 PASS 指针，旧指针保存于原轮。历史 status 不改变选择、不调用历史 Change。任务 2.1、3.3、5.1–5.3 覆盖真实 CLI、跨进程及跨轮错误对象。 |
| 旧格式读取与写入 | 兼容读与新格式写 gate 分开，明确列出普通 Run、test、Archive finish、生命周期 resume 等容易遗漏的写者；v2 项目下其他 v1 Delivery 保持只读。任务 2.2 / 2.3 要求写前与锁内复核，并验证占号 / 原生调用 / 命令前拒绝。没有仅改 Reopen 的漏洞。 |
| 活动工作迁移 | 迁移收据不替换当前 deliveryRunRef、binding.latestRunRef 或 draft；通过明确迁移编号边界解释旧记录，新记录必须满足新归属。普通完整 draft 与未确认执行 / 原生效果分开。任务 6.3、7.2 要求保留身份、正文、actor、固定 Author 和原阶段继续。 |
| 跨 Delivery 基线 | 限同项目登记 product，指定 slot 和 Close，核对 archived binding 与直接完成快照；不要求来源仍为 closed、不要求旧 ordinal 等于项目总数、不迁移来源、不读来源活动 status 或递归旧日志。任务 4.1–4.4、5.2 同时覆盖 v1 / v2、manual 拒绝、后续 Reopen 和实际 CLI 接线。 |
| 来源充分性 | 只读 preview 不占号、不创建文件或调用上游。直接范围 / 前态 / Close 支持 legacy-baseline；合法尚未 Close 首轮保持 open，真实缺口或历史归属冲突仍拒绝。任务 6.1 / 6.2 既有成功也有缺口、矛盾和陈旧输入负例。 |
| 提交与恢复 | 锁内重算预览、保存 intent / 前态、发布 v2 pending，再完成 receipt / manifest / index；区分旧操作恢复与本次新迁移恢复。无 pending 的明确迁移 intent 有专门恢复条件，无 intent 不猜补；任务 7.1–7.4 覆盖必要提交边界、原输入变化、错 actor、重复及陈旧恢复。 |
| 验收与范围 | baselineFacts 是本次直接准入快照，Close 消费当前正式结果、声明和材料适用性；不把来源计作新完成项。现行同轮修复后独立审核及新整次执行保持，B 的组合政策未提前实施。任务 5.3、8.1 明确真实集成与根工程回归，不冒充根正式 Full Test。 |

三份 delta 对既有 requirement 的改写与新增行为相互一致。原 project-entry 的显式目标、本地必要输入和上游按需约束仍适用；迁移的 local-only 行为已在 design 和任务 6.2 / 8.2 具体规定，不需复制一份近似 capability。普通测试的工具 / 依赖检查合同继续保留，新增写 gate 不等于放宽预检或自动安装。

任务按模型、入口、生命周期、基线、验收、preview、迁移提交和整体接线分组，各组包含自己的测试及方法说明；最后组承担集成检查。需继续扩展的解析 / 转换 / 提交职责已经要求先分开，不用纯转发层压行数。27 项全部未勾，Archive / 发布等后续动作保持 workflow follow-up，不混入实施完成统计。

## 验证与证据

- 独立运行固定 OpenSpec 1.14.1 `validate reopen-incremental-scope-and-compatibility --strict --json`：exit 0，valid=true，issues=[]，见 [validation](artifacts/validation.json)。
- 重新读取实际 `instructions tasks`：D:/Projects/MenDi、repo-local / spec-driven、specs 与 design dependencies 均 done，核对逐任务可验证、同组测试 / 文档和 workflow follow-up 约束，见 [tasks instructions](artifacts/tasks-instructions.json)。
- 逐项比对 12 个 MODIFIED requirement 均有对应主规格，原场景名全部保留；核对 27 项任务未完成，见 [planning check](artifacts/planning-check.json)。名称 / 数量检查仅辅助定位，不是语义批准依据。
- `git diff --check` 通过。本次为规划审核，产品源码、测试、依赖与 proof 入口没有新变化，未重跑 `pnpm check` 或行为测试；003 的工程结果按其原适用范围保留，不宣传为新能力验证。

## 实施注意与停止边界

没有需退回修订的阻断项。Apply 需按既有任务实际验证旧 draft 的后续保存 / 提交、Archive prepared / none 的正确继续、新 roundId 与旧边界，以及已部分替换的迁移前态 / 后态恢复；不能只靠解析单测或 preview 成功认定兼容完成。这些是方案内的验证义务，不另增审核 gate。

本次只新增 005 审核 Run / artifacts，更新当前 manifest、README 和 context；004、此前 Run / verdict、六份方案文件及主规格未改。未修改产品实现、DreMo 或稳定安装，未运行实际目标迁移、根正式 Full Test / Close、Archive 或 Git 写操作。B / C 未激活，累计成功归档仍为 10。

下一步：`apply / author / awaiting-instruction`。本 Reviewer 停在此处，不切换 Author。
