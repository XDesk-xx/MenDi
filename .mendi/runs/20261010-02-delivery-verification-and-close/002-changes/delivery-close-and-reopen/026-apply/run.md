---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: delivery-close-and-reopen
planningSlot: MVP-D02-C
batchId: 002-changes
actionId: delivery-close-and-reopen-apply-01
actionType: apply
role: author
run: "026"
status: completed
actionStatus: completed
result: apply-ready
nextAction: review-apply
nextRole: reviewer
date: 2026-10-10
reviewRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/delivery-close-and-reopen/025-review-propose/run.md
---

# MVP-D02-C Apply

Owner 指令 apply，保持 Author，承接 025 独立 Review Propose approved。实施范围为 delivery-close-and-reopen 的 21 项任务；完成后交独立 Review Apply。旧 Run / 编号 / verdict 保留，不创建 Reviewer 结论。

使用项目 OpenSpec Apply Skill 与 Apply 方法，读取固定 1.14.1 的实际 instructions、八份 contextFiles 和 operationGuidance。上下文与逐项 checkbox 位置按原生响应核对；同轮修复与检查留在本 026，不单独建 Run。根项目保持 manual-bootstrap / D02 open，累计归档数 6。

## 实施结果

- 新增 Open / Close / Reopen 的独立生命周期应用与持久记录。Close 要求当前两个正式指针、本轮完整范围、稳定 known passed 父 / 子及必要日志、命令匹配和批准快照；批准编号必须早于固定正式入口。保存真实材料 / 差异 / applicable 理由，不追读旧 Archive / Review / Author 正文、失败链或未知 Ref，不把 actor 或文字宣称为源码 / Owner 认证。
- closed 默认查询只展示持久 Close；显式正式结果按规范 Run 路径所属登记 Delivery，普通 test status 可用 --delivery。指定读取只依赖索引、所选 manifest、指定结果与必要日志，不借当前 open 执行准入或无关当前 Run；有锁 / 日志不稳定仍失败或 unknown。只读选择不改 activeDeliveryId。completionScope 与 verificationScope 分开，历史 ordinal 小于全局计数可读，正在提交的 Archive 保留 countBasis / ordinal 检查。
- Reopen 使用批准设计中的 --scope / --reason：新范围非空、自包含，不复用旧槽位，保留旧 archived bindings / Close / Full Test。currentBatchId=null，bind 暂无批次，首次实际 Change Run 追加 NNN-changes 并保留旧数组。首次新验收只读取本轮直接批准与新完整集合，旧 PASS / repairApproval 不继承；同轮失败仍须定向独立审核和新整次执行。
- closed 后新 Open 必须显式 Author / actor、新 ID 与项目内范围，保留旧 manifest / 索引 / Run 和累计归档数；新 Run 从 001 开始，无旧正式指针，与 bind 分开。旧无状态首次调用可成对省略身份，不补历史 Run；记录化首次可选绑定保留 openRunRef 并退出 Open 当前选择。
- 复用单项目 lease、全 Delivery 占号与临时替换：draft intent / 实际 before 与 input → pending → terminal → manifest → 最终索引 / 清 pending → 读回 / 释放。新 Open 的索引追加 / 选择在最终提交，首次无入口的 pending 有限解释。失败保持真实路径、占号、锁 / 临时现场；终态不等于整体成功。resume 只补同类型 / actor 当前缺失本地提交，核对直接输入与 before / after，不重测、新占号、改 terminal、二次计数或自动解锁；完整当前对象 already-completed，陈旧 / 占用拒绝。普通 save 只写 pending draft 故障说明，submit / continue 不能制造生命周期终态。

新增三个真实产品方法并同步 CLI 帮助、README / context。纯记录转换在 core/lifecycle-transition.ts，文件提交与有限继续在 adapters/lifecycle-store.ts，准入与方法编排在 application/delivery-lifecycle.ts；批次规则、正式快照解析分别拆出真实领域职责。未向 delivery-full-test.ts 堆入 Close / Reopen，也未增加纯转发层、引用中心、依赖图、hash 清单或容量 / 行数门槛。Delta 规格与设计决策保持 025 批准范围；tasks 7.3 校正真实工程聚合名称，根没有 test:full，不新增同名脚本适配文案。

## 实际验证

[verification-summary.json](artifacts/verification-summary.json) 汇总实际命令；[regression.log](artifacts/regression.log) 保留全仓首轮原结果，不改写失败历史。

