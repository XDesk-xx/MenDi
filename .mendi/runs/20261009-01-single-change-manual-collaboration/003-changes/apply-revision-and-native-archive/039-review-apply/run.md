---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
actionId: apply-revision-and-native-archive-review-apply-02
actionType: review-apply
role: reviewer
run: "039"
status: completed
result: approved
date: 2026-10-10
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/038-revise-apply/run.md
---

# MVP-D01-D Review Apply 补审

**verdict：approved。** 独立审核 [038 Revise Apply](../038-revise-apply/run.md)，关闭 037 的 RA-D-001 / RA-D-002，无新增阻断项。结合 037 对其余实现的核对和仍适用的验证，当前 Change 可进入单独授权的 Archive；本轮未执行实际归档。

## 修订核对

- **RA-D-001 已关闭。** archive-effects 使用本次元数据中的布尔值 `retire_capabilities: true`、调用前实际需求和完整 REMOVED 集合判断退役；没有新增 / 修改 / 重命名时才允许预期主规格不存在。仍检查归档元数据及源材料一致，普通缺失、剩余需求、必要输入缺失和元数据变化继续拒绝。独立重跑证明真实原生正常 execute、新进程在工具不可用时 local-only finish、repeated finish 均成立，原生与计数各一次，终态正文不重写。
- **RA-D-002 已关闭。** archive-attempt 在既有锁内检查当前 Run 的规范占号，从持久号与已占用号的最大值继续分配，并独占创建新目录；不覆盖旧目录，也不以占号认证原生已调用。真实 before-run-commit 中断分别从 prepared / attempt=0 和 none / attempt=1 恢复，另一次显式 execute 使用 attempt-002 / attempt-003 完成，旧输入和标记字节保留。非法号、安全整数溢出、非目录及外部 junction 在原生调用前拒绝。
- application/archive 的修订只将占号实现移到所属 adapter；调用前批准 / 输入 / 无效果复核仍先执行，invoking 标记仍先于原生调用。finish 不自动重试、不解除锁；真实竞争及既有部分提交恢复回归保持。
- 对照 038 保存的修改前材料核对两处代码、design、action-runs delta 和 tasks；新增第 7 组是落实 037 所需局部修订，没有扩大目标或改变独立批准边界。Archive 方法、README 与 context 一致；无需再重做 Explore / Propose。

## 独立验证

| 命令 / 检查 | 本次实际结果 |
|---|---|
| `pnpm check` | exit 0；60 个文件格式 / lint 通过，src、scripts、tests 真正类型检查通过；[日志](artifacts/check.log) |
| `pnpm build` | exit 0；[日志](artifacts/build.log) |
| `node --test tests/archive-retirement.test.ts tests/archive-attempts.test.ts tests/archive-execute.test.ts tests/archive-effects.test.ts tests/archive-finish.test.ts tests/archive-query.test.ts tests/archive-concurrency.test.ts tests/apply-resolution.test.ts` | exit 0，30/30，无跳过；包括两项修订的 6 个新用例及 24 个相关回归；[日志](artifacts/tests.log) |
| 固定 OpenSpec `validate apply-revision-and-native-archive --strict --json` | exit 0，valid=true、issues=[]；[结果](artifacts/strict-validate.json) |
| 固定 OpenSpec `instructions apply --change apply-revision-and-native-archive --json` | exit 0，all_done、24/24；[结果](artifacts/apply-inputs.json) |

本次没有重跑全部 117 项测试；037 的 111/111 对未受影响领域继续适用。本次补审独立运行受影响的 30 项，不把 Author 结果代作独立验证，不称为正式 Delivery Full Test。沙盒测试的原生归档没有操作本项目当前 Change；未知写者、缺退出见证及任意掉电恢复仍不在保证范围。

## OCR delegate 覆盖

使用 Open Code Review 的 delegate Skill；`ocr delegate preview --format json` 选择工作区文件，`ocr delegate rule --format json <paths...>` 解析规则，当前 Reviewer 完成语义审核，未调用 OCR 外部模型。

本次为局部补审：preview 共 251 项，其中可审核 `total_files=157`、`reviewed_files=7`、`skipped_files=150`、`coverage_rate=4.46%`；每项均按 `(path,status)` 记录，accounted_rate=100%。7 项包括三份修订实现、两份直接修改前对照和两份当前交接。OCR 默认排除项另人工补查 12 项（新测试、规划 / 方法、README 与直接 Author 记录及对照），82 项保留跳过原因。未变领域沿用 037，历史输出不作全量重审；该百分比描述全工作区列表的本次重审比例，不是产品测试覆盖率。

见 [文件清单](artifacts/ocr-preview.json)、[规则](artifacts/ocr-rules.json)、[逐项处理](artifacts/ocr-coverage.json)。本次新增 findings 为空；原 037 changes-requested 保留，关闭结论由本 Run 记录。

## 行数与维护观察

独立统计维护 `.ts` 文件物理行数，包含空行。基准为 037 已核对结果及 038 保存的两份直接修改前源码。

| 类别 | 当前前三名 | 本轮变化与处理时机 |
|---|---|---|
| src | `src/adapters/openspec.ts` 346；`src/application/archive.ts` 331；`src/core/actions.ts` 320 | archive 编排 338 → 331；其余两项与 037 相同。占号职责已移出，当前无需为行数继续拆分 |
| tests | `tests/action-write.test.ts` 467；`tests/planning-cli.test.ts` 444；`tests/query.test.ts` 335 | 与 037 相同；新增 retirement 112 / attempts 86 行，按场景分组，未追加旧大流程 |
| scripts | `scripts/proofs/mvp-d01-c-explore.ts` 678；`scripts/proofs/mvp-d01-d-explore.ts` 487；`scripts/proofs/mvp-d01-a-explore.ts` 463 | 与 037 相同；保持原 Explore 用途，不承担新产品验收 |

archive-effects 268 → 283 是同职责的退役读回；新 archive-attempt 38 行实现实际目录检查与分配，没有纯转发层。今后继续增加独立职责时再按职责整理；旧 C / D proof 若需要扩展，先分开 Apply 记录与 Archive 效果组。当前不因行数另开修订。

引用仍按当前操作所需输入读取；这次只检查当前 Run 占号，没有扫描其他 Run 正文、增加 hash 清单、依赖图、硬容量门槛或查询 gate。context 已收窄到当前背景和最近交接入口，符合简单可控的约定。

## 交接

下一步为 Author Archive，等待明确归档指令。当前 Delivery 仍 open，D Change 活动未归档，累计完成数仍为 3；不自动执行 Git、正式 Delivery Full Test / Close 或下一 Change。只更新本次审核和当前交接，历史 Run、编号及 verdict 保留。
