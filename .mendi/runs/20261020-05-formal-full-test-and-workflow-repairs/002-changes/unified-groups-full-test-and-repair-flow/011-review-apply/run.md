---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-review-apply-01
actionType: review-apply
role: reviewer
actor: codex-independent-reviewer
run: "011"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: implementation-approved-with-independent-targeted-tests
nextAction: archive
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/review-apply/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/010-apply/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/010-apply/run.md
---

# D05-A 独立 Review Apply：正式 groups-v1 完整执行与修复交接

**结论：approved（限本 Change 的 Apply 实现），无阻断 Finding。** 固定 Author 为 [010 Apply](../010-apply/run.md)，以已批准的 008 Propose / 009 Review、当前真实源码、OpenSpec 四份 delta 与 13 项任务为审核基准。测试绿及任务勾选并非自动批准；以下为 Reviewer 独立代码审查与本次真实执行结果。此前 003/007 的 changes-requested 和 005/009 的 approved 及 010 Author 不改写。

## 独立核对的主合同

| 业务/失败边界 | 源码与真实验证 | 判断 |
| --- | --- | --- |
| 新正式写入只支持 groups-v1 全必需 initial | `src/application/delivery-full-test.ts:27–38`；`src/application/group-admission.ts:28–45`；`src/core/group-records.ts:181–246`；`tests/group-attempt.test.ts`、`group-boundaries.test.ts` | 新 command/continue/retest、少必需组在占号前拒绝；旧状态不被冒充正式 PASS |
| 本次完整父子结果直接 `passed` | `src/core/formal-attempt.ts:6–18`、`src/core/group-report.ts:90–265`、`src/adapters/group-store.ts:35–170`、`src/application/group-attempt.ts:195–338` | 普通双失败、构建依赖、skip/TODO/零业务、wrapper 矛盾、取消与异常读回不伪造 `passed`；未知保留现场 |
| 旧 command failed → 真实 Repair/Review → 新全量 | `src/application/group-admission.ts:55–175`、`src/adapters/delivery-verification.ts:159–235`，`tests/group-verification.test.ts` | 无须构造旧组来源；审核状态、陈旧批准、空正文/自签等准入拒绝，重测全部必需组且旧失败字节不变 |
| 纯环境准备恢复窄例外 | `src/adapters/group-environment.ts:7–90`、`src/core/group-report.ts:219–256`，`tests/group-environment.test.ts` | 需已有准备失败报告、项目资源身份、直接材料一致性及恢复/清理声明；业务断言失败、外部/unknown/锁等不许旁路，实质变化仍须 Repair/Review |
| 当前 v2 typed Close 与历史只读 | `src/application/delivery-lifecycle.ts:107–151,217–295`、`src/core/delivery-lifecycle.ts:86–118`、`src/core/rounds.ts:159–180`、`src/adapters/baselines.ts:40–79` | 新 Close 只用 `testAttemptRunRef` 并对齐当前 `deliveryRunRef`；旧 selector 不可新写，老 Run/Close 只读、来源 Reopen/跨轮基线保留 |
| status/next、授权与实际作用域 | `src/core/delivery-next.ts`、`src/application/project.ts:89–163` 和 `src/application/delivery-full-test.ts:53–103` | 执行 passed 仅提示 Owner 另授权 Close；unknown 停止；不自动 Archive/Git/部署/下一 Change |

只核对了当前 Change 触及的非 UI 行为，没有按 UI 清单强制引入 Storybook。隔离测试的 Author/Reviewer actor 及 approved 仅为产品输入负例，不是本 MenDi 真实审核的替身。

## Reviewer 当次 proof 与真实输出

