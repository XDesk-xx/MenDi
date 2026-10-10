---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-revise-apply-01
actionType: revise-apply
role: author
run: "010"
status: completed
actionStatus: completed
result: implementation-ready-for-review
nextAction: review-apply
nextRole: reviewer
revisesRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/008-apply/run.md
reviewRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/009-review-apply/run.md
date: 2026-10-10
---

# MVP-D02-A Revise Apply

Owner 指令：revise-apply。保持 Author，按 [009 Review Apply](../009-review-apply/run.md) 的 RA-A-001 / RA-A-002 修正 008 实现；保留旧 Run、编号与 verdict，完成后停在独立 Review Apply。现有方案仍适用，无需重做 Explore / Propose。

本次对照副本仅保存实际修改的 src/adapters/test-process.ts、src/application/tests.ts 和 tests/test-execution.test.ts，分别位于 artifacts/before 的同名短文件（应用层为 tests.ts）。不复制历史 Run。

## 修订范围与实际方法

固定 OpenSpec 1.14.1 的 list / status 确认本地 nearest root；Apply 初始 all_done 28/28 不代表 009 已批准。按实际 tasks sourcePath / line 重新打开 5.3 与 5.4（26/28），沿用其余完成项。当前只澄清既有日志完整性和诚实查询合同，没有新增能力或重做 Explore / Propose。

| 发现 | 实现及必要验证 |
| --- | --- |
| RA-A-001 | src/adapters/test-process.ts 按 writeSync 返回字节数推进 Buffer offset，余下字节继续写；零进展抛错进入既有 failure / unknown / 保留现场路径。新 tests/test-log-integrity.test.ts 在真实 pnpm / 前台脚本执行中，对实际 stdout / stderr chunk 注入连续合法短写，以原始 Buffer 验证完整内容；部分写后零进展与抛错均 unknown / 非零、锁与必要现场保留。没有 hash 清单、大小 gate 或新持久协议。 |
| RA-A-002 | src/application/tests.ts 仅在文件观察稳定且持久 outcome 非 unknown 时让 status ok=true。底层 stable 保持文件观察含义，原 record 不被重写。tests/test-execution.test.ts 使用真实 SIGTERM / finished unknown，确认实际 child 已退出；只在 .tmp 下受控目标中核对自身 pid / operation / 同一锁字节，夹具显式 release 自身锁。之后异目录新 CLI 仍 ok:false / unknown / exit 1，stable:true、locked:false，全部文件快照字节保持。已知 failed / interrupted / not-run 新进程可读成功继续回归。产品没有自动解锁、旧 pid 推断或修复查询。 |

同步澄清当前 Change 的 design.md、test-execution delta 和 tasks 5.3 / 5.4，以及 README 的日志与 status 说明。其他 delta、proposal、旧 proof / Run / verdict 和主规格保持。回归执行输出与实际 CLI 原始结果仅保存于 artifacts/test-scenes，摘要直接引用，不复制历史证据树。

## 维护规模与职责

当次物理行数统计排除 tests/fixtures、生成物和历史，前三名如下；与 008 完成后、009 核对的现状一致，没有为降低行数拆转发层。

| 目录 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | adapters/openspec.ts 346 | application/archive.ts 333 | core/actions.ts 320 |
| tests | action-write.test.ts 467 | planning-cli.test.ts 444 | query.test.ts 335 |
| scripts | proofs/mvp-d01-c-explore.ts 678 | proofs/mvp-d01-d-explore.ts 487 | proofs/mvp-d01-a-explore.ts 463 |

可靠增长基准是本次修改前的三个直接副本：test-process.ts 149→159（完整写入循环与格式换行），应用层 tests.ts 234→234（查询确认条件），test-execution.test.ts 280→300（明确处置后的只读 unknown 场景）；新日志完整性测试 65 行。进程适配、查询编排、执行场景与日志故障测试职责明确，没有需先整理再扩展的混杂职责。旧 C / D 长 proof 本轮未扩展，继续限定历史用途；以后确需扩展时再先分开 Apply 记录流与 Archive 效果组，不为行数单独开流程。

## 验证结果与限制

| 命令 / 范围 | 实际结果与直接证据 |
| --- | --- |
| pnpm check | exit 0；79 文件格式、基础 lint 与 src / scripts / tests 三配置真正类型检查通过，见 [check.log](artifacts/check.log) |
| pnpm build | exit 0，见 [build.log](artifacts/build.log) |
| node --test --test-concurrency=2 tests/test-log-integrity.test.ts tests/test-execution.test.ts tests/test-dependencies.test.ts tests/test-entries.test.ts | exit 0；20/20 passed，0 fail / skip / cancelled，约 169 秒，见 [regression.log](artifacts/regression.log)；原始执行 / CLI 输出在 [test-scenes](artifacts/test-scenes/) |
| 固定 OpenSpec validate sequential-changes-and-test-entrypoints --strict --json | exit 0，1/1 valid、无 issues，见 [validate.json](artifacts/validate.json) |
| 固定 OpenSpec instructions apply 的任务读回 | 5.3 完成后 27/28，再完成 5.4 后 all_done 28/28；逐项核对实际 sourcePath / line / 描述，见 [task-completion.json](artifacts/task-completion.json) |

根工程检查 / 构建使用 COREPACK_ENABLE_NETWORK=0、pnpm_config_verify_deps_before_run=warn；保留既有 node_modules / workspace 不同步警告，没有为消除警告安装依赖。这不改变产品依赖预检 error 合同；本轮真实依赖 / 脚本运行回归确认该合同继续成立。

沿用 [008 Apply](../008-apply/run.md) 的全量 139/139 回归与 [009 Review Apply](../009-review-apply/run.md) 对顺序关联、批次、两次 Archive / 恢复和其他未变部分的有效验证；本轮只重跑直接受影响的四组，不重跑旧 Explore proof 或正式 Delivery Full Test。短写 / 零进展 / 抛错是对真实执行日志 API 的受控故障注入；锁处置仅发生在确认停止的 .tmp 测试夹具，不认证一般残留锁可自动清理。执行记录保存必要事实，actor / pid 不认证真人身份或后台进程。

## 交接

010 为新的完整 Author 修订，承接 009 的 RA-A-001 / RA-A-002；当前 manifest / next 仅指向 010，由本 Run 的直接引用定位 008 / 009。保留旧编号、verdict 与原始证据，不自签 approved。

停在独立 Review Apply，请 Reviewer 补审两项修订及必要依赖，沿用其他仍有效结论。任务全勾、测试和结构验证不是批准。新进程 status / next 实际读回保存于 [readback.json](artifacts/readback.json)。D02 保持 open，D01 保持 closed，项目累计归档数仍为 4；未执行根项目 Archive、Git、正式 Full Test / Close / Reopen 或下一 Change 激活。
