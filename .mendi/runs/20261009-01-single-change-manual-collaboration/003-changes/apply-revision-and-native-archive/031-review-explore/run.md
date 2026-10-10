---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
actionId: apply-revision-and-native-archive-review-explore-01
actionType: review-explore
role: reviewer
run: "031"
status: completed
result: approved
date: 2026-10-10
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/030-explore/run.md
---

# MVP-D01-D Review Explore

**verdict：approved。** 独立审核 [030 Explore](../030-explore/run.md) 的实际分析、TypeScript proof、原始结果与维护判断，并在新沙盒重放 D01–D08。关键事实足以进入 Propose，未发现阻断项；批准的是探索依据，不是产品 Archive、Owner 回退或恢复实现。

## 独立核对

- 当前目标为 Owner 已激活的 MVP-D01-D，030 明确记录原始授权与范围。本 Change 仍只有原生 scaffold；分析在 Run，未提前生成方案或实现。对照当前 Git 基准，src、tests、产品 Skills、AGENTS、主规格及 C proof 未改，既有适用结果可以沿用。
- D01：真实 Apply instructions 的 contextFiles 是按 artifact 分组的具体路径数组，另有 tasks / progress / state / instruction / operationGuidance；ready、缺 tasks 的 blocked 和 all_done 均重现。Archive instructions 只有目标、root、context 与 operationGuidance，不具备 artifact template / outputPath，也不提供独立批准。当前产品拒绝 Apply artifact 请求，确认需要单独的操作协议。
- D02–D03：现有 Apply continuing 保持 Action；修改要求后的 revise 及 approved 后再次 revise 均回到新 Review Apply，陈旧 Author 审核拒绝，直接旧记录保持。当前 Apply Owner 处置和跨阶段普通 revise 拒绝；这证明现状与缺口，不宣称新回退行为已经成立。复核 core 阶段判断与产品记录约束，与实验一致。
- D04–D05：真实原生 Archive 同步一项新增需求并移走活动目录；随后受控 EISDIR 保留旧 manifest，查询报 incomplete-mendi-state。对已归档目录安全加编号保持 metadata，当前 product 格式仍拒绝 archived binding。执行、编号、本地交接和查询必须在 D 中共同收敛，不能仅加工具调用或补建旧活动目录。
- D06–D08：目标冲突和无效 delta 在对应实验中均非零退出，保留原材料且未写主规格；原生 --yes 确实能归档未勾任务。因此产品必须核对当前有效批准和完成条件，不能以工具成功代替。独立阅读固定安装的 Archive 失败分支，确认另有回滚与回滚失败路径，不将本次两个同步前失败推广到全部故障。
- D04 的本地写失败发生在实验候选路径，调用次数断言仅说明此轮实验调用一次；它没有测试产品重试实现，也没有覆盖原生内部部分回滚。030 已准确列出这些限制，后续 Propose / Apply 必须设计并验证对应行为，无需提前完成全部产品验收。

## 维护判断与方案衔接

认可 030 对路线图维护待办的明确处置：C 的 678 行 proof 限定保留，不追加 D 场景或继续扩写候选保存；D 将继续扩展的 application/actions.ts 应先按普通记录、指引、Owner 处置分离实际职责，Archive 独立承接外部效果与本地交接。既有测试保留其行为领域，D 的归档 / 回退测试另按场景组织，不向 C 的完整规划流程堆叠。

新 D proof 为 487 行，未复制 C 的持锁 worker 或候选业务实现，当前用途明确；后续产品验收进入 tests，若继续扩展此实验，应先区分 Apply 记录流与 Archive 效果组。没有仅因行数判定失败，也不把保留长文件解释为可无限增长。Propose 须把 §5 的三类目录前三名及维护判断落实为 AGENTS / Review Apply 方法任务。

Propose 还应将 030 已指出的边界写成明确任务与场景：

1. 按实际 Apply / Archive 输出分别约定必要字段和路径检查；Archive 输出没有 schemaName 时，从实际需要的上游状态核对，不臆造字段或递归读取历史 Ref。
2. Owner 回退明确当前状态、目标阶段和直接 Author，保留旧 verdict，经目标阶段的新审核后按顺序继续；不自动删除产物、回滚实现或复用过去批准跳过阶段。
3. 原生归档前核对当前批准与任务；归档后本地失败的显式收口仅处理当前操作，区分原生未执行、已发生效果和无法确认，不重复同步。复核实际原生目录与编号目标，不能只凭旧预定日期或非零退出推断效果。
4. 用定向故障与重复调用测试证明本地收口不重复调用原生 Archive、累计计数不重复增长，归档查询不依赖已移走的活动目录；复杂未知现场保留错误，不发展为通用恢复平台。

这些是进入方案阶段需收敛的任务，不要求新增 Explore 修订或改写 030。

## 验证与限制

| 本轮独立命令 | 结果 |
|---|---|
| `pnpm build` | exit 0；独立 proof 使用本轮构建 |
| `node scripts/proofs/mvp-d01-d-explore.ts --output .tmp/review-d-explore-proof` | exit 0；8/8，52 次真实子进程（44 次成功、8 次预期拒绝）；[报告](artifacts/proof/report.json)、[完整调用](artifacts/proof/commands.json) |
| `pnpm check` | exit 0；格式 / lint 各 38 文件，实现、脚本和测试 TypeScript 检查通过；[日志](artifacts/check.log) |
| 固定 OpenSpec `instructions apply --change apply-revision-and-native-archive --json` | exit 0；当前真实状态 blocked，尚缺规划材料；[结果](artifacts/current-apply-instructions.json) |
| 固定 OpenSpec `instructions archive --change apply-revision-and-native-archive --json` | exit 0；只有实际操作指导，不含批准；[结果](artifacts/current-archive-instructions.json) |

030 的 32/32 定向回归日志已核对，产品实现未变，本轮沿用而未重复执行；前序 C 的适用验证继续保留。没有当前 delta，故不以空 scaffold 的 strict validate 作为审核依据。本轮没有做正式 Delivery Full Test。

独立实验只归档可重建沙盒；必要输出已复制进本 Run artifacts，临时路径只是当次运行位置。未覆盖任意掉电、全部上游回滚点、产品恢复或真人身份认证，不将夹具 verdict 当作当前 Change 批准。

## 交接

下一步为 Author Propose，等待明确指令；当前 Delivery 保持 open，累计归档数仍为 3。Reviewer 仅保存本审核和当前交接，不修改实现、proof、旧 Run / verdict，不执行 Propose、当前 Change Archive、Git 或下一 Change 激活。