- 普通 pnpm check 最终 exit 0：111 份维护文件格式 / lint 通过，src / scripts / tests 三份真正 TypeScript 检查通过，见 check-final.log。build 在 pnpm test 内实际通过，修复后 tsc 再通过。Pnpm 提示 workspace 与 node_modules 元数据不同步，检查与构建均完成；这是非阻断提示，本轮没有为消除提示安装或迁移环境。
- pnpm test 首轮 exit 1，189 项中 186 通过 / 3 失败。三个问题为：旧首次 Open 并发重复调用错误码变化、活动项存在时旧结果范围显示变化、显式正式 status 已有锁未保持原拒绝。已按原契约修正；定向重跑三项 exit 0、3/3 通过，见 regression-fixes.log。其余未受该修正影响的可靠结果沿用，不声称全仓首轮 exit 0。
- 最终输入边界 5/5 通过，见 final-input-checks.log：多索引 / 批次、生命周期身份、CLI 参数、Close 快照相对正式入口的编号，以及记录化首次 Open 中断 / resume。写入 worker 位于维护测试目录并纳入真实类型检查；迁移后真实子进程用例再通过。
- 新增生命周期场景包含两个真实接线闭环、旧完整结果读取、多 Delivery 同名 execution、必要输入缺失 / 失效历史说明 / 未知 Ref / 越界及 junction、新范围拒绝与首次新验收、同轮失败修复；Closed / Reopen / 新 Open 的 27 个提交点故障及有限继续均通过，包含临时替换前、索引选择前、读回与释放。另覆盖首次意图未登记不能猜关联、pending 缺 manifest、原输入变化、错误 actor / 类型、陈旧对象、已有锁、故障说明与普通 submit / continue 禁止。
- [lifecycle-scenes.jsonl](artifacts/lifecycle-scenes.jsonl) 保存两条真实场景的父 / 子结果、5 次实际执行日志与累计计数：由维护输入真实 Open / 多 Change 原生 Archive / unit + integration 完整集合 → Close → Reopen → 新工作原生 Archive / 新整次结果 → Close；另验证新 Delivery 追加、归档数增长、同名普通执行及另一进程指定旧结果。阶段批准明确是记录夹具，不认证本仓库独立审核；真实测试没有使用旧 foreground:pass 作为覆盖。
- 固定 OpenSpec strict validate 已通过，最终结果与任务 instructions 保存本 Run artifacts。native 任务完成不替代独立 Review Apply。

首次 focused 测试曾暴露 Reopen 刚换范围时误报 unavailable，已区分无活动的新范围 changed 与活动未完成 unavailable，实际 Reopen 闭环重跑 3/3 通过。没有重放旧单独取消 proof；既有工程 suite 中适用普通取消 / unknown 回归结果保留其限定用途。CLI 不隔离任意外部源码写者；材料适用性仍由 Author / Reviewer 根据真实候选判断。

## 维护代码行数与职责

按本轮读入源码的物理行计数，排除历史 Run、生成物与 fixtures；本次 before / after 是本 Run 的验证材料，不建立独立台账。完整统计见 maintained-lines-before.json / maintained-lines-after.json。

| 类别 | 当前前三名 | 可靠增长与职责判断 |
| --- | --- | --- |
| src | application/delivery-full-test.ts 401；adapters/openspec.ts 346；adapters/lifecycle-store.ts 333 | Full Test 从 390 到 401，增加历史选择与原锁边界，仍维护正式执行；OpenSpec 346 未变。lifecycle-store 为本轮新增，无旧增长基准；负责一次本地提交 / resume，纯转换已移入 core，非转发层。application/archive.ts 同为 333、未变，列为第三位并列。 |
| tests | action-write.test.ts 467；planning-cli.test.ts 444；delivery-repair.test.ts 394 | 三项均与本轮 before 一致，未继续堆生命周期场景；新场景按 records / close / reopen / open / writes 分组，准备职责归 lifecycle-support。 |
| scripts | proofs/mvp-d01-c-explore.ts 678；proofs/mvp-d01-d-explore.ts 487；proofs/mvp-d01-a-explore.ts 463 | 三项均未变。旧 C / D proof 的 Apply 记录流与 Archive 效果组合保持历史限定用途，未继续扩展；产品验收位于按场景维护的 tests。未来确需扩展旧 proof 时，先分开 Apply 记录流与 Archive 效果组；本轮不因行数拆层。 |

## Author 交接

实施、必要工程检查与本次产品场景完成，交独立 Reviewer 补审本轮变化。manifest 的 next 只指向本 026 Author，前置批准从本头部定位 025，不复制历史链。本轮不提供 Reviewer verdict；可靠结果可沿用，实际独立审核仍必须由 Reviewer 完成。

本项目未执行 Archive、根正式 Delivery Full Test / Close / Reopen / 新 Open、Git 写操作、临时目录清理或下一 Change 激活。当前 D02 open、C 尚未归档、累计完成数仍为 6。
