---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
batchId: 003-changes
actionId: apply-revision-and-native-archive-apply-01
actionType: apply
role: author
run: "036"
status: completed
result: implementation-ready-for-review
date: 2026-10-10
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/035-review-propose/run.md
nextAction: review-apply
nextRole: reviewer
---

# MVP-D01-D Author Apply

Owner 指令 `apply`，依据 035 独立批准的 034 修订方案实施。保持 Author；本次形成可补审的实现与证据，停在独立 Review Apply，不给 Reviewer verdict。任务逐项按固定工具返回的 sourcePath / line 勾选并再次读取 inputs；最终 21/21 任务完成、remaining=0、state=all_done；交接项在记录与真实查询读回成立后标记。

## 实现与必要范围

- 实际整理 Action 职责：instructions、Owner resolve 与共享检查独立实现；CLI 直接接线。Archive 的有限输入 / 效果读回和编号 / 计数 / Run / manifest 提交各在实际 adapter，application 负责明确操作编排，没有纯转发层。
- Apply / Archive operation 使用不同公开协议。保留真实 context / operationGuidance；必要任务、进度、身份、受管路径 / junction 校验；未知 Ref 不递归读取。真实 CLI Apply 和 Archive 指引只读，不改 Run / 任务 / 指针。
- 未完成 Apply / Review Apply 支持 Owner handoff，rejected 支持同阶段新 revise。显式 earlier rollback 固定当前 Run 和目标完整 Author，建立新的 Author / 独立 Review 路径，不删实现或沿用旧批准跳段；原 actor 陈旧写入和 Reviewer 自签拒绝。
- Archive start 只准备 typed draft / archiving，要求直接独立 Review Apply approved、完整 Author、真实 all_done 及必要规划。execute 保存本次有限源 / 主规格 / 直接输入和调用标记，再执行固定 OpenSpec 1.14.1 的原生 archive --json --yes；保留公开包装响应、退出 / 信号 / stdout / stderr。只定向认证真实效果，未新增语义合并器、跳过验证、hash 清单或通用恢复器。
- finish 完全 local-only，原写者与可能的原生调用必须已证实停止；新锁不替代停止证据。RP-D-001 的两处真实中断都从实际 invoking 经新进程保存 none，仍 observed-none / pending，不改正文、计数、binding 或 Run 编号。随后另一次 execute 和独立 Owner rollback 都已到达；旧 attempt / 标记 / 错误保留。输入缺失 / 变化、活跃 / unknown、源目标并存 / 多候选 / 外链等停止，confirmed 不降为 none。
- 有实际效果时使用真实目录日期和预定累计 ordinal；已验证缺省零、跨日期定位及 999 → 1000。按安全编号、计数、终态 Run、manifest、读回、释放本次锁的顺序收口；部分提交和 finish 自身再次中断只补缺失交接，计数一次、终态字节不改、原生不重调。already-completed 只读回当前必要记录。
- 过渡和最终查询不再调用已移走 Change 的 status；普通 version / list 保留。终态 Run 已写、manifest 未提交仍 pending。归档内容、历史批准正文、说明链接和未知 Ref 无需存在；当前必要 Run 缺失、身份 / count 矛盾及普通活动源缺失仍拒绝。人工只读格式不迁移。

## 验证与真实失败

