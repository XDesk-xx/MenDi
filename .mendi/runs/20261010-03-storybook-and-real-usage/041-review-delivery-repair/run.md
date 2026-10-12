---
deliveryId: 20261010-03-storybook-and-real-usage
planningSlot: MVP-D03
actionId: mvp-d03-review-delivery-repair-04
actionType: review-delivery-repair
role: reviewer
run: "041"
status: completed
actionStatus: completed
scope: delivery
date: 2026-10-12
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/040-revise-delivery-repair/run.md
stageSkillRef: skills/actions/review-delivery-repair/SKILL.md
outcome: complete
result: changes-requested
verdict: changes-requested
nextAction: delivery-repair
nextRole: author
---

# 040 独立修复补审

**verdict：changes-requested，阻断项1；D03-DR035-001仍未关闭。** 本次固定040，沿用039对038测试准备优化的approved结论，未修改实现或历史，未执行正式Full Test。

## 新事实：审核期间实际测试文件再次回写

本次首轮Get-Content完整读到了明确释放实现：hold(file)等待stdin、release等待正常close、没有Start-Sleep，Get-Item显示9022字节、mtime为2026-10-11T17:49:11.638Z（精确值与040恢复记录相符）。这表明040的修复曾实际存在，本次不将其描述为始终未写入。

随后准备独立执行 `node --test tests/test-store.test.ts`，先取得本次记录锁并核对当前文件与直接candidate；比较断言失败，尚未创建Reviewer Run或启动测试子进程，finally释放了本次自己的记录锁。没有调用源码恢复或写入操作。

再次独立读回（17:53:30.578Z）：当前8935字节、263行，与037 before逐字节相同、与9022字节candidate不同；mtime变为17:52:52.782Z，Start-Sleep和hold(target.file,150)已恢复，release不存在。详见 [当前输入观测](artifacts/candidate-observation.json)。因此这次已观察到同一审核期间的版本变化，而不只是交接后发现一次不一致。具体写者仍无法由mtime或本次读取识别，不指认Author、Reviewer、编辑器、宿主或其他进程。

直接问题仍在 `tests/test-store.test.ts:56-105`：实际测试入口未保持明确释放修复。040的7/7及check成功保留为当时证据；不能用于批准现有旧版，Reviewer也不恢复实现后自签、不运行旧版来碰运气。

## 修复逻辑、保护和证据边界

已检查初次实际文件及037的直接candidate：真实FileShare.Read持有期间拒绝替换，原/staged字节保留；发出stdin释放信号，finally Dispose，父进程正常close后替换同一staged。真实共享机制与受控产品重试分开，方向合理。持续占用测试仍调用saveExecution，覆盖有界失败、原结果和唯一暂存保护；内容冲突、错误传播、终态/身份和业务启动次数断言仍在。

产品500ms/25ms处理保持032/033范围，没有增加整例重试、删原文件或延长产品预算。5秒helper终止及500ms产品等待都不能被解释为系统调度的硬实时保证。035时序诊断及对034原次原因的限制沿用，不重造诊断或补历史。

核对040的verification和原始TAP/check输出：7/7、0 skip，check exit0，补验脚本strict noEmit exit0，记录为各子进程关闭、无超时、直接输入一致。必要补验范围合适，但只支持执行时的候选。040回写调查明确声明来源未知；本审核未独立重放两会话完整历史，不能把该调查当文件写入审计。原子替换保证一次写入方式，不防止之后的其他写者按路径重写；记录锁也只约束遵守它的写入。

本次独立行为测试为**未启动**，失败发生于启动前的候选一致性核对，不是7项测试失败，更不是新的正式Full Test失败。不增加重试、hash清单、常驻监控或新gate。

## 最小下一步

请Author先处理当前仍能将源码恢复旧版的写入来源或隔离冲突写入，再在同一修订中恢复明确释放实现、定向补验并交接实际入口。无需查明所有历史写者；重点是消除当前可复现的交接不稳定，避免只重复“复制candidate→通过测试→再次回写”。Reviewer仍只补审这项实际变化，038优化approved继续有效，不重复其成本线或已通过的11项独立验证。

034仍是最新正式failed，原八类/18项集合和11项未执行不变。即使下一次修复批准，也只能转等待Owner授权的新整次正式Full Test，不能拼接旧PASS。

## 维护规模与交接

本次独立行数见 [final-readback](artifacts/final-readback.json)：src前三delivery-full-test.ts 401、openspec.ts 346、lifecycle-store.ts 336；tests前三action-write.test.ts 467、planning-cli.test.ts 444、delivery-repair.test.ts 394；scripts前三mvp-d01-c-explore.ts 678、mvp-d01-d-explore.ts 487、mvp-d01-a-explore.ts 463。前三及旧proof未扩展。040报告的263→267修订曾存在，但结束时当前文件仍263行，不能宣称最终候选已稳定落地；不把此前038优化增长重复算成本轮工作。

新增本041及必要观测，更新manifest/README/context当前入口；040及以前Run、verdict、失败现场不改。下一步delivery-repair / author / awaiting-author-revision，直接入口仅本审核，038批准沿用。D03 open/manual-bootstrap、累计10、A/B/C archived、无活动根Change与034 failed保持；未修改实现、重跑正式Full Test、Close、Git、清理或启动子智能体。
