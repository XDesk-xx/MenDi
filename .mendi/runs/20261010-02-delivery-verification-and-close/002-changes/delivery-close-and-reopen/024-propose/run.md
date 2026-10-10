---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: delivery-close-and-reopen
planningSlot: MVP-D02-C
batchId: 002-changes
actionId: delivery-close-and-reopen-propose-01
actionType: propose
role: author
run: "024"
status: completed
actionStatus: completed
result: proposal-ready
nextAction: review-propose
nextRole: reviewer
date: 2026-10-10
reviewRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/delivery-close-and-reopen/023-review-explore/run.md
---

# MVP-D02-C Propose

Owner 当前指令：propose。保持 Author，在已激活 C 范围承接 023 独立 approved 的 022 Explore；不重做探索、不创建 Reviewer 结论。D02 仍 open / manual-bootstrap，A / B archived，项目累计完成数为 6。

使用 [openspec-propose](D:/Projects/MenDi/.agents/skills/openspec-propose/SKILL.md) 与 [项目 Propose 方法](D:/Projects/MenDi/skills/actions/propose/SKILL.md)。固定 OpenSpec 1.14.1 context / list 确认 nearest MenDi 项目，复用现有 Change scaffold；先读实际 proposal instructions，再按依赖分别读取 specs / design / tasks instructions 和已落盘依赖。实际 dependencies.done=true，无额外 rules。原始响应保存于 artifacts/*-instructions.json，spec-inventory.json 为实际能力列表。

## 产物与收敛结论

产物位于 [当前 Change](D:/Projects/MenDi/openspec/changes/delivery-close-and-reopen/proposal.md)：proposal、design、五份 delta specs 和 tasks，共 21 项未勾选任务；没有新增 explore.md、实现、产品方法或源码测试。

| 主题 | 本次决定及理由 |
| --- | --- |
| Close 直接输入 | 当前正式入口须同时为 deliveryRunRef / fullTestRunRef，本轮范围 / 命令一致、稳定 known passed、直接日志 / 批准快照完整。保存实际材料 / 差异与适用性判断，不把文字或 actor 宣传为源码 / 授权认证，不倒查旧审核正文或失败链。 |
| closed 与指定读取 | 默认 closed query 读取当前 Close 的持久摘要，不重新验收历史；指定正式结果按 Run 路径所属登记 Delivery，普通结果以可选 --delivery 消除重复 execution ID。读取依赖与当前执行准入分开，实际身份 / 路径 / 日志与稳定性仍校验。 |
| Reopen 范围 / 批次 | goal / plannedChanges 表达新一轮自包含工作，槽位不复用旧 bindings，历史 archived 项可位于本轮范围外。currentBatchId=null，首次实际新 Run 才追加批次；原编号、Close、PASS、批次与累计归档数保留，不累加全历史范围来扩大运行输入。 |
| 本轮新验收 | deliveryRunRef 选择 Reopen 后新工作，fullTestRunRef 保留作历史；首次新正式执行从本轮直接归档 / 审核和新声明开始，不走旧 retry 或继承 repairApproval，之后同轮完整修复规则保持 B 的结论。 |
| 新 Open | 当前完整 closed 后追加独立索引 / manifest，选择新 ID，001-delivery-open，无旧正式指针。旧无状态首次 Open 可成对省略角色 / actor，保留原行为；记录化 Open 明确身份，closed 后新 Open 必须记录并与 Change bind 分开，不发明 actor 或补旧 Run。 |
| 有限继续 | 当前 lifecycle pendingDeliveryRunRef 与单项目锁承接实际提交；明确 draft 意图、终态、manifest / index、读回顺序。显式同操作 resume 仅补缺失本地提交，已提交 Run 不变；锁处置仍须实际 Owner 另行核对，不新增通用恢复 / 自动解锁。 |

design 说明结构 / 选择 / 准入职责及初次 Open 空基准中断状态，tasks 按依赖为每组安排对应测试与方法 / 文档。新增 delivery-lifecycle，修改 delivery-workspace、delivery-verification、test-execution、action-runs；15 个 MODIFIED 块保留所有原有场景名称，追加变化场景。主规格与路线图未修改，不提前同步 / Archive。

不继续扩展 delivery-full-test.ts / delivery-repair.test.ts 的生命周期职责；实际扩展到的混杂记录 / 查询先整理，按场景组织新测试，不添加纯转发层、历史图、全库 hash 或任意行数门槛。旧 C / D proof 未改，不作为产品闭环验收；任务明确使用真实单元 / 接线集合，声明审核夹具与独立阶段批准分开。

## 实际验证与限制

- 固定 `openspec validate delivery-close-and-reopen --strict --json` exit 0，valid=true、issues=[]，见 [validate-final.json](artifacts/validate-final.json)。首次验证同样通过，后续只是本次未提交产物的间隔 / 初次 Open 中断说明整理，未创建额外 Run。
- 结构核对确认 15 个完整 MODIFIED 块与原场景名称、5 个能力文件、21 个任务全部未勾，见 [coherence.json](artifacts/coherence.json)；只核对本次产物，不建立历史证据数量 gate 或 hash 清单。
- 最终固定 native status 和本地 status / next 读回保存 artifacts，前者规划产物齐备、任务尚未实施；后者仍人工来源、D02 open / C proposed / 独立 Review Propose。文件齐备与 validate 不代表方案批准。
- 读回自检曾将上游 isComplete 当作实施状态并触发本地断言；核对固定安装声明后确认它是 isPlanningComplete 的兼容别名，已改为独立核对 0/21 任务完成，不将该断言计为产品失败。当前 manifest 序列化的 CRLF 已修正为原 LF；未格式化旧 Run。见 readback-note.json。
- 沿用 023 对七组真实 proof 的独立 approved 结论与实际工程检查；本轮未改维护代码，不重复 check / build 或行为回归。Apply 再依新增实现执行 check、build、必要回归和隔离产品整链，当前未认证 Close / Reopen 的实际成功。

B 的 unknown / 后代停止未确认限制仍适用，unknown 不可用于 Close；不因本次方案新增恢复、重放取消测试或撤回 A / B 批准。

## 当前交接

Author Propose 完成，无 Reviewer verdict。manifest 当前 next 只指向本 024，等待独立 Review Propose；其前置从本头部定位 023，再定位 022，不复制整条历史链。README / OpenSpec context 仅同步当前阶段，旧 Run、编号与 verdict 保持。

本轮未执行 Apply、产品 Close / Reopen / 新 Open、根正式 Full Test、Archive、Git、临时目录清理或下一 Change 激活。
