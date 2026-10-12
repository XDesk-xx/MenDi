---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: real-target-delivery-acceptance
planningSlot: MVP-D03-C
batchId: 002-changes
actionId: real-target-delivery-acceptance-revise-propose-02
actionType: revise-propose
role: author
run: "021"
status: completed
actionStatus: completed
result: planning-complete
nextAction: review-propose
nextRole: reviewer
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-update-change/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/020-review-propose/run.md
---

# MVP-D03-C Author Revise Propose · D03C-RP-001

Owner 指令：仅修 D03C-RP-001，在现有 design §5 与相关任务明确预算执行者、整组剩余时间、取消及有限收尾，安排短时定向验证；保留六组 23 项和其余方案，不增通用执行器、gate 或历史补证，停独立 Review Propose 补审，不创建目标或实现计数器。

已读固定 [020 Review Propose](../020-review-propose/run.md)：role=reviewer、completed / changes-requested、authorRunRef 指向 019；唯一 finding 为 D03C-RP-001。020 对其余范围、实际顺序、方法 / 新 Author 交接、授权和任务粒度的核对结论继续沿用，不替 Reviewer 将 finding 标成 approved。当前实际 Run 止于 020，本次新建 021；旧编号、正文、输出和 verdict 保持原样。

## 本次方案修订

只修改当前 [design §5](../../../../../../openspec/changes/real-target-delivery-acceptance/design.md) 和 [tasks](../../../../../../openspec/changes/real-target-delivery-acceptance/tasks.md) 的 1.2、3.2、3.3、4.2、5.5：

| D03C-RP-001 要求 | 本次明确的安排 |
| --- | --- |
| 谁执行预算 | 准备由宿主当次固定内联 Node / spawn 调用控制；Vue 检查由目标固定 stories / browser / full 的有限脚本控制，不增加产品 CLI 参数或通用执行器。脚本只在后续 Apply 落地。 |
| 总剩余时间 | 单调时钟、组内一个 deadline；每步启动 / 结果接纳均复核，当前步取单命令上限与 remaining 的较小值。full 五项不重置总预算，执行 / 正常收尾计入组内时长，迟到 0 不能转 PASS。 |
| 实际取消入口 | 本次支持 SIGINT 的交互终端 Ctrl+C；正式调用取消给 MenDi 前台，让现有适配器停止它持有的 child。Apply 实测实际发送方式，不能用 Windows child.kill('SIGINT') 或杀 MenDi PID 冒充。 |
| 有限停止 | 到期 / 取消锁定原因、停止后项；只对本次仍持有的活跃 child 树执行限时 taskkill，停止命令 5 秒、close / 管道 5 秒、监听确认 2 秒，最多 12 秒另记，不恢复执行预算。正常 finally 与强制终止分开解释。 |
| 结果 / 现场 | 保留实际 child / 日志 / 监听事实。未知停止不造正式状态；父 / 子结果取 MenDi 实际保存 / 读回，failed 也不能掩盖收尾限制，unknown / draft / retainedLock 原样保留、停 Owner，不自动清锁、重跑或 Close。 |
| 短时验证 | 并入 3.3，以秒级受控短进程覆盖正常、剩余预算耗尽、迟到 0 拒收、后项不执行、真实 Ctrl+C 与停止确认；有限未确认分支用替身，不故意遗留失控进程。不重放旧 D02 测试。 |

正式集合仍为 typecheck / build / build-storybook / stories / browser、full 10 分钟；未删项目或更改业务。目标有限脚本承担五项时长，不声称稳定 CLI 的同步准入 / pnpm 预检 / 持久化也由该脚本限时；外围挂起按实际前台取消与记录处理。

短时接线测试明确不执行完整计数器交互集合，不提前消耗新 Author 的首次 stories / browser 验收，也不能代替正式业务失败。六组 23 项仍 0/23；取消范围、唯一目标、角色交接和根 / 目标收口边界保留。

## 方法与检查

使用已读取的 openspec-update-change 与产品 propose 方法，Owner 本次指令明确授权该局部修订。固定 OpenSpec list 确认现有根与 Change；读取当前 design / tasks、proposal 依赖及 [design instructions](artifacts/design-instructions.json) / [tasks instructions](artifacts/tasks-instructions.json)，仅修现有文件，specs 继续 skipped。只取当前两个直接修改文件的短名 [before](artifacts/before/) 对照，不复制历史树或新增 hash。

- 固定 OpenSpec `validate real-target-delivery-acceptance --strict --json`：[validate](artifacts/validate.json) exit 0，1 passed / 0 failed，仅 skip_specs INFO。
- `instructions apply --change real-target-delivery-acceptance --json`：[Apply instructions](artifacts/apply-instructions.json) total=23 / complete=0 / remaining=23。结构就绪不是实施或独立批准。
- 本次短时验证为 **已安排、未执行**：按 Owner 的 Propose 范围写入既有任务，实际接线尚未落地，不能拿旧适配器测试或纸面推演声称新入口通过。目标目录仍不存在，未编写计数器 / 有限脚本或执行工程验收。

## 独立补审交接

当前 manifest / README / OpenSpec context 仅同步最近入口；稳定 MenDi [status](artifacts/status-readback.json) / [next](artifacts/next-readback.json) 固定本 021，review-propose / awaiting-review / reviewer，根 manual-bootstrap / executable=false 保持。

本次未改 proposal、路线图、产品实现、测试 / 夹具、维护脚本或旧 Run；未执行目标阶段、归档、正式 Full Test / Close、Git 或子智能体。可靠旧结论直接沿用，不追补历史。

Author 结果 planning-complete；交独立 Reviewer **仅补审 D03C-RP-001 的方案改动**及短时验证安排。尚未获批准，停 review-propose，不自动派 Reviewer 或进入 Apply。
