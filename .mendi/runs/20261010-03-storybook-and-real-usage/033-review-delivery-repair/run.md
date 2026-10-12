---
deliveryId: 20261010-03-storybook-and-real-usage
planningSlot: MVP-D03
actionId: mvp-d03-review-delivery-repair-01
actionType: review-delivery-repair
role: reviewer
run: "033"
status: completed
actionStatus: completed
scope: delivery
date: 2026-10-12
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/032-delivery-repair/run.md
failedFullTestRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/031-delivery-full-test/run.md
stageSkillRef: skills/actions/review-delivery-repair/SKILL.md
outcome: complete
result: approved
verdict: approved
nextAction: delivery-full-test
nextRole: author
---

# MVP-D03 独立定向修复审核

**verdict：approved，阻断项 0。** 固定 [032 Author 修复](../032-delivery-repair/run.md)，按项目 review-delivery-repair 方法核对实际差异、直接失败与原整个集合，并独立执行当前修复测试及两个补充故障探针。批准仅覆盖本次范围内修复；[031 正式 Full Test](../031-delivery-full-test/run.md) 仍为 failed，未执行部分不改成通过，下一步为新一次完整正式执行，当前不执行。

## EPERM 诊断的确定性

直接核对 031 原始 root-regression 日志及其四份短名现场记录：#122 在 passedTarget 准备过程中，001-full/result.json 从 prepared 向 running 替换时失败，pid=null、日志为零字节，尚未进入 Reopen 中断点。不能把用例名称当成 Reopen 产品缺陷的根因。032 的 ACL / 属性 / 写者已停止检查只描述事后现场；具体瞬时占用者没有句柄追踪，仍无法确认。

