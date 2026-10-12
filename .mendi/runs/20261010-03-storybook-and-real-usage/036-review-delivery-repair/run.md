---
deliveryId: 20261010-03-storybook-and-real-usage
planningSlot: MVP-D03
actionId: mvp-d03-review-delivery-repair-02
actionType: review-delivery-repair
role: reviewer
run: "036"
status: completed
actionStatus: completed
scope: delivery
date: 2026-10-12
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/035-delivery-repair/run.md
failedFullTestRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/034-delivery-full-test/run.md
stageSkillRef: skills/actions/review-delivery-repair/SKILL.md
outcome: complete
result: changes-requested
verdict: changes-requested
nextAction: delivery-repair
nextRole: author
---

# MVP-D03 第二次独立定向修复审核

**verdict：changes-requested，阻断项 1。** 固定 [035 Author](../035-delivery-repair/run.md)，核对其直接失败、当前文件、修复前副本、时序诊断和最终原始验证日志。当前测试文件与035所述最终修复不一致，不能进入新的正式 Full Test。Reviewer 未恢复或修改实现，未执行行为测试、正式 Full Test、Close、Git 写入、清理或子智能体。

## D03-DR035-001：当前交接仍是修复前测试，最终 PASS 不适用于当前输入（P1）

直接位置：`tests/test-store.test.ts:56-105`。当前仍有 `hold(file, duration?)`、`Start-Sleep` 和 `hold(target.file, 150)`，场景名仍为“Windows 短时删除共享拒绝后替换同一 staged 结果”；没有035所述的明确释放流程及5秒有界收尾。独立读回当前文件为8935字节、263物理行，与035的 `artifacts/test-store.before.ts` 逐字节相同。只保存本次必要的单文件 [观测副本](artifacts/observed-test-store.ts) 和 [检查结果](artifacts/review-observation.json)，没有全库 hash 或历史证据复制。

035最终原始日志中，新场景“Windows 删除共享拒绝，确认句柄释放后可替换同一 staged 文件”确实通过；最终7/7、两组各2/2与check exit0有相应输出，不能否认这些历史执行。但是日志不提供缺失修复代码供独立检查，且不能批准当前旧版。当前文件修改时间为2026-10-11T17:04:21.750Z，晚于035最终读回记录17:03:42.233Z；这是时间线线索，不证明具体写者或命令。

035已经如实记录较早一次异常回写（16:55:30.321Z），并排除了当时只选中1项的两次重复测试。当前又观察到旧版，说明交接时输入不一致问题仍未闭合。不能把 `testedInputUnchanged=true` 理解为跨越后续写入的永久保证，也不能把根记录锁理解为其他编辑器/任务绝不可能修改普通测试文件。当前证据不能识别外部写者；Reviewer没有执行过恢复此测试文件的操作。

最小处理：Author另建修订交接，保留035/036及旧编号；先核对当前仍可能写入此文件的任务/编辑器等实际来源，再恢复同一范围的明确释放修复。无需为批准证明所有历史写者身份，但必须交接实际存在且与本次验证一致的候选。只对该修复重跑必要定向测试和常规check，确认实际选中新场景，交接前读回。不要以重跑旧版偶然通过代替修复，不扩展为全库监控、hash台账或新gate。Reviewer只补审此修订，其余有效结论沿用。

## 时序诊断与边界

独立读取035的 `holder-timing.ts`、五份原始时序输出并重新汇总36个现场：子进程与管道均正常关闭；请求睡眠150ms，子进程Stopwatch测得约334.882–517.636ms；其中一例父进程在约511.173ms结束重试仍失败，原文件/暂存内容完整。证据支持“150ms睡眠不能保证外部句柄在产品500ms等待窗口内释放”，无需扩展到业务架构修复或认定杀毒/索引进程。

注意子进程Stopwatch起于输出ready之前，父进程重试计时起于收到ready之后，两者零点不同；不能直接相减推导精确释放余量。这是新现场的真实共享机制诊断，包含本地rename重试循环，不是034原次完整时序，也不是再次运行产品正式 Full Test。034原次缺乏释放时间，035明确保留这一限制，诊断表述总体合理。

## 释放同步、500ms保护和补验

- “真实共享拒绝 / 明确释放”与“受控瞬时重试 / 持续失败”分开验证的方向合理：可控错误验证产品重试、单次业务启动和同一暂存，真实句柄验证Windows共享行为。明确退出确认比150ms睡眠假设稳妥。但当前缺少035最终实现，不能仅凭说明或测试名批准释放、异常路径和helper收尾。
- 当前 `src/adapters/test-store.ts` 仍是032/033审核过的局部处理：同次保存建立500ms截止，最长25ms等待，Windows EPERM/EBUSY限定、其他错误传播、原/暂存冲突检查、终态和身份保护均在。未看到扩大预算、删除原文件、重启业务或重试整个执行。500ms是局部等待预算，不是同步I/O和系统调度的硬实时上限。
- 035最终原始输出对应7+2+2项通过、0 skip，check包含格式/lint/三组TypeScript检查；脚本明确在每项后比对本次测试输入。较早异常轮次未冒充最终完整补验，记录透明。
- 这些补验的范围选择合理；但缺失当前候选使其适用性不足。本次不再跑旧版7项或人为恢复测试后自签，独立验证采用直接文件读回、字节比较、实际场景名与时序原始输出复核。032/033中未受影响的产品保护结论沿用，无需重跑UI、安装、旧生命周期或补齐旧材料。

## 集合、维护规模与交接

034仍为正式failed，原八类集合和18项命令不缩减，11项未执行不改成通过。性能优化仍为后续处理，不混入本次稳定性修复，也不宣称已提升全量速度。

本次维护代码前三见 [观测结果](artifacts/review-observation.json)：src为delivery-full-test.ts 401、openspec.ts 346、lifecycle-store.ts 336；tests为action-write.test.ts 467、planning-cli.test.ts 444、delivery-repair.test.ts 394；scripts为mvp-d01-c-explore.ts 678、mvp-d01-d-explore.ts 487、mvp-d01-a-explore.ts 463。前三未见本次扩展；当前test-store.test.ts为263行而非035报告的267，差异属于本次阻断，不能记为已落地增长。当前产品存储150行，职责范围未扩大，旧长proof保持用途，无硬行数门槛。

仅新增036与必要观测，并更新manifest / README / context当前交接。下一步 `delivery-repair / author / awaiting-author-revision`，直接输入仅本审核；新修订经独立审核后再等Owner授权新的整次正式 Full Test。D03保持open/manual-bootstrap、A/B/C archived、累计10、无活动根Change，fullTest仍完整保留034 failed。此次停在Full Test之前；不自动恢复代码、重跑或Close。
