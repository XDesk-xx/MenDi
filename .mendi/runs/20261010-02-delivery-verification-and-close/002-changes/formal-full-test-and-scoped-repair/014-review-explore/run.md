---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: formal-full-test-and-scoped-repair
planningSlot: MVP-D02-B
batchId: 002-changes
actionId: formal-full-test-and-scoped-repair-review-explore-01
actionType: review-explore
role: reviewer
run: "014"
status: completed
actionStatus: completed
result: approved
verdict: approved
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/formal-full-test-and-scoped-repair/013-explore/run.md
---

# MVP-D02-B Review Explore

Owner 指令：review-explore，重点检查正式 Full Test 输入、职责划分和引用边界，保持简单，不增加 gate。按项目 review-explore 方法，固定审核 013 Explore 的实际正文与直接 proof。

**verdict：approved。** 当前 Explore 依据足以进入 Propose，无阻断发现。独立重放四组关键实验通过；批准的是探索依据与候选边界，不认证尚未实施的正式 Full Test、独立修复审核协议或 Close。

## 三项重点结论

| 重点 | 独立核对与方案边界 |
| --- | --- |
| 正式 Full Test 输入 | 013 已识别本轮声明的交付范围、必需槽位完成事实、相关直接审核、完整测试集合和受测材料。它们应在 Propose 收敛为操作实际消费的输入；不能以最后一个 Archive 或普通 full 的 exit 0 代表整轮验收。现有执行协议固定 scope=command / formalDeliveryTest=false，查询 ok 只说明已知结果可读，还须区分 passed 与 failed。 |
| 职责划分 | 正式验收单独承担范围、审核、适用性及交接，底层继续承担入口、依赖预检、进程、日志和结果。现有 runTest 自己跨 await 持锁，外层不能再持同一锁直接嵌套；013 已明确需要同一操作锁内复核输入、执行和落盘。归档后的范围内修复采用 Delivery 记录，不能复活旧 Change。 |
| 引用边界 | 当前必要输入按操作明确；正式执行与修复 Review 消费其直接对象，普通查询不追读旧 Explore、方案或失败父链。旧失败和日志保留，新完整结果直接供后续 Close 使用；说明和未知 Ref 不自动成为硬依赖。实验固定材料比较只适用于夹具，不能推广成全库 hash / 文件清单 gate。 |

上述方向与路线图 D02-B 一致。具体命令、字段、结果选择及变化后的适用性处理属于正常 Propose 工作，不要求在 Explore 提前实现正式协议。角色边界、身份、路径安全和写入冲突检查保留；没有新增行数、容量、证据数量或工程检查前置。

## proof 的适用范围

已阅读 TypeScript 入口全文、四份 producer / consumer / integration / unit 夹具、所复用的顺序关联 / 归档与执行 helper，并核对当前 action-context、执行协议和锁接入。阶段批准使用受控声明，归档和普通测试使用真实产品 / 固定工具；两模块接线断言是真实运行，不能因此宣称真实 Change 的代码归属或正式验收覆盖已得到认证。

原实验的修复只修改隔离 producer 的事件种类，未改断言；focused 只运行 integration，新 full 重新运行 integration 与 unit，旧失败不被覆盖。review-fixture 只是适用性候选，不认证独立 Reviewer；四个已知文件与 full script 的比较仅说明本实验的源码 / 命令变化，未知项目依赖和并发保证留待方案及实施。本轮使用同一受控入口在全新隔离项目独立重放，输出中的 role=author 是脚本固定的实验标签，不是本次 Reviewer 的角色声明。

## 下一阶段的收敛事项

Propose 按 013 已列事项，明确开始正式执行时的直接输入、当前正式 Run / 结果的选择、受测源码或配置变化后的适用性，以及小修复固定新 Author 的独立审核；将同一锁内接入和 unknown / 中断 / 保存失败列入相应实施验证。保留普通命令合同，不认领任意旧普通 PASS，不拼接旧 full 与新 focused。

新增验收和修复场景单独分组；新增 CLI 命令时整理现有深层分派，复用真实底层职责，不堆大 tests.ts、不扩写旧 proof 或建立通用流程平台。C 只预留直接消费当前适用正式结果的边界，不在 B 实现 Close / Reopen。以上是既定范围的方案细化，不另开修订或新增 gate。

## 独立验证与限制

| 验证 | 实际结果 |
| --- | --- |
| `pnpm check` | exit 0，80 文件格式 / lint 及 src / scripts / tests 三配置真正类型检查通过，见 [check.log](artifacts/check.log) |
| `pnpm build` | exit 0，见 [build.log](artifacts/build.log)；产品源码无当前 Git 差异 |
| `node scripts/proofs/mvp-d02-b-explore.ts <本 Run artifacts/proof>` | exit 0，P01–P04 全部通过，见 [report.json](artifacts/proof/report.json) 与 [proof.log](artifacts/proof.log) |
| 固定 OpenSpec `status --change formal-full-test-and-scoped-repair --json` | exit 0，nearest root=MenDi，仅 proposal ready，其余待方案，planningComplete=false，见 [change-status.json](artifacts/change-status.json) |
| 固定 OpenSpec `instructions proposal --change formal-full-test-and-scoped-repair --json` | exit 0，proposal.md、dependencies=[]，无附加 artifact rules；context 与当前范围一致，见 [proposal-instructions.json](artifacts/proposal-instructions.json) |

独立重放实际得到 001-full passed、002-full failed / exit 1、003-focused passed、004-full passed；全部 formalDeliveryTest=false。两次真实原生归档响应、执行原始结果和日志、修复前后有限材料保存在 artifacts/proof，未复制旧证据树。另核对 producer 差异只有事件种类；consumer 与两份测试断言字节未变。实际组记录依次为 integration、unit、integration、integration、unit，结合子进程退出与断言核对完整重跑，未仅凭组标记或 report 自报成功推导批准。

工程命令使用 COREPACK_ENABLE_NETWORK=0、pnpm_config_verify_deps_before_run=warn；既有根 workspace / node_modules 不同步警告保留。本轮只在受控隔离项目明确准备依赖，未安装根依赖或放宽产品 error 预检。根正式 Full Test 前按正常项目准备处理，属于后续实际执行准备。

沿用 A 对未变产品执行、归档与引用边界的有效审核；没有重跑全部历史测试。Change 尚未有正式方案产物，不以空方案 strict validate 作为 Explore 门槛。未修改实现、proof 或 Author 013，不创建方案材料或正式验收结果。

## 交接

转交 Author `propose`，当前输入只指向本 Run，固定 authorRunRef 定位 013。新进程 status / next 读回见 [readback.json](artifacts/readback.json)：D02 open，D01 closed，累计归档数 5，A 保持 archived，B 为当前 Change。

本轮停在 Propose 边界，未执行根项目 Archive、Git 写操作、正式 Full Test、Close / Reopen 或激活 C。014 为独立 Reviewer Run，013 与既有历史编号、正文、verdict 保留。
