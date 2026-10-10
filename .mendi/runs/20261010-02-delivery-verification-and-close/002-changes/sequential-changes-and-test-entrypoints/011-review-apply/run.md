---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-review-apply-02
actionType: review-apply
role: reviewer
run: "011"
status: completed
actionStatus: completed
result: approved
verdict: approved
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/010-revise-apply/run.md
---

# MVP-D02-A Review Apply 补审

Owner 指令：使用 Open Code Review delegate，重点补审 RA-A-001 / RA-A-002，其余沿用有效结论。固定审核 [010 Revise Apply](../010-revise-apply/run.md)，按本项目 Review Apply 方法及 Open Code Review delegate Skill 执行；OCR 只作文件选择与规则辅助，语义结论由独立 Reviewer 给出。

**verdict：approved。** RA-A-001 / RA-A-002 均已关闭，无新增阻断项。批准当前 010 修订后的实施结果进入 Archive；审核批准不代表已经实际归档。

## 修订核对

- **RA-A-001：实现已覆盖原缺口。** 对照 010 保存的 `before/test-process.ts`，实际变化是按 `fs.writeSync` 返回字节数推进 Buffer offset，余下部分继续写；零进展抛错进入原有 failure / unknown / 保留锁路径。异常不会被已确认停止或正常 exit 0 覆盖成 passed。stdout / stderr 共用该处理，没有新增日志 hash、大小门槛或持久化协议。
- **RA-A-002：实现已覆盖原缺口。** 对照 `before/tests.ts`，只在应用层将成功条件改为观察稳定且持久 outcome 非 unknown。底层 stable 继续表达文件观察稳定，record 原样输出；CLI 按 ok=false 返回 exit 1，已知 failed / interrupted / not-run 保持可读成功。没有靠旧 pid 推断终态、重写结果或自动清锁。
- 新日志测试在真实 pnpm / 前台脚本中注入连续合法短写、部分写后零进展和抛错，核对两个输出流的原始 Buffer、完整 stdout、失败 unknown 与锁保留。补充的异常退出测试核对真实 child 已停止，仅在隔离夹具核对自身同一锁后显式处置，随后由异目录新 CLI 查询，断言 unknown / exit 1、stable=true、locked=false，查询前后文件字节不变。原 failed / interrupted / not-run 查询用例继续覆盖兼容性。
- README、design Decision 6、test-execution delta 和 tasks 5.3 / 5.4 是对既有合同的明确化，与两处修复一致，不构成新方案。其余范围沿用 [009](../009-review-apply/run.md) 的有效结论；009 的原 verdict 保留，不重写历史。

## OCR delegate 范围

preview 前显式排除 `.mendi/**`、旧 archive、生成物、旧 proof 与未受影响模块，再补入默认排除的本次文档和回归。执行 `ocr delegate preview --format json --exclude <本轮范围排除项> --background <补审范围>` 与两次 `ocr delegate rule --format json <paths>`，均 exit 0；未运行 OCR 外部 LLM review。

实际选入 `total_files=5`、`reviewed_files=5`、`skipped_files=0`、`coverage_rate=100%`，另补审 6 项文档 / 测试；逐项身份、处理原因见 [coverage.json](artifacts/coverage.json)，原始 preview 与规则在同目录。工作区相对 Git HEAD 仍包含整个 Change，因此语义修订差异以 010 的三个修改前副本及新增测试为依据；不把未受影响的旧证据树计入本轮覆盖率。只读补看 CLI 的 ok → exitCode 接线，沿用其余既有结论。

## 维护规模与职责

独立重数维护代码物理行数，排除受控夹具、生成物和历史；本轮前三与 009 / 010 相同。

| 目录 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | `adapters/openspec.ts` 346 | `application/archive.ts` 333 | `core/actions.ts` 320 |
| tests | `action-write.test.ts` 467 | `planning-cli.test.ts` 444 | `query.test.ts` 335 |
| scripts | `proofs/mvp-d01-c-explore.ts` 678 | `proofs/mvp-d01-d-explore.ts` 487 | `proofs/mvp-d01-a-explore.ts` 463 |

直接对照 010 的修改前副本：test-process.ts 149→159，应用层 tests.ts 234→234，test-execution.test.ts 280→300；新 test-log-integrity.test.ts 65 行。日志保存、应用查询和故障回归职责明确，无需进一步拆分，也没有纯转发层。旧 C / D proof 未扩展，保留限定历史用途；若以后确需扩展再按既有约定整理。不为行数另建台账或硬 gate。

## 独立验证

| 命令 | 实际结果 |
| --- | --- |
| `pnpm check` | exit 0；79 文件格式 / lint，src / scripts / tests 三配置类型检查通过，见 [check.log](artifacts/check.log) |
| `pnpm build` | exit 0，见 [build.log](artifacts/build.log) |
| `node --test --test-concurrency=2 tests/test-log-integrity.test.ts tests/test-execution.test.ts` | exit 0，10/10 passed，0 fail / skip / cancelled，约 110 秒，见 [focused.log](artifacts/focused.log) |
| 固定 OpenSpec `validate sequential-changes-and-test-entrypoints --strict --json` | exit 0，1/1 valid、issues=[]，见 [validate.json](artifacts/validate.json) |
| 固定 OpenSpec `instructions apply --change sequential-changes-and-test-entrypoints --json` | exit 0，all_done、28/28，见 [apply-instructions.json](artifacts/apply-instructions.json) |

场景原始执行结果及日志只存一份于 artifacts/scenes；测试由受控源码在新临时目录重建，不依赖上轮临时现场。本轮同时覆盖实际取消与后代停止、启动 / 保存 / 读回 / 锁释放故障、未知意图和新进程查询。两项发现对应断言全部通过。

工程检查使用 `COREPACK_ENABLE_NETWORK=0`、`pnpm_config_verify_deps_before_run=warn`，保留既有 node_modules / workspace 不同步警告，未为消除警告安装或修复根依赖；不改变产品 error 预检合同。010 的四组 20/20 日志已核对，未受影响的依赖入口检查及 009 对关联、批次、Archive 的有效结论沿用；不机械重跑完整 139 项、旧 Explore 或正式 Full Test。

短写与写入错误属于真实子进程日志 API 的受控注入，不声称自然发生了磁盘故障；测试中的锁处置仅限确认停止的自身夹具，不认证通用自动清锁。

## 交接

下一步为 Author `archive`，当前输入只指向本 Run，固定 authorRunRef 定位 010；009 的 changes-requested 和其他旧编号、材料、verdict 保留。本轮未修改实现或 Author 合同，不增加 Author Run，不重开 Explore / Propose。

完成后新进程 status / next 读回见 [readback.json](artifacts/readback.json)。D02 保持 open，D01 保持 closed，累计归档数仍为 4。停止在 Archive 边界，未执行根项目归档、Git、正式 Full Test / Close / Reopen 或激活后续 Change。
