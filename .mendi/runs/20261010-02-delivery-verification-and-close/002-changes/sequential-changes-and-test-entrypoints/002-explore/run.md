---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-explore-01
actionType: explore
role: author
run: "002"
status: completed
actionStatus: completed
result: proof-supported
date: 2026-10-10
---

# MVP-D02-A Explore

Owner 原始指令：owner 授权激活 MVP-D02-A，开始 explore，核心功能 proof 认证。保持 Author，按路线图范围分析顺序多 Change / 当前 Run 与 focused / fast / full 测试入口，完成后停在独立 Review Explore；不提前编写 Propose 或实施产品功能。

## 激活、背景与范围

使用固定 OpenSpec 1.14.1 的 `new change sequential-changes-and-test-entrypoints --json` 创建原生 scaffold，并实际读取该 Change 的 `status` 与 `instructions proposal`。原始调用留在 [activation-commands](artifacts/activation-commands/)；尚未生成 proposal、design、delta specs 或 tasks。实际使用上游 `openspec-explore` 与项目 `skills/actions/explore/SKILL.md`，以 Owner 原始范围和路线图 MVP-D02-A 为边界。

目标 context 要求中文正文、TypeScript CLI、必要输入按操作区分、历史说明和未知 Ref 不自动成为查询依赖；阶段工作成功不能替代独立批准。据此，本轮只增加可重建的 TypeScript proof 与受控测试项目，不修改 `src/`，不迁移 MenDi 自身 manual-bootstrap 记录。当前 D02-A 是人工协作激活；产品还不能在这个多 Delivery 人工入口执行 bind / Action 写入。D01 的四次归档和正式验收也不能认证 D02 的新产品能力。

D02-A 应支持同一 open Delivery 顺序显式关联已有 Change、正确选择当前 binding / Run、保留旧关联与项目累计计数，并读取目标既有 focused / fast / full 命令、显式执行、保存简洁结果。正式 Full Test / 失败修复交接属于 D02-B；Close / Reopen / closed 后 Open 下一 Delivery 属于 D02-C。本轮未激活 B / C，也未执行这些生命周期操作。

## 关键事实与候选方向

1. `src/core/records.ts` 的 product 协议目前只接受一个 binding / batch，`src/application/project.ts` 的 bind 在存在任何旧 binding 时拒绝，并采用替换数组的首个关联实现。应收敛为：保持 open 且无活动 Change、前一个 Change 已终态归档、明确目标槽位及已有 Change，校验后追加；不从归档、查询或工具成功自动推断下一 Change 授权。重复槽位、Change 身份与未结束前项应明确拒绝。
2. `src/adapters/runs.ts` 的 `currentRun` 用一个 `find(active || archived)`，旧 archived 项排在活动项之前时先命中旧项。查询与 Archive 应共享小型的当前 binding 选择规则：有 activeChangeId 时只取它；无活动项时根据明确的追加顺序解释最近归档交接。新关联尚无 Run 就返回无当前 Run，不能回退旧 Run。候选采用追加顺序，尚未验证无活动、多次归档后的完整产品行为；Propose 必须明确顺序约束及矛盾记录拒绝规则。增加另一条历史指针、扫描最大编号来推断当前对象，会引入重复真相或把孤立占号当正式进展，本轮不选择这些方向。
3. `src/adapters/workspace.ts` 会读取每个 archived binding 的 Archive Run，并要求项目总计数等于每项旧 ordinal；第二次完成后这不可能全部成立。当前必要 Archive 交接应按当前操作检查；旧关联的身份、受管路径及编号一致性仍保留，旧 Run 的存在性不升级成日常查询前置。`src/adapters/archive-commit.ts` 当前还把全部 binding 更新为同一个归档目标，`src/application/archive.ts` / query 多处固定 `[0]`。需要连同 admission、选择、收口、读回一起调整，不能只取消数组长度限制。
4. 现有 `scanRunNumbers` 已扫描同 Delivery 的约定 Run 目录并跨 Change 分配，`createRun` 更新 binding 时已有 Change 身份过滤，可复用。批次不是每个 Change 单独占号；正常第二个 Change 复用该 Delivery 当前 Changes 批次，后续 Reopen 新批次的规则留给 D02-C。累计 archiveOrdinal 继续基于项目计数，不能随 Change 或批次归零。
5. 测试入口优先读取目标现有 `package.json` 中显式配置的命令；本轮用 `test:focused` / `test:fast` / `test:full` 作为受控候选约定，真实项目的缺失入口、其他已有命名与最小映射方式在 Propose 明确，不猜测命令、不自动安装。直接在目标根执行选定入口，记录集合、实际命令、工作目录、退出 / 中断事实与日志位置即可，不建设自动选择器、缓存、通用预算或进程平台。full 命令的执行结果与正式 Delivery Full Test 的授权、范围和交接分别解释；本轮没有产生正式 full 通过结论。

## 核心 proof

入口：[mvp-d02-a-explore.ts](../../../../../../scripts/proofs/mvp-d02-a-explore.ts)。选择实验与测试执行分别放在 `scripts/proofs/d02-a/selection.ts`、`test-entry.ts`，受控测试项目放在 `tests/fixtures/test-entry-project/`；均纳入真正 TypeScript 检查。复用已有受控阶段 / Archive helper，不扩展旧 C / D 完整流程 proof。

重建命令（在 MenDi 根执行，输出目录须另选新的位置，保留原结果）：

```powershell
node scripts/proofs/mvp-d02-a-explore.ts <新的证据输出目录>
```