本次新增的独立 TypeScript 入口和最小结果均在本 Run 的 [artifacts](artifacts/) 下：
- [reviewer-tests.ts](artifacts/reviewer-tests.ts) → [focused-tests-result.json](artifacts/focused-tests-result.json)、原始 [focused-tests.tap.log](artifacts/focused-tests.tap.log)：**8 个受影响测试文件，31 tests、31 passed、0 failed、0 skipped，exit 0**。覆盖新 Full Test、环境恢复、历史只读、typed Close、失败/取消/锁/持久化负例和 CLI。
- [reviewer-compat.ts](artifacts/reviewer-compat.ts) → [compat-tests-result.json](artifacts/compat-tests-result.json)、原始 [compat-tests.tap.log](artifacts/compat-tests.tap.log)：**5 个补充关联测试文件，14 tests、14 passed、0 failed、0 skipped，exit 0**。覆盖 earlier baseline/历史 Repair/构建复用相关的修订回归、Close/Reopen、迁移轮次。
- [reviewer-engineering.ts](artifacts/reviewer-engineering.ts) → [engineering-results.json](artifacts/engineering-results.json) 和各自原始 [check.log](artifacts/check.log)、[build.log](artifacts/build.log)、[openspec.log](artifacts/openspec.log)、[diff-check.log](artifacts/diff-check.log)：Reviewer 自行执行 `pnpm check`、`pnpm build`、固定 OpenSpec 1.14.1 strict validate、`git diff --check`，**四项分别 exit 0**。三份 Reviewer TS 入口均经独立 strict TypeScript 检查通过（当前 `tsconfig.json` 负责第一份，其余由显式 strict tsc 命令检查）。
- Reviewer 校验同一当前源码，未从早期失败读取旧 PASS 掩盖新的问题。Author 010 报告过初轮扩大回归 102 tests 中 3 项失败，随后按范围修正及定向重测；本次 Reviewer 独立包含对应 baseline/历史测试与构建复用场景。**没有声称最终完整重跑 Author 最初的全部 102 项**，仅称独立选择的 45/45 通过。原 Author 失败材料和旧结果保留。

## 维护职责与代码增长核对

Reviewer 独立按维护中的 TypeScript 物理行数统计，排除 `tests/fixtures` 受控生成输入和无关派生物，不将数值设为 gate：

| 目录 | 前三名及物理行数 |
| --- | --- |
| `src/` | `src/application/project.ts` 374；`src/application/delivery-lifecycle.ts` 368；`src/application/group-attempt.ts` 361 |
| `tests/` | `tests/action-write.test.ts` 467；`tests/planning-cli.test.ts` 444；`tests/delivery-repair.test.ts` 395 |
| `scripts/` | `scripts/proofs/mvp-d01-c-explore.ts` 678；`scripts/proofs/mvp-d01-d-explore.ts` 487；`scripts/proofs/mvp-d01-a-explore.ts` 463 |

当前 Git HEAD `5a7762b` 作为本轮提交前的可靠可见基线：`src/core/group-records.ts` 244→312（+68，集中于 v2 结构解析/校验）；`src/application/group-admission.ts` 218→230（+12，新增恢复/审核准入且环境解释独立下沉）；`src/core/delivery-runs.ts` 372→257（-115）；`src/application/candidate-verification.ts` 260→41（-219）；`src/application/delivery-full-test.ts` 286→103（-183）；`src/application/delivery-lifecycle.ts` 371→368；`src/application/group-attempt.ts` 367→361。新 `delivery-next.ts` 为实际交接判断职责，`formal-attempt.ts` 为小型确定性正式结果聚合，不是无功能转发。观察到的增长没有形成必须在本 Change 退回拆分的混杂职责；后续扩展 `group-records/group-admission` 时按当前真实变化复核。

## 适用限制与停止边界

- 本次 Reviewer 验证的是**隔离产品夹具的实际执行**与当前 worktree；没有对根 manual-bootstrap MenDi 进行正式 Full Test，也没有证明新版已装入稳定包或在 DreMo 真实项目上可用。打包、安装、目标迁移和后续正式 Delivery 验收仍按各自授权边界进行。
- 环境恢复可信度以目标 runner 实际准备失败报告、显式材料范围及 Author 实地归属/恢复核对为前提；程序不会认证所有未声明的源码、第三方进程或无限制并发竞争。不得把此审核扩展为系统已自动识别任意外部资源。未知现场仍应 fail-closed。
- 工程检查与已列 45 项测试不能替代未来真实授权的完整正式 Full Test / Close；旧 D01–D04 Run、Close、verdict 保持原样，D05-B/C/D 未触碰，不从本次批准自动启动。

**交接：`archive / author / awaiting-instruction`。Reviewer 停下，不进行 OpenSpec Archive、根 Full Test、Close、Git、稳定安装或外部目标写入。**
