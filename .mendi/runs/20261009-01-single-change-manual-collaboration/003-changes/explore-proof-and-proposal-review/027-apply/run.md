---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: explore-proof-and-proposal-review
planningSlot: MVP-D01-C
actionId: explore-proof-and-proposal-review-apply-01
actionType: apply
role: author
run: "027"
status: completed
result: implemented-ready-for-review
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
nextAction: review-apply
nextRole: reviewer
date: 2026-10-10
proposalRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/explore-proof-and-proposal-review/025-propose/run.md
reviewRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/explore-proof-and-proposal-review/026-review-propose/run.md
---

# MVP-D01-C Apply

Owner 的 `apply` 指令触发已批准范围内实施，保持 Author。依据 025 与 026，整个实施使用此一 Run，完成后交独立 Review Apply。人工 bootstrap 不通过产品命令写入。

## 实施结论

**Author 实施完成，交独立 Review Apply。** 025 的 16 项任务已完成；这里没有 Reviewer verdict。工具与测试结果支持实现可用，不代替当前 Change 独立审核。

- `action instructions` 读取固定 1.14.1 的完整真实协议、context / 当前 artifact rules、输出模式及直接依赖；核对 root / Change / artifact / schema、必要内容和目标路径，保留 blocked 状态。Explore 只请求 proposal 背景，Propose 支持四类；只读且不分配 Run。未知扩展及旧说明不自动成为依赖。
- draft save 只读取有效本地配置、活动路径、当前 draft / 身份和明确正文，锁内再次检查配置与当前记录；结果为 local-only / openspec:null / upstreamAccess:not-required。缺工具或上游故障不阻断保存，正式 submit / continue 仍保留上游和固定 Author 检查。
- `action resolve` 限定未完成 Explore / Propose 的同角色、不同 actor handoff，或 rejected 后同阶段 Author revise。新 draft 保存直接 ownerDecision；handoff 沿用 Action / 固定对象及待继续笔记，不继承正式结果。普通 continue 仅保留最新决策说明，查询不读取历史来源正文。固定输入与当前工作在锁内复核，旧 Run / verdict 原样保留。
- `workspace diagnose` 不访问上游，仅只读当前本地现场及明确的同 Change reservation；报告锁、存活观察、实际记录、相关临时路径和必要错误。保留首次快照，显式 reservation 与 current 相同也能发现读中变化；无法读取锁不声称无锁。manual-bootstrap 不解析人工 Run。没有解除锁命令或普通操作的 bypass。
- 四份阶段方法、OpenSpec 工具指导、README 同步真实消费与独立审核边界。今后 Explore 摘要只进 Run / artifacts，既有受审 explore.md 保留。proof 脚本幂等创建临时父目录；P07 更新为产品本地 save 的行为，早期 P07 反例和旧报告不改。

026 的 RP-C-001 已落实：任务 2.2 和 delta 场景区分替换前拒绝与替换后读回失败；后者保留实际写入、锁和错误，不回滚 / 重提，任何情况不得改旧 submitted Run。诊断的首次快照说明同步设计与 delta；属于已批准行为的实现澄清，没有扩大阶段范围或重做 Explore / Propose。

## 验证与材料

| 检查 | 实际结果 |
|---|---|
| 首组 instructions / 本地 save / 既有 adapter | 8/8 通过 |
| Owner / diagnose / 既有 action-write | 29/29 通过 |
| 新增功能 focused，含真实 CLI 串联与 resolve 进程竞争 | [18/18 通过](artifacts/focused.log) |
| 两处读取复核加强后的 Owner / diagnose focused | 13/13 通过，最终全回归包含这些用例 |
| `pnpm check` | 37 个受检文件格式 / lint 通过，源码、脚本、测试三份 TypeScript 检查通过 |
| `pnpm test`（包含 build，最终实现） | [84/84 通过](artifacts/final-regression.log)，0 failed / skipped |
| 当前 delta strict validate | [valid=true、issues=[]，1/1 通过](artifacts/strict-validate.json) |
| 无 `.tmp` 父目录的新副本重建 proof | [8/8、44 次实际子进程调用](artifacts/rebuild-proof/report.json)，父目录由脚本创建 |

首轮全回归 82/82 保留于 [regression.log](artifacts/regression.log)；此后加强首次快照和固定 Author 锁内复核，新增对应测试，再执行最终 84/84。工程检查只要求修正具体类型 / lint 问题，没有新增历史补证、hash 清单或 gate。

实际 CLI / 固定 OpenSpec stdout、stderr、参数和退出码保存于 [final-regression-commands](artifacts/final-regression-commands/)。[集成示例](artifacts/integration-example/observations.json) 保存 9 次真实指引观察、10 个实验 Run 和最终方案文件：context 的“不自动安装”进入范围、缺工具失败场景、设计输入和测试任务；rejected 后的路径越界要求实际补进 delta / design / tasks。脚本和测试为受控重建输入，正式材料不只留在 `.tmp`。

必要输入缺失、错角色 / actor、陈旧或 submitted、未知 Ref / 失效说明、越界 / junction、固定 Author 缺失或不完整、锁冲突、分配占号、替换前 / 后失败、真实子进程存活及读中变化均有对应覆盖。仍适用的旧结果可沿用；023–026、早期 proof 和既有 explore.md 未改写。

## 边界

测试 actor / Owner 标签和 verdict 是夹具，不证明真人身份，也不代表当前 Change 的独立批准。存活探针和有限读回不证明无写者或可安全解锁；受控异常不证明任意断电原子性。没有执行当前目标的实际 Owner 处置、解除锁、Git 写操作、Archive、正式 Delivery Full Test / Close、下一 Change 或仓库 .tmp 清理。

当前交接只指向 027 Author；独立 Reviewer 以本 Run、受影响代码 / 方法、当前方案与必要材料补审本次实现。MVP-D01-D 的 Apply / Archive 接线、跨阶段回退和持久中止不在本轮实现。
