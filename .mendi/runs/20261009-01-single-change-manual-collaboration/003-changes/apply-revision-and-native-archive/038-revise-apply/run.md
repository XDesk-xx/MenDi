---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
batchId: 003-changes
actionId: apply-revision-and-native-archive-revise-apply-01
actionType: revise-apply
role: author
run: "038"
status: completed
result: revision-ready-for-review
date: 2026-10-10
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/037-review-apply/run.md
revisesRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/036-apply/run.md
nextAction: review-apply
nextRole: reviewer
---

# MVP-D01-D Author Revise Apply

Owner 指令 revise-apply；保持 Author，局部修订 037 对 036 的 RA-D-001 / RA-D-002。旧 Run、编号与 verdict 保留；本次交独立 Review Apply，不给 Reviewer verdict，不重做完整 Explore / Propose。原 21 项任务不撤销，新增第 7 组逐项实施 / 验证后按固定工具 sourcePath / line 勾选并读回。

## 实质修订

- **RA-D-001**：archive-effects 以本次元数据布尔值 retire_capabilities: true 和完整 REMOVED 输入解释“主规格应不存在”。调用前主规格必须有需求，删除集合须等于全部需求，且没有新增 / 修改 / 重命名。仍核对实际归档源集合和元数据；未声明、仍有未涉及需求、主规格原不存在或元数据变化的缺失均不认证。预期退役却文件仍在也拒绝。原生负责验证与删除，产品未新增语义同步引擎。
- **RA-D-002**：新增 archive-attempt adapter 承担当前 Run 的目录检查、安全整数分配和独占占号，application 只接线编排。锁内从持久尝试号与当前规范占号最大值继续编号，保留调用标记提交前遗留输入和目录，不覆盖、读全部历史或据目录猜已调用。prepared / none 的必要前置、无效果复核、显式再次 execute 和锁处置边界保持；非规范号、溢出、非目录和外部 junction 在调用前拒绝。
- 同步 design、action-runs delta、第 7 组 tasks、Archive 方法和 README；OpenSpec context 收窄为当前背景与最近 Run 入口，不重复旧完整历史。新验收按 retirement / attempts 场景分组，旧 proof 不追加。

## 验证与适用边界

| 本轮命令 / 验证 | 实际结果 |
|---|---|
| 修复前两个新增正向用例 | exit 1，0/2 通过，两个缺口均复现；[简记](artifacts/red-verification.md)，完整原缺陷证据仍在 037 |
| pnpm format | exit 0，仅格式化两个新测试文件 |
| pnpm check | exit 0；格式 / lint / src、scripts、tests 真正 typecheck；[日志](artifacts/check.log) |
| pnpm build | exit 0；[日志](artifacts/build.log) |
| node --test tests/archive-retirement.test.ts tests/archive-attempts.test.ts | exit 0，6/6 通过，无跳过；[日志](artifacts/revision-tests.log) |
| node --test tests/archive-execute.test.ts tests/archive-effects.test.ts tests/archive-finish.test.ts tests/archive-query.test.ts tests/archive-concurrency.test.ts tests/apply-resolution.test.ts | exit 0，24/24 通过，无跳过；[日志](artifacts/related-tests.log) |
| 固定 OpenSpec validate apply-revision-and-native-archive --strict --json | exit 0，valid=true、issues=[]；[结果摘要](artifacts/strict-validate.json) |

本轮共 30/30 定向测试通过。037 的完整 111/111 回归与未受影响主规格校验对其未变领域仍适用；不把本轮描述为完整 117 项重跑，也不称为正式 Delivery Full Test。

真实固定 CLI 退役在正常 execute 完成；native-returned 中断后，另一个进程在工具不可用时 local-only finish 完成，repeated finish 保持终态字节、一次原生调用及一次计数。对照覆盖未声明 / 部分删除时丢失主规格、归档元数据变化和必要 inputs 缺失。

真实 before-run-commit 退出 88 分别覆盖 prepared 首次执行和已保存 none 的重试：持久 Run 不变、原生尚未调用；另一次显式 execute 分别使用 attempt-002 / attempt-003 完成。旧目录各文件进行 Buffer 字节比较，保持原样，原生调用和完成计数各一次。非法号、溢出、非目录与越界占号也被拒绝。

[product-test-evidence](artifacts/product-test-evidence/) 保存真实命令及 Run / attempt / 原始响应有限快照；[reserved-attempts.json](artifacts/reserved-attempts.json) 单独保留两处调用标记提交前占号的输入与 invocation 副本，不依赖 .tmp 作为唯一证据。受控 TS 测试和夹具可以重建场景。测试锁只在隔离项目且原写者 not-found、同 token 字节读回后显式处置，不是本产品的自动解锁能力。

不认证任意掉电、未知外部写者或缺退出见证的原生进程；没有新增 hash 清单、引用中心、依赖图、历史补证或自动重试。Archive 沙盒批准是夹具数据，不是当前 Change 的 Reviewer 批准。

## 当次维护观察

物理行数含空行，基准为 037 与本轮修改前实际文件；无独立台账或硬门槛。

| 目录 | 当前前三名 | 基准与职责判断 |
|---|---|---|
| src | adapters/openspec.ts 346；application/archive.ts 331；core/actions.ts 320 | 037 为 346 / 338 / 320；编排移出占号职责，338 → 331，其余两项未编辑 |
| tests | action-write.test.ts 467；planning-cli.test.ts 444；query.test.ts 335 | 037 同值，领域未扩写；新 retirement 112 / attempts 86 行独立场景组 |
| scripts | proofs/mvp-d01-c-explore.ts 678；proofs/mvp-d01-d-explore.ts 487；proofs/mvp-d01-a-explore.ts 463 | 037 同值，本轮未扩写；限定原 Explore 用途，不承担新增产品验收 |

archive-effects 268 → 283 行，新增 15 行是同职责的定向退役效果判断；新 archive-attempt 38 行是实际路径 / 编号 / 占号实现，没有纯转发层。编排保持操作前置、外部调用和有限 finish；后续扩展新的文件提交职责时继续放在所属 adapter。当前无需因行数单独拆旧测试或 proof；若再扩展旧 C / D proof，先分开 Apply 记录流与 Archive 效果组，保留简单 TS 入口与原输出。

## 独立补审与停止点

独立 Reviewer 读取本 Run，补审两项实现、局部规划修订和新增证据；037 原 changes-requested 不改，035 / 036 的适用历史结论保留。当前 manifest 的最小 next 只指向新的 Author 038，不复制全部历史链。

交接读回与最后任务完成状态保存于 artifacts/apply-inputs-final.json 和 artifacts/handoff-readback.json。当前 Delivery open、D Change 活动未归档，项目累计完成数仍为 3。未实际 Archive 当前 Change、Git、Delivery Full Test / Close / Reopen、激活下一 Change 或清理 .tmp；本次停在独立 Review Apply。