当前 Node v22.23.2 使用 libuv 1.51.0；独立读取该版本 [rename 实现](https://raw.githubusercontent.com/libuv/libuv/v1.51.0/src/win/fs.c) 确认 MoveFileExW / REPLACE_EXISTING，[错误映射](https://raw.githubusercontent.com/libuv/libuv/v1.51.0/src/win/error.c) 确认 AccessDenied → EPERM。[Microsoft FileShare](https://learn.microsoft.com/en-us/dotnet/api/system.io.fileshare?view=net-9.0) 区分 Read 与 Delete 共享。032 真实句柄 proof 与本次独立真实句柄测试支持“缺少删除共享可产生此类失败”；不支持指认 031 是杀毒、索引或特定进程所致。

因此诊断限定得当：这是已复现机制下的一次局部容错修复，不能宣称原瞬时根因已被唯一定位。500ms 也不是根据原占用时长推导的保证恢复值，持续拒绝仍必须失败保护。

## 500ms 重试与失败保护

| 核对点 | 结论 |
| --- | --- |
| 范围 | 只在 Windows 且替换抛出 EPERM / EBUSY 时等待；EIO 等其他错误立即原样传播。不重试整个测试、重新占执行号或重新写多个暂存文件。 |
| 等待 | 同一次 saveExecution 建立一次 performance.now()+500 截止，单次等待不超过 25ms / remaining，不逐次重置预算。它限制局部失败等待；同步路径 / 读取 / rename、系统调度和最后一次尝试不受硬实时保证。每次结果保存分别有自身预算，不是全命令共享 500ms。此小范围同步等待可接受，无需新执行框架。 |
| 冲突与路径 | 每次等待后重新通过 managedPath 核对本次直接原文件 / 暂存文件，内容不同则 test-write-conflict，路径越界或读取失败亦停止；不删除原结果、不修改 ACL、不越过失败强行写入。该直接输入复核不是历史 hash 链，也不承诺抵御任意外部写者在最后检查后的竞态。 |
| 终态与身份 | parseExecution 与旧结果 finished 检查保留在暂存写入之前，终态不可重写。成功替换后仍按既有逻辑读回，不把 rename 返回当作全部提交已确认。 |
| 启动前失败 | 持续拒绝返回 unknown，原 prepared / pid=null、唯一暂存和调用者锁保留，业务不启动。短时拒绝恢复只启动一次业务。 |
| 启动后失败 | PID 保存异常走既有 executeForeground 的 failure / cancel 收尾，不再次 spawn；终态保存失败由调用者返回 unknown 并保留锁，不能因业务 exit 0 报 PASS。下述 Reviewer 两项 EBUSY 故障注入验证该路径。 |

源差异仅 test-store.ts 的同次替换处理与新 test-store.test.ts；README 的说明、当前交接属于同一范围。没有扩大为通用文件平台、自动清锁 / 重跑、重写已归档 Change 或调整完整集合。

## 独立补验与已有结果适用性

- `node --test --test-timeout=120000 tests/test-store.test.ts`：exit 0，7/7、0 skip，约 13.88 秒。真实 Windows 短时 / 持续句柄、其他错误、原 / 暂存内容冲突、同一业务启动与终态 / 身份保护均通过。日志为 [本次 stdout](artifacts/test-store.stdout.log) / [stderr](artifacts/test-store.stderr.log)，未复用旧 PASS 充当独立运行。
- 本次 [post-launch.test.ts](artifacts/post-launch.test.ts) 只在新隔离目标，对 PID 保存与终态保存分别持续注入 EBUSY；实际各启动一次业务，分别拒绝 13 / 17 次，均 unknown / ok=false，保留锁与同一暂存。PID 故障收尾后落盘 unknown；终态故障保留 running / unknown。`node --test --test-timeout=120000 <本次探针>` exit 0、2/2，约 12.57 秒，见 [输出](artifacts/post-launch.stdout.log)。探针使用严格 noEmit / NodeNext / erasableSyntaxOnly / allowImportingTsExtensions 真正检查通过，未进入产品长期测试入口或正式集合。
- 直接核对 032 的 focused-summary 与对应原始日志：原 Reopen 用例 1/1（九个提交边界）、test-execution 7/7、正式父子适配器定向场景 3/3，以及 build / 最终 check 均通过。后两类包含启动失败、实际非零、取消、写入中断和 unknown 保留，与当前调用链相符。这些未变结果沿用，不重复整个旧集合。
- 当前 Git diff --check 通过。Reviewer 未改产品实现、测试或失败现场；新增测试沙箱保留，不清理旧锁。当前批准针对源码修复及其必要回归，不认证旧稳定安装已含修复；032 已明确新 dist 与旧安装候选的区别。

必要补验已覆盖这次修改的真实机制、错误过滤、持续失败、冲突、身份 / 终态和执行前后保护。无需重做 Explore / Propose、UI 或安装验收来补齐历史；这些所属完整正式集合仍要在下一次正式执行中取得新结果。

## 维护规模与后续完整集合

本次独立统计 [维护行数](artifacts/line-counts.json)：src 前三为 delivery-full-test.ts 401、openspec.ts 346、lifecycle-store.ts 336；tests 为 action-write.test.ts 467、planning-cli.test.ts 444、delivery-repair.test.ts 394；scripts 为 mvp-d01-c-explore.ts 678、mvp-d01-d-explore.ts 487、mvp-d01-a-explore.ts 463。均未增长。相对 ba3b992，test-store.ts 126→150（+24），新测试 263 行；分别仍是执行存储与其故障回归职责，无需纯转发拆分。旧长 proof 不扩展、不改写，不增行数 gate 或台账。

核对 [031 原声明](../031-delivery-full-test/artifacts/plan.json) 的八类完整集合：根工程检查与全量测试 / 构建、UI 产品场景、独立安装与方法交接、Vue 工程 / Storybook / stories、主规格 strict 和交付状态读回，均未删减。下一次根测试自然包含新 test-store.test.ts，不把旧“50 份测试”的受测快照当作排除新测试的固定清单；安装候选也须来自修复后实际构建。不得拼接 031、032 或本 033 的 PASS，或只补跑 031 未执行组来构造正式通过。

本次完成只更新新 033 和根 manifest / README / context 当前入口；manifest.fullTest 仍完整保留 031 failed，A/B/C archived、累计 10、activeChangeId=null、open/manual-bootstrap 不变。交接为 delivery-full-test / Author / awaiting-owner-instruction，直接入口仅本审核；原失败与集合由本 Run 定位。未重跑正式 Full Test、Close、Git 写入、清理或启动子智能体。
