---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: formal-full-test-and-scoped-repair
planningSlot: MVP-D02-B
batchId: 002-changes
actionId: formal-full-test-and-scoped-repair-review-apply-02
actionType: review-apply
role: reviewer
run: "020"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: archive
nextRole: author
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/formal-full-test-and-scoped-repair/019-revise-apply/run.md
---

# MVP-D02-B Review Apply 补审

固定独立审核 019 revise-apply，重点复核 RA-B-001 / 002 / 003；其余沿用 018 仍有效结论。使用 Open Code Review delegate 作文件和规则辅助，不调用外部 LLM。

**verdict：approved。** 三项发现均关闭，无新增阻断问题。当前修订符合既有方案；本次未修改实现，未执行本项目 Archive、根正式 Full Test、Close 或 Git 写操作。

## 三项补审结论

| 发现 | 当前实现与独立验证 | 结论 |
| --- | --- | --- |
| RA-B-001 | 首次修复后 admission 检查当前 approved Review 的非空正文，与后续复用分支一致。空正文反例被拒绝，Run 编号 / manifest 不变；普通 query 仍可读，恢复正文后新整次执行通过。没有增加 query / draft save 的历史正文依赖。 | 关闭 |
| RA-B-002 | deliveryNext 接受本次 observedOutcome；当前 query、指定 full-test status 和正式执行结果的调用已接通。两类查询分别注入竞争锁及日志变化，均得到 unknown / owner-decision / stopped，且父 Run 原 passed 字节保持。 | 关闭 |
| RA-B-003 | taskkill 调用本身设 5000ms 超时；停止返回成功后，close 最多再等 5000ms。未确认时将 stop.confirmed 降为 false、停止等待并保留日志，普通 / 正式操作有界返回 unknown、保留锁；正式父 Run 保持 draft / running。真实立即取消、确定性未关闭场景及入口已退出而后代存活的补充探针均完成，未使用 watchdog 才返回。 | 关闭 |

## 取消与后代证据

本次保留 `after-launch` 立即 abort 时点，三次真实正式执行在启动后约 **795 / 698 / 715ms** 返回 interrupted，锁释放，watchdogUsed=false。这三次没有生成后代 witness，因此不把它们单独宣传为“已经生成的后代全部终止”的证明。

共享普通取消回归另外等待真实 started / descendant PID 出现后取消，验证 interrupted、锁释放以及实际前台 / 后代 PID 均不存在；本次通过。

确定性故障测试让停止接口声称成功但进程 / 管道保持存活，普通与正式执行分别约 **5019 / 5023ms** 返回 unknown，锁保持、watchdogUsed=false。正式 unknown 的直接子结果记录 stop.confirmed=false 和 close 未确认原因；测试后续清场不能算作产品 interrupted。

Reviewer 又独立补充了更接近 018 的进程关系：从当前维护输入新建隔离目标，在后代真实启动后，仅终止本次持有的入口进程，故意保留后代和继承管道。产品约 **5035ms** 返回 unknown；清场前独立观察入口 PID 不存在、后代仍 alive、锁仍在。之后由测试按本次身份显式处置后代，观察 not-found，原结果 / 锁字节保持。证据：[parent-exit-probe.ts](artifacts/parent-exit-probe.ts)、[输出](artifacts/parent-exit-probe.log)、对应 cancel-scenes / test-scenes 原始记录。该探针通过独立 tsc --noEmit 检查；partial stop 回调是明确故障注入，不冒充生产 taskkill /T 已成功杀树。

`cancellation-support.ts` 只处置本次隔离目标和新建 ChildProcess：核对 .tmp 绝对范围、前台 cwd、PID / 创建时间 / 命令、后代绝对入口，处置后核对不存在，保存结果前后的字节比较。测试 watchdog 20 秒触发便判失败，不能生成产品通过；本次所有上述场景均未依赖 watchdog。

保留限制：018 的 Windows / pnpm 偶发后代逃逸根因仍未精确确认；本次批准的是已复现的无界等待已消除、停止未确认时结果诚实。产品没有承诺杀净任意后台进程；unknown 可能伴随存活后代，须按既有 Owner 边界核对现场，不自动清锁、恢复或重跑。正常操作超时用于结束未确认等待，不是新增阶段 gate。

