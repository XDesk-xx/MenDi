---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: formal-full-test-and-scoped-repair
planningSlot: MVP-D02-B
batchId: 002-changes
actionId: formal-full-test-and-scoped-repair-revise-apply-01
actionType: revise-apply
role: author
run: "019"
status: completed
actionStatus: completed
result: implementation-ready-for-review
nextAction: review-apply
nextRole: reviewer
revisesRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/formal-full-test-and-scoped-repair/017-apply/run.md
reviewRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/formal-full-test-and-scoped-repair/018-review-apply/run.md
date: 2026-10-10
---

# MVP-D02-B Revise Apply

Owner 指令 revise-apply；保持 Author，固定 017，处理 018 的 RA-B-001 / 002 / 003 后停在独立 Review Apply。保留旧 Run、编号、verdict 与回归限制，不重做 Explore / Propose，不执行本项目 Archive、正式 Delivery Full Test、Git 或 C 激活。

本次 Author 修订完成，三项发现交回独立 Reviewer 补审。实际 OpenSpec 初始状态为 all_done 30/30；根据当前复审要求重开受影响任务，行为修正 / 回归后按上游返回的 sourcePath / line 逐项勾选并读回。任务完成与工程通过不替代审核批准。

仅保存本次需要对照的五份短名副本于 artifacts/before，分别来自 src/adapters/test-process.ts、src/application/delivery-full-test.ts、project.ts、src/core/delivery-runs.ts 和 tests/delivery-full-test.test.ts；不复制历史树。

## 修订与实际反例

| 发现 | 实现、验证与边界 |
| --- | --- |
| RA-B-001 | delivery-full-test.ts 首次修复后 admission 在读取当前 approved Review 时核对非空正文，与后续沿用批准分支一致。新增 delivery-boundaries 测试真实 full failed → Author / Review 夹具 → 清空当前 Review 正文，确认正式执行拒绝、不占新号、不改 manifest；query 仍可用，恢复正文后新整次执行通过。不向 query / draft save 增加正文读取或历史链。 |
| RA-B-002 | deliveryNext 接受调用者本次正式观察 outcome；当前 query、指定 full-test status 及正式执行的确认后输出传递该观察。竞争锁或日志变化得到 unknown 时 next=owner-decision / owner / stopped，持久 passed 原记录不变。用实际 lease 和必要日志变化分别覆盖两种读取操作，核对原父 Run 字节保持，不改写历史结果。 |
| RA-B-003 | 共享 executeForeground 原先在 stop 返回 confirmed 后无界等 close；现在停止命令自身和其后 close 等待各为 5000ms 上限。未收到 close 时停止降为未确认，结束等待、保留已收到日志并返回 unknown，普通执行保留锁，正式父 Run 保持 draft / running，不发布终态通过。没有重跑、自动 finish、清锁、扫描旧 pid 或一般进程恢复。 |

旧实现反例实际失败保留在 [boundaries-before.log](artifacts/boundaries-before.log)（0/2）与 [cancel-before.log](artifacts/cancel-before.log)（0/1）。后者在普通真实进程执行中受控让 stop 返回成功但保持前台 / 管道存活，旧实现只有测试 watchdog 20 秒处置后才能返回，因此测试明确失败；不能把人工停止视为产品成功。修改后的同一探针覆盖普通和正式执行，两者约 5 秒有界 unknown，锁保持，存活测试树随后仅由测试显式处置。

新 cancellation-support.ts 承担测试自己的取消时点、watchdog 与安全收场：核对本次 .tmp 绝对路径、刚创建 ChildProcess、前台 cwd、PID、创建时间与实际命令；后代须含本隔离目录的绝对入口。显式停止后核对实际 PID 不存在，并用 Buffer 比较确认父 Run / 子结果 / 锁均未改写，不处置其他任务。若 watchdog 才使产品返回便判测试失败；它只是防止回归测试本身长期悬挂，不是产品的恢复平台。

原真实 after-launch 立即 abort 时点保留，连续三次执行，约 0.8 秒正常关闭为 interrupted；断言只有实际关闭确认才释放锁。若真实时序未能确认，则断言 unknown / 非零、draft 和锁保持；不将入口退出当作树停止。另有确定性故障探针覆盖 close 未到的分支。018 的 Windows / pnpm 偶发后代逃逸具体根因仍未精确确认；本轮修正已证明的无界等待和确认缺口，不能声称取消总能清除任意后台进程。