- [verification.json](artifacts/verification.json)：pnpm check 退出 0；pnpm test 内 build 退出 0，完整 111 项测试首次 110 通过、1 失败。唯一失败是旧 actions.test.ts 断言 archive 不支持，与当前受审新增能力冲突；没有产品行为失败。
- [verification-followup.json](artifacts/verification-followup.json)：将旧断言改为支持 Author Archive、仍拒绝 review-archive / revise-archive；再次 pnpm check 退出 0，actions.test.ts 5/5 定向回归通过。其余 110 项已成功且代码未变的结果沿用；合计 111 项现有 / 新增测试均有适用成功证据，不把失败的首次 pnpm test 描述为整次全绿，也未机械重跑全部。
- 新操作 inputs、Owner Apply / rollback、Archive 执行 / 故障 / 查询 / 竞争分别放入 tests/operation-*.test.ts、apply-resolution.test.ts 和 archive-*.test.ts；共用准备的阶段、直接批准、故障和测试锁处置均显式可查。产品批准是隔离夹具数据，不是本仓库的 Reviewer verdict。
- [product-test-evidence](artifacts/product-test-evidence/)：真实 CLI 原始命令 JSONL，以及停止进程前的有限 Archive attempt 输入 / 调用 / 原始结果 / 当前 Run 场景快照。包括原生成功、真实验证 / 碰撞失败、丢失响应 / 错身份路径、新进程 finish、两处 RP-D-001 中断、两个真实执行 / finish 写者竞争及提交点中断。必要正式证据不只留在 .tmp；沙盒仍可由维护中 TS 测试与受控夹具重建。
- [archive-instructions-cli.json](artifacts/archive-instructions-cli.json)：真实当前 Archive --operation archive 指引退出 0；有限 Run / 入口 / manifest / tasks 字节比较未变。
- [strict-validate.json](artifacts/strict-validate.json)：固定 OpenSpec 主规格 3/3 valid、issues=[]，当前 Change valid、issues=[]。结构检查不代替语义批准。
- [refactor-verification.json](artifacts/refactor-verification.json)：第一组已有 41 项回归通过。移动 CLI import 时曾将 shebang 放错位置，已修正并通过 build。另一次分组测试发现终态 Run / 旧 manifest 的 next 提前完成，已按实际 binding 修正；碰撞夹具错误使用 UTC 日期，核对固定工具本地日期后修正，两处定向重测通过。首次 lint 的未使用 import 和抽取提交职责时缺少 object import 均已具体修正，最终 check 通过。
- 不认证任意掉电或无法确定原生子进程停止的现场；调用已开始但没有可靠退出见证时停止。没有自动解锁 / kill / ignore-lock；测试锁仅在明确受控沙盒、同 token 且原工作进程 not-found 后由夹具显式处置。没有正式 Delivery Full Test、生产或 Git 验证结论。

## 本轮维护观察

维护中 TypeScript 物理行数，排除 fixtures / 生成物 / 历史 Run；只用于当次职责判断，没有独立维护台账或硬门槛。

| 目录 | 第一 | 第二 | 第三 |
|---|---|---|---|
| src | adapters/openspec.ts 346 | application/archive.ts 338 | core/actions.ts 320 |
| tests | action-write.test.ts 467 | planning-cli.test.ts 444 | query.test.ts 335 |
| scripts | proofs/mvp-d01-c-explore.ts 678 | proofs/mvp-d01-d-explore.ts 487 | proofs/mvp-d01-a-explore.ts 463 |

可靠受审基准见当前 design §6：旧 application/actions.ts 466 → 243，先分离指引 / Owner 处置再扩展；OpenSpec adapter 317 → 346，操作协议详细解析在 openspec-operations.ts；core/actions 282 → 320，新增 typed Archive / next 与回退声明，保持领域职责。Archive application 338 为新模块，不伪造增长基准；有限效果在 archive-effects.ts 268，本地提交在 archive-commit.ts 106，编排与实际 I/O 职责已经分离。tests 两个原大领域文件仍 467 / 444，没有追加 D 大流程；query 335 与第三个 proof 没有可靠旧计数，不宣称增长。C / D proof 678 / 487 保留受审限定 Explore 事实，未继续追加产品验收；如果以后需要扩展，先分离 Apply 记录流与 Archive 效果组，保留简单 TS 入口和旧输出。AGENTS 与产品 Review Apply 方法已同步此时机要求。

## 独立 Review Apply 交接

当前 Author result=implementation-ready-for-review；交接只指向 036，等待独立 Reviewer 对 034 / 035 的合同与本次实现、真实错误 / 恢复、查询及维护结论补审。不得从任务完成、工具成功或本记录推导 approved。最终任务读回见 [apply-inputs-021.json](artifacts/apply-inputs-021.json)，真实交接见 [handoff-readback.json](artifacts/handoff-readback.json)。

当前仓库 Change 仍在 openspec/changes/apply-revision-and-native-archive，Delivery open、累计完成数 3、D 仍活动。旧 Run / 编号 / verdict 保留，所有原生归档仅发生在受控沙盒；未执行当前 Change Archive、Git、Delivery Full Test / Close / Reopen、下一 Change 激活或全局 .tmp 清理。