## 独立检查与沿用范围

本次实际执行：

```powershell
pnpm check
pnpm build
node --test --test-concurrency=2 tests/delivery-boundaries.test.ts tests/delivery-full-test.test.ts tests/test-cancellation.test.ts tests/test-execution.test.ts tests/test-log-integrity.test.ts
```

工程 check / build exit 0；格式与 lint 覆盖 97 份维护文件，三配置真实类型检查通过。独立回归 **19/19 pass、0 fail / skipped / cancelled、exit 0**，约 164 秒，见 [review-tests.log](artifacts/review-tests.log)。包含原取消 JSON 读取修复后的真实进程退出检查、异常停止、执行保存 / 释放故障与日志短写 / 零进展 / 异常路径。原始命令、正式 / 普通执行及取消现场分别保存在 commands-*、delivery-scenes-*、test-scenes-*、cancel-scenes-*；同次输出不复制成多套证据树。

固定 OpenSpec strict validate 为 1/1 valid、issues=[]，实际 apply instructions 为 30/30 complete、remaining=0，见 [validate.json](artifacts/validate.json)、[apply.json](artifacts/apply.json)。这两项不替代语义审核或根正式 Full Test。

019 的 50/50 相关回归与 018 未受影响结论继续有效，包括同锁父子意图、修复后原完整集合新执行、普通 full 不升级为正式结果、适用性提示和最小直接引用。017 全回归仍为 167/169、exit 1；本次没有重跑全仓库，也不宣称已有 169/169。Archive 原上游失败已在 018 独立复跑通过，但原具体原因仍未确认，不增加自动重试或为消除历史提示重开修订循环。

## 范围与 OCR

本次使用 019 保存的五份必要 before 短名副本核对四个源文件和一份维护测试的实际修订；另读三份新增测试 / 支持、README、产品 Full Test 方法、当前设计 / delta / tasks 的边界澄清。其余沿用 018，不重审全部 Explore 或复制历史树。

OCR preview 前排除无关历史 artifacts、生成物、旧 proof 与未受影响模块。实际选入四个源文件，**4 reviewed / 0 skipped，选入范围覆盖 100%**；默认排除的测试和文档已单独补入并读取相应规则，见 [ocr-coverage.json](artifacts/ocr-coverage.json)、preview / rules。Git workspace 的 added 状态不能代替补审基准，实际语义判断使用 019 before 对照和当前代码；不以工具默认全仓库扫描数制造历史覆盖率。

## 维护规模

重新统计维护 TypeScript 物理行数，排除 fixtures、生成物和历史 Run；数据仅用于本次摘要。

| 目录 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | application/delivery-full-test.ts 390 | adapters/openspec.ts 346 | application/archive.ts 333 |
| tests | action-write.test.ts 467 | planning-cli.test.ts 444 | delivery-repair.test.ts 394 |
| scripts | proofs/mvp-d01-c-explore.ts 678 | proofs/mvp-d01-d-explore.ts 487 | proofs/mvp-d01-a-explore.ts 463 |

对照 019 before：delivery-full-test.ts 386→390、delivery-runs.ts 264→269、test-process.ts 159→174、delivery-full-test.test.ts 144→156、project.ts 255→255；其余表内旧文件未增长。新增边界测试 112 行、取消测试 43 行、取消支持 140 行，无旧增长基准。停止 / close 等待在进程适配器，测试清场在测试支持，职责没有继续混入正式验收编排，未增加纯转发层。旧 C / D 长 proof 未扩展，保持原限定用途；以后实际扩展 Close 或新增独立集成场景时按职责先整理，不设行数门槛。

## 当前交接

下一步 Author `archive`，当前输入仅指向本 020 Review，由头部固定 019。018 的 changes-requested、017 / 019 及旧编号均保留，不因本次批准改写旧结论。D02 仍 open，B 仍活动且尚未实际归档，A 已归档、累计数 5，C 未激活。本次批准不授予根正式 Full Test、Close、Git 或 C 激活权限。
