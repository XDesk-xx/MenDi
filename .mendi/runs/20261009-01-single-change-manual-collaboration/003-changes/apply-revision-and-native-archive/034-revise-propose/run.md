---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
batchId: 003-changes
actionId: apply-revision-and-native-archive-revise-propose-01
actionType: revise-propose
role: author
run: "034"
status: completed
result: planning-ready-for-review
date: 2026-10-10
stageSkillRef: .agents/skills/openspec-update-change/SKILL.md
revisesRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/032-propose/run.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/033-review-propose/run.md
nextAction: review-propose
nextRole: reviewer
---

# MVP-D01-D Author Revise Propose

Owner 当前指令 `revise-propose`，直接依据 [033 独立 Review Propose](../033-review-propose/run.md) 的 changes-requested / RP-D-001，对 [032 Author 方案](../032-propose/run.md) 做局部修订。保持 Author，不重做 Explore、不进入 Apply、不自行给 Reviewer verdict。

## RP-D-001 的局部处理

选定已有显式 `action archive --mode finish` 作为中断后观察并重新分类的入口：

1. 原写者及可能启动的原生进程须按既有 Owner 现场核对确认停止；残留锁另按已有授权边界处置，finish 不解除锁，拿到新锁也不等于证明原调用停止。
2. finish 只访问当前必要本地输入，在锁内复核 Run / actor / attempt、直接输入和受管路径。Run 仍 draft、binding 仍 archiving、计数仍为 countBasis，调用前有限输入完整；活动源元数据 / delta、受影响主规格含原不存在文件未变，真实 archive 父目录无本次候选，才可证明确无效果。
3. 保留原 attempt、调用标记、输入与错误，新增本次观察并保存 invoking → none。完整读回后返回 observed-none / pending，正文、binding、activeChangeId、计数和 Run 编号保持，未生成归档完成、批准或新尝试。
4. next 只提示另一次显式 execute；Owner rollback 是单独可选处置。二者各自再次核对直接输入；已有 invoking 的新 execute / rollback 不代做重新分类。已发生效果 / confirmed 不能降为 none，未知 / 变化 / 活跃或 unknown 写者停止；观察提交失败保留锁 / 实际现场并非零退出。

本轮选定入口并补齐契约；产品观察 / 重试 / 回退尚待实施和验证，不能把此说明当作恢复能力已实现。

## 受影响材料与覆盖

- [design](../../../../../../openspec/changes/apply-revision-and-native-archive/design.md) §2、§4、§5、§7：统一回退前置、finish 观察范围、锁内重新分类、未完成返回 / next、execute 前置、过渡查询及两处中断的验证要求。
- [action-runs delta](../../../../../../openspec/changes/apply-revision-and-native-archive/specs/action-runs/spec.md)：明确 rollback 与 execute 不能跳过 finish；增加启动前中断、无效果结束后 none 保存前中断及禁止误降级 / 不确定写者的三个场景，原 requirement / scenario 标题全部保留。
- [tasks](../../../../../../openspec/changes/apply-revision-and-native-archive/tasks.md) 4.4、5.1、5.3–5.5：两处真实中断后从实际 invoking 记录由新进程 finish，确认调用次数 / 计数不变、原 attempt 留存，再联验另一次 execute / Owner rollback 可达；加入已有效果、证据不足、写者活跃 / unknown 和观察提交失败对照。实现组先验证合法 prepared / none 出口，5.1 在观察实现后做跨组联验，不把早期组测试依赖后续实现。

proposal、delivery-workspace / project-entry delta 与其余任务无需修改：它们的操作依赖、过渡 / 完成查询、local-only 和累计编号约束仍适用。没有新增 capability / CLI 入口、通用恢复器、决策记录链、hash 清单或容量门槛。

## 验证与限制

- [commands.json](artifacts/commands.json)：固定 OpenSpec 1.14.1 list / status 确认 nearest root 和当前既有六个具体产物；只修订这三个现有产物，没有补建新 Change 或 explore.md。
- [strict-validate.json](artifacts/strict-validate.json)：当前 Change 退出 0，valid=true、issues=[]。结构检查不代替语义批准。
- [apply-inputs.json](artifacts/apply-inputs.json)：state=ready，progress=0/21；所有任务仍未勾，读取不启动 Apply。
- [revision-assessment.json](artifacts/revision-assessment.json)：Author 静态核对修改范围、五个任务 ID、原场景保留与三个新增场景；三份 delta 合计 15 requirements / 59 scenarios。与本次开始时的直接文件做有限字节比较，032 / 033 Run 保持原样，033 verdict 未改。
- 修订前三个材料保存在 [planning-before](artifacts/planning-before/design.md)，供独立 Reviewer 定位实际变化；不要求读取所有历史或全量 hash。沿用 033 的其余核对和 031 已批准的 Explore / 基线检查，未机械重跑旧 proof。新中断测试明确待 Apply，未声称已有产品回归通过。
- 最终真实 status / next 与规划 / 任务、累计数读回见 [handoff-readback.json](artifacts/handoff-readback.json)。

## 独立 Review Propose 交接

本 Author 修订完成，result=planning-ready-for-review；next=review-propose、role=reviewer，next 只指向本 Run。独立 Reviewer 补审 RP-D-001 的变化和影响边界：入口能否从持久 invoking 合法进入 none；锁内证据、错误保留与未完成返回是否明确；显式后续命令和禁止误判的对照是否覆盖；§2 / §4 / §5 / delta / 任务是否一致。

032 原 Author 记录与 033 changes-requested 保留，本记录不宣布独立批准。Delivery 仍 open，累计完成 Change 仍为 3，当前仍是 D；未修改实现、测试、脚本、产品 Skills 或主规格，未执行实际 Archive、Git、Owner 控制操作、解锁 / 清理、正式 Delivery Full Test / Close / Reopen 或下一 Change 激活。