实际执行输出至当前 Run 的 `artifacts/proof-001`，退出 0，四组断言全部通过。汇总见 [report.json](artifacts/proof-001/report.json)，主脚本退出见 [proof-001.log](artifacts/proof-001.log)。每次真实子命令的原始输出仅在 [commands](artifacts/proof-001/commands/) 留一份；真实 native Archive 响应单独保存为 [native-archive-result.json](artifacts/proof-001/native-archive-result.json)。测试子进程输出、退出和 taskkill 结果保存于 [test-commands.jsonl](artifacts/proof-001/test-commands.jsonl)，摘要不重复复制这些输出。

| 组 | 要解决的疑点与方法 | 实际结果 | 限定用途 |
| --- | --- | --- | --- |
| P01 | 受控 product 项目经过阶段夹具建立当前批准入口，调用固定真实 OpenSpec Archive；再原生创建第二 Change、调用真实产品 bind | 首项真实归档，累计 1；第二关联拒绝 `change-bind-conflict`，manifest 字节不变 | 证明当前限制与无副作用；夹具声明的 Author / Reviewer 批准不认证真实人类身份 |
| P02 | 只在隔离项目写入第二关联 / 第二 Explore Run，在全新 Node 进程分别调用现有 currentRun 片段与候选选择 | 全局下一 Run 为 008；现有片段选旧 `proof-entry`，候选读到 `proof-next` 的 008；真实产品 status 仍拒绝 `invalid-record` | 为隔离选择问题，使用明确的 fixture-only 结构投影绕过单 binding admission；不代表完整产品允许该记录、正常 Action 已执行或第二 Archive 已通过 |
| P03 | 删除旧 Archive Run，删除必要新 Run，去掉新 latestRunRef，注入越界路径 / 错身份和未知 Ref，逐项新进程读回 | 旧文件消失不影响候选当前读回；新文件缺失 `run-input-missing`；无新引用返回 null；越界 `unsafe-reference`；错身份 `invalid-run`；未知 Ref 忽略。恢复后旧 Run 字节及旧 binding 均保持 | 只认证候选当前输入选择及既有 readRun 校验；尚未放宽产品 workspace 的全历史 archived Run 读取 |
| P04 | 从受控项目实际读取三类既有 scripts，通过现有 pnpm 11.22.0 离线启动；等待真实 full 子程序开始后终止本次受控进程树 | focused 退出 0 为 passed；fast 退出 7 为 failed；调用前 full 为 not-run；真实 full 被中断，退出 1，taskkill 成功且收到 close 为 interrupted。没有 full passed | 输出文字仅作为受控进程开始通知，最终依据真实启动、退出与停止事实；本 proof 不是 MenDi 正式 Full Test |

测试执行不能把 `status:null`、不完整日志或未知存活状态归为 passed。P04 已验证真实成功、非零失败、未调用与确认停止的中断；无法确认停止的 unknown、启动失败、命令缺失和重启后的结果读回尚未完成产品验收，应列入本 Change 的实施测试，不伪造本轮覆盖。proof 的 20 秒 watchdog 仅约束受控实验，不定义产品预算策略。

## 工程检查与仍需验证的边界

只格式化三个新增 proof 源文件；`pnpm check` 实际退出 0，格式 / lint 各检查 63 个文件，无修正，三个 TypeScript 配置全部通过。受控 fixture 不参与批量格式化，但其 `.ts` 参与测试类型检查。本轮没有产品源码变更，未运行历史全量测试或正式 Delivery Full Test；D01 结果保持原有限定用途，不作为新增能力的认证。

Apply 至少需要真实产品流程验证：第一 Change 实际 Archive → Owner 范围内显式 bind 第二已有 Change → 尚无 Run 的查询 → 第二阶段 Run / 新进程查询 → 第二次实际 Archive。要求旧关联不被批量改写、编号跨 Change 连续、累计计数增长到 2、当前终态不误选旧项，以及旧说明 / 旧 Run 缺失不阻断与当前必要输入缺失仍拒绝。同时保留活动对象冲突、依赖 / 槽位、身份、路径越界、锁和写入失败 / Archive 有限恢复检查，按变化范围回归现有 Action / Apply / Archive 用例。

测试执行的最小配置格式、结果保存位置及状态字段要在 Propose 收敛；日志与结果只能描述已经发生的执行事实。若保存受阻或进程状态不明，必须显示未完成 / unknown；下一次显式执行保留前次结果，不建立 hash 清单或一项检查一个 Run。历史记录仍原样保留，不通过补建旧活动目录、改写旧 Run 或转换 manual-bootstrap 实现新能力。

## 交接

Author Explore 完成，结论为 `proof-supported`，没有 Reviewer verdict。建议独立 Reviewer 补审范围、现有 blocker、实验适配器的限制以及候选输入 / 测试结果解释，再决定是否进入 Propose。当前唯一审核输入是本 Run；详细原始证据由上述直接入口定位。

更新后在新进程实际执行根项目 `status / next --json` 与固定 OpenSpec `status --change sequential-changes-and-test-entrypoints --json`，全部退出 0。查询读回活动对象和 `next=review-explore / role=reviewer / authorRunRef=本 Run`，人工交接明确 `executable:false`；上游 planning 未完成，Change 目录仅有 `.openspec.yaml`。原始输出见 [readback-commands](artifacts/readback-commands/)。同时核对 D01 closed、根入口累计 4、D02 下一可用 Run 为 003；没有新建 Reviewer Run。

下一步：独立 `review-explore`。本轮未执行 Git 操作、根项目 Archive、Propose / Apply、正式 Full Test、Close / Reopen，也未激活下一 Change。D02 仍 open，D01 仍 closed，根项目累计归档数为 4。
