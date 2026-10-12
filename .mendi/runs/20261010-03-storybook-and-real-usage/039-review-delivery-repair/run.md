---
deliveryId: 20261010-03-storybook-and-real-usage
planningSlot: MVP-D03
actionId: mvp-d03-review-delivery-repair-03
actionType: review-delivery-repair
role: reviewer
run: "039"
status: completed
actionStatus: completed
scope: delivery
date: 2026-10-12
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/038-test-preparation-optimization/run.md
repairRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/037-revise-delivery-repair/run.md
stageSkillRef: skills/actions/review-delivery-repair/SKILL.md
outcome: complete
result: changes-requested
verdict: changes-requested
repairVerdict: changes-requested
optimizationVerdict: approved
nextAction: delivery-repair
nextRole: author
---

# 037 明确释放修复与 038 准备优化的独立补审

**分别结论：037 changes-requested；038 approved。整体仍停在 delivery-repair，阻断项1。** 直接审核038成本线及其直接037修订，不把一部分的批准扩大到另一部分，不修改实现或历史、不执行正式 Full Test。

## 037：D03-DR035-001 仍未关闭（P1）

当前 `tests/test-store.test.ts:56-105` 再次是 `hold(file, duration?)` / `Start-Sleep` / `hold(target.file, 150)` 旧实现，8935字节、263行；与037的before副本逐字节相同，与037的9022字节/267行candidate不同。见 [本次直接观测](artifacts/candidate-observation.json)。038最终读回记录为2026-10-11T17:35:30.863Z、repairPresent=true；当前文件mtime为17:36:46.595Z，时间线提示之后发生变化，但不能据此识别写者。Reviewer没有恢复、重写或执行旧版存储测试。

本次能直接读到037保存的完整candidate。其逻辑确实去除了150ms睡眠：持有句柄后等待stdin，finally Dispose；父进程发释放信号并等正常close，再替换原staged；真实共享拒绝与产品有限重试分开。持续占用仍验证saveExecution失败与原/暂存保护。helper释放设5秒后终止本次持有进程并要求正常退出；这不是操作系统硬实时保证。该修复方向合理，历史写者未知本身不要求新增监控或追补旧材料。

但是“候选副本有正确实现”不能代替当前运行入口具备该实现。037的7项通过及038中新的共享场景通过保留为当时结果，不能认证当前旧版。500ms/25ms产品处理未在037/038扩大，032/033其余有效保护结论沿用；不得以当前旧版偶然通过关闭本项。

Author下一次局部修订只需处理当前文件回写/交接不一致，确认实际写入来源或至少消除当前竞争写入，恢复明确释放候选并对实际文件做必要定向补验、交接读回；不要求查明所有历史写者，不建全库hash/监控gate。新记录保留037及此前verdict；038批准范围不变时无需重新优化、重跑全部旧集合。Reviewer不替Author恢复实现后自签。

## 038：空依赖准备优化批准

审核范围为test-support、sequential-support、lifecycle-support、delivery-support及新test-preparation共五个文件，已核对四份直接before、当前差异及实际调用点。本次没有产品行为变更，优化只移除重复的空依赖安装：

- 每个Node测试进程私有一个seed，从当前受控空依赖配置实际调用既有pnpm11.22.0离线安装一次。后续复制lockfile与空node_modules，再把workspace-state的projects键定位到目标root。
- 文件复制不把目标目录、manifest、锁、执行结果或源码共享给其他目标；testTarget仍每次新建独立沙箱。后续修改目标不会修改seed或其他目标。当前四个调用点均来自相同空依赖受控夹具。
- 这是针对固定pnpm版本安装元数据的一处有限路径调整，不是通用依赖缓存。批准不覆盖有依赖工程、Vue/Storybook、不同workspace设置或任意未来调用者；这些条件改变时按实际影响调整准备即可，不新增前置扫描或版本gate。
- testTarget(true,false)仍不安装。产品真实pnpm版本检查、error策略依赖预检、warn执行和真实业务脚本均未绕过；未准备/新增未安装依赖真实拒绝。
- lifecycle和verification原有seed构造继续实际生成当前受控状态；passedTarget仍每个目标执行fixture正式适配器，closedTarget仍执行Close。Close/Reopen/Open九个故障点各自保留，第二Archive三个中断仍跨进程resume；未复用正式验收PASS或删减关键边界。
- 独立安装与真实UI路径未使用该helper，原声明八类/18项完整集合未缩减，034未执行项没有补记通过。

性能记录的对照方法成立：两个独立Node进程分别创建四个新空依赖目标，安装4→1次，真实pnpm run/error检查4→4次，准备合计3918.069→989.050ms。已核对cost脚本、原始输出与命令记录。该收益仅适用于本机四目标准备，不推算Full Test总时间，也不把不同负载的生命周期用例时间直接作为整体加速比。

## 独立补验与结果适用性

为独立确认优化不掩盖依赖状态，并补查Author本轮未选入的真实本地依赖场景，本次执行：

| 本次命令 | 结果 |
| --- | --- |
| node --test --test-concurrency=2 tests/test-preparation.test.ts tests/test-entries.test.ts | 7/7、0 skip，约10.37秒；目标路径/状态隔离、后续seed未污染、未准备和新增依赖拒绝、映射/版本/入口和真实CLI读取 |
| node --test --test-name-pattern="RP-A-001\|真实同步后\|预检后外部\|已有脚本自身" tests/test-dependencies.test.ts | 4/4、0 skip，约20.53秒；缺依赖不写入、真实本地依赖安装后可执行、新增依赖拒绝、执行warn不自动安装、脚本自身显式install与协作状态保护 |
| pnpm check | exit0，约11.23秒；格式、lint与三组真实TypeScript检查；未修复文件 |

原始输出只保存一份，命令/预算/退出/收尾见 [verification](artifacts/verification.json)。单项预算90/60/90秒，均无超时、child/pipes关闭，七份直接相关输入在每次执行前后字节相同。本次11项行为通过，不包含当前旧版test-store测试，不用于批准037。Git diff --check通过。

另核对038原始边界TAP：Close/Reopen/Open三组、第二Archive一组、正式父子执行及工具/依赖拒绝两组确实通过；当前相关边界测试未删断言，helper差异与现有实现相符，沿用这些定向结果。038首轮check失败及删除未使用导入后的check-final成功记录均保留；无需为了一个导入删除机械重跑已通过行为。037候选回退只影响相应释放修复及含它的当前结果适用性，不否定这些独立优化断言。

## 维护规模与下一步

本次独立统计见 [final-readback](artifacts/final-readback.json)。src前三：application/delivery-full-test.ts 401、adapters/openspec.ts 346、adapters/lifecycle-store.ts 336；tests前三：action-write.test.ts 467、planning-cli.test.ts 444、delivery-repair.test.ts 394；scripts前三：proofs/mvp-d01-c-explore.ts 678、proofs/mvp-d01-d-explore.ts 487、proofs/mvp-d01-a-explore.ts 463。

038直接before支持test-support 115→136（+21），三个其他support各-4，新test-preparation37行；准备职责集中在已有helper，没有新增平台或转发拆分。037当前实际仍263行，不能写成其267行候选已落地。产品源码和旧长proof未因此扩展，不设行数硬门槛。

仅新增本039和必要验证记录，更新manifest / README / context当前交接。下一步为delivery-repair / author / awaiting-author-revision，直接入口只留039，保留038优化批准。034正式failed及原完整集合、A/B/C archived、累计10、无活动根Change、D03 open/manual-bootstrap不变。本次不修改维护实现或历史，不重跑Full Test，不执行Close、Git、目录清理或子智能体。