同步修订当前 design、三份 delta、四项受影响任务说明、README 与正式 Full Test 方法；均为当前既有边界的澄清，不新增授权阶段、历史依赖或 hash / 容量 gate。

## 当前验证与限制

定向修正后 3/3 pass，见 [boundaries-after.log](artifacts/boundaries-after.log)。pnpm check 与 build 已通过；类型检查初次发现取消测试的普通 / 正式 Promise 联合类型推断问题，改为真实 async 联合返回后通过，没有改类型检查配置或跳过检查。

完整 Delivery 分组与共享执行相关回归已完成：50/50 pass，fail / skipped / cancelled 均为 0，exit 0，约 426 秒，见 [regression.log](artifacts/regression.log)。覆盖本次三项发现、真实立即取消、异常停止、写入故障、修复后的新完整执行，以及原 test-entries / test-dependencies / test-execution / test-log-integrity 行为。实际命令为：

```powershell
node --test --test-concurrency=2 tests/delivery-*.test.ts tests/test-cancellation.test.ts tests/test-entries.test.ts tests/test-dependencies.test.ts tests/test-execution.test.ts tests/test-log-integrity.test.ts
```

工程结果见 [check.log](artifacts/check.log)（97 份维护文件的格式与基础 lint，三配置真实类型检查通过）、[build.log](artifacts/build.log)（exit 0）和 [validate.json](artifacts/validate.json)（固定 OpenSpec strict validate 通过）。[apply-final.json](artifacts/apply-final.json) 读回 30/30、all_done；[status-final.json](artifacts/status-final.json) 与 [next-final.json](artifacts/next-final.json) 均确认 open / manual-bootstrap、当前 B、review-apply / awaiting-reviewer，唯一当前引用 authorRunRef=019。仅核对本次当前输入，不补历史证据链。

实际命令 / CLI 输出保存于本 Run 的 artifacts/commands-*.jsonl；正式与普通执行及其必要原始日志保存于 delivery-scenes-*、test-scenes-*；取消时点与现场为 cancel-scenes-*，正式 unknown 的必要直接子记录 / 日志仅在该现场补存。各摘要直接引用同次输出。MENDI_TEST_EVIDENCE_DIR 指向本 Run artifacts，隔离目标从维护中的源码 / 夹具与固定工具重建，正常离线准备依赖，不依赖旧 .tmp 唯一输入。

017 全量仍为 167/169、exit 1；018 已独立复跑两项原失败，可靠且未受影响的结果与证据限制继续沿用，本轮不改写原日志或宣称已有新全仓库 169/169。Archive 调用前那次上游错误仍未复现，不宣称已查明，也不新增自动重试。

## 维护规模与职责

维护 TypeScript 物理行数排除夹具、历史和生成物；本次直接基准及当前数据为 artifacts/before-counts.json、after-counts.json，仅用于当次摘要。

| 目录 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | application/delivery-full-test.ts 390 | adapters/openspec.ts 346 | application/archive.ts 333 |
| tests | action-write.test.ts 467 | planning-cli.test.ts 444 | delivery-repair.test.ts 394 |
| scripts | proofs/mvp-d01-c-explore.ts 678 | proofs/mvp-d01-d-explore.ts 487 | proofs/mvp-d01-a-explore.ts 463 |

可靠差异：delivery-full-test.ts 386→390，core/delivery-runs.ts 264→269，test-process.ts 159→174，delivery-full-test.test.ts 144→156，project.ts 255→255；表内其余旧文件未增长。新增边界测试 112、取消故障测试 43、取消测试支持 140 行，没有旧增长基准。正式 admission / 单次执行仍紧密关联，停止与日志职责保持在进程适配器；实际进程验证及测试收场归测试支持，未增加转发层压行数。后续扩展 Close 或新独立集成场景时，先按实际职责整理。旧 C / D 长 proof 本轮未扩展，保持原限定用途；以后确需扩展再分开 Apply 记录流与 Archive 效果组。

## 交接边界

保持 Author，以新 Author 019 交独立 Review Apply，补审本次变化部分；当前 next 仅保留 authorRunRef 指向 019，详细发现与来历从本 Run 定位 018 / 017。D02 open / manual-bootstrap，A 已归档、累计数 5，B 仍活动且尚未批准，C 未激活；未迁移人工历史、执行本项目 Archive / 正式 Delivery Full Test / Git 写操作或创建 Reviewer Run。
