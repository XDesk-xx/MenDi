---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-apply-01
actionType: apply
role: author
run: "008"
status: completed
actionStatus: completed
result: implementation-ready-for-review
date: 2026-10-10
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
proposalReviewRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/007-review-propose/run.md
nextAction: review-apply
nextRole: reviewer
---

# MVP-D02-A Apply

Owner 指令：apply。承接 007 独立 Review Propose approved 与 006 的受审方案，实施 28 项任务，完成后停在独立 Review Apply。

## 实际实施

- `src/core/associations.ts` 承担关联 / 批次身份与追加顺序校验、唯一当前对象和槽位依赖。`records.ts` 保留入口 / 范围解析；currentRun、query / next、Action store、诊断、Archive 执行与读回共用同一选择。新项没有 Run 时不回退第一项。
- 后续 bind 要求 open product、前项完整归档、依赖已归档及槽位 / Change 未占用；锁内复核后追加原始 binding，继承既有 batchId / 批次成员。首次 Action 才分配全 Delivery 下一实际号，空目录占号跳过、重复号拒绝。历史结构与受管路径仍检查，只有当前必要 Run / Archive 交接会被读取。
- Archive commit 只更新当前 binding，前项 ordinal 小于累计总数合法。第二项真实原生归档增长到 2，计数 / 终态 Run / manifest 中断后新进程 local-only finish 定向收口；旧 binding / Run 字节保持，重复 finish 不增长，陈旧第一项 execute / finish 拒绝。
- `workspace.ts` 提取实际 acquire / owner-token release，同步写路径继续使用原协议，测试执行显式持锁跨 await。CLI 分为参数、dispatch、中文呈现与薄入口；呈现承担真实输出，不访问目标或执行 next。
- `test list / run / status` 使用明确本地目标，默认三类已有 script 与可选 mendi.tests 映射，拒绝非法直接名称；只校验选定项，不创建 / 改写配置，不调用 OpenSpec。首版 Windows / Node 22 / 实际 pnpm 11.22.0 / packageManager 核对，工具 JS 入口显式传入，不切换或下载。
- 锁内无 script 的 pnpm run 强制 error 依赖预检，失败为 not-run / executionId=null，脚本不启动、无占号 / 安装 / lockfile 改写，释放自身锁。通过后选定命令强制 warn，关闭 Corepack network / auto pin，并归一环境同名大小写键。目标 install 与调用者策略不能触发运行前自动安装；脚本自身明确 install 按实际行为记录。
- 测试入口解析、结果领域协议 / 存储、进程与应用编排分别承担实际职责。Delivery 下 tests/NNN-kind 保存 result.json 与原始两路日志，编号独立于 Run / Archive。spawn 前持久保存 running / unknown 意图；完整正常退出 / 保存读回 / 锁释放才报告 passed，正常非零 failed、确认本次前台树停止 interrupted、启动明确失败 not-run、无法确认 unknown。
- 真实 Windows taskkill 只使用本次实际持有的 child；不根据历史 pid 操作其他进程。unknown 保留现场 / 锁，已完成结果不可重写；再次执行新占号。指定 status 双读身份 / 明确结果 / 必要日志与锁，读中变化或未完成意图 unknown / 非零，不调用工具或 script、不重跑 / 补写 / 处置锁。
- 测试成功只认证 command scope / formalDeliveryTest=false；Run / next / binding / verdict / 项目计数不被修改，普通 query 不依赖测试历史。README 已同步关联、无 Run 查询、批次、两次 Archive、三条测试命令、依赖准备、结果及取消边界。主规格未提前同步，受审设计与四份 delta 的合同保持，tasks 按固定工具 sourcePath / line 逐项更新并读回。

## 验证与证据

28 / 28 项任务已完成，当前实现可交独立 Review Apply；本 Run 为 Author 实施交接，不含 Reviewer verdict。

| 检查 | 实际结果 | 直接证据 |
| --- | --- | --- |
| pnpm check（Corepack network=0、pnpm verifyDepsBeforeRun=warn） | exit 0；格式 / 基础 lint / 三组真正 tsc 均通过；根安装状态提示保留 | [check-reviewed-code.log](artifacts/commands/check-reviewed-code.log) |
| pnpm test（同上环境，测试文件 concurrency=2） | exit 0；139 / 139 passed，fail=0、cancelled=0、skipped=0；实际耗时约 793 秒 | [test-final.log](artifacts/commands/test-final.log)、[regression-final-scenes](artifacts/regression-final-scenes/) |
| 固定 OpenSpec validate 当前 Change --strict --json | exit 0；1 / 1 valid、issues=[] | [validate-final.json](artifacts/commands/validate-final.json) |
| 固定 OpenSpec instructions apply | all_done；28 / 28 / remaining=0；只认证任务事实 | [handoff.json](artifacts/handoff.json) |

重点验收使用受控项目的真实原生 scaffold、Open / bind / Action / Run / Archive 接口、实际 pnpm 和 Windows 子进程。阶段 Reviewer approved 是明确限定的测试前置，不能认证真人或本仓库 Change；阶段 fixture runner 仅隔离前置 status，实际 Change list、CLI 查询、all_done 与原生归档仍读取真实项目。受控项目两次归档不属于当前仓库 Change 的 Archive。

- 关联 / 当前项 / 共享批次 / 全 Delivery 编号、第二项原生 Archive 与部分提交恢复：`tests/associations.test.ts`、`tests/sequential-changes.test.ts`；第二项首次 Explore 跳过空 008 占号为 009。原始命令、恢复现场与执行记录分别见 [sequential-scenes](artifacts/sequential-scenes/) 和最终回归场景记录。
- 三类真实退出、同锁跨 await、真正停止前台及后代、spawn failure / 信号 / 保存 / 读回 / 释放故障、意图后进程真实退出、新进程只读 / 不可变、原工具与 script 删除后查询、异目录 CLI 单份 JSON：`tests/test-execution.test.ts`。真实执行及两路日志见 [execution-scenes](artifacts/execution-scenes/)。
- 缺失依赖、已同步后增加依赖、两段之间变动、目标 install / 环境策略覆盖、脚本伪造依赖错误文字、脚本自身显式本地 install、空 / 重复执行号与 junction：`tests/test-dependencies.test.ts`；依赖准备使用受控本地 file 输入及明确 offline install，属于夹具准备，不是产品自动行为。
- 新原始材料统一保存本 Run artifacts；长期 TS 夹具在 tests/fixtures，临时场景可由受控输入重建。历史 proof / 已批准材料只沿用仍适用结论，没有复制历史证据树、新增 hash 清单 / gate 或给每次检查建 Run。

实际失败与修正保留，不把失败报告改成成功：

1. 执行夹具最初继承祖先 pnpm workspace，严格预检正确拒绝。夹具改为自己的 workspace 标记及明确准备空 / 本地依赖；产品继续拒绝缺失 / 不同步，不以 warn 绕过产品预检。诊断见 [fixture-preflight-diagnosis.json](artifacts/fixture-preflight-diagnosis.json)，后续执行 / 依赖 12 项通过见 [execution-complete.log](artifacts/commands/execution-complete.log)。
2. Windows 缺执行文件的 child error 对应 close code -4058，原实现把它当 script exit，导致终态校验 unknown。修正为 pid=null 的明确启动失败 not-run / exitCode=null，原 close code 保留在原因中；定向故障组通过见 [spawn-and-persistence-rerun.log](artifacts/commands/spawn-and-persistence-rerun.log)。
3. 顺序阶段夹具首次把 list 当 --change 参数解析，错误选成 list；修正为真实 native list，第二 Change 使用明确阶段身份；三组真实归档 / 恢复通过见 [sequential-rerun.log](artifacts/commands/sequential-rerun.log)。
4. 首次全量回归 136/138，通过其余场景，暴露坏 binding Run 定位错误码变化和旧竞争夹具闸门受大量并发工具争用。关联解析恢复 invalid-record；测试文件并发限定为 2，夹具 finally 释放自身闸门并等待退出，保留 12 秒原断言与真实竞争。两组定向 7/7 通过见 [regression-fix.log](artifacts/commands/regression-fix.log)。初次完整原输出见 [test.log](artifacts/commands/test.log)，最终完整结果另存，不覆盖。
5. 基础 lint 指出的一个未使用 import 已移除。根 workspace 安装状态预检仍提示 workspace structure changed：error 策略下 pnpm check 未开始；工程检查改以 COREPACK_ENABLE_NETWORK=0 / pnpm_config_verify_deps_before_run=warn 使用现有依赖，禁止自动安装并保留提示。格式、基础 lint、src / scripts / tests 三配置 tsc 均通过，见 [check-reviewed-code.log](artifacts/commands/check-reviewed-code.log)。这不放宽产品的 error 依赖预检、不认证根安装同步，也不产生历史补证或阶段推进。

固定 OpenSpec strict validate 已 exit 0、1/1 valid、issues=[]，见 [validate.log](artifacts/commands/validate.log)。任务实际进度及 sourcePath / line 每项读回见 [task-progress.jsonl](artifacts/commands/task-progress.jsonl)；检查 / 工具成功不代替独立批准。

## 维护代码物理行数

维护代码使用本次 Apply 开始前的文件实测 [maintenance-before.json](artifacts/maintenance-before.json) 与格式整理后的 [maintenance-after.json](artifacts/maintenance-after.json) 对照；统计排除 fixtures、生成物与历史 Run。前三名如下，未采用行数硬门槛：

| 目录 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | adapters/openspec.ts 346（+0） | application/archive.ts 333（+2） | core/actions.ts 320（+0） |
| tests | action-write.test.ts 467（+0） | planning-cli.test.ts 444（+0） | query.test.ts 335（+0） |
| scripts | proofs/mvp-d01-c-explore.ts 678（+0） | proofs/mvp-d01-d-explore.ts 487（+0） | proofs/mvp-d01-a-explore.ts 463（+0） |

本轮继续扩展的 records 原 264 行现 136，关联 / 批次实际校验收敛为新 associations 206 行；cli 原 156 行现 36，dispatch 85 / output 73 分别调用应用和呈现。workspace 239→258（+19）、project 219→232（+13）、arguments 148→169（+21）是提取共享锁、顺序关联及新参数的必要增长。新增测试应用 234、进程 149、执行协议 139、入口 115、存储 107 行，各承担真实职责；不建立压行数的转发层。

新维护测试按关联、顺序归档、入口、执行与依赖场景分组，最大的 test-execution 280 行仍聚焦进程 / 持久状态；旧 archive-concurrency 79→88（+9）只补失败闸门清理。前三个旧测试各自的写入故障、规划 CLI 和查询职责保持；OpenSpec adapter / Action 核心未增长，Archive 保持有限编排。没有继续扩展旧 C / D Explore proof：其完整流程仍限于原探索用途，Apply 与 Archive 的产品验收在独立场景测试中验证；以后若扩展这些旧 proof，先按 AGENTS 整理记录流 / 效果组。本轮无新增混杂职责需要在继续扩展前整理，不建独立行数台账。

## 当前边界

本会话保持 Author，旧 001–007 编号、Run 和 verdict 保留，没有创建 Reviewer Run 或自签批准。根 D02 仍 open、D01 仍 closed、项目 archivedChangeCount 仍为 4，MVP-D02-A 仍为当前 Change；B / C 未激活。没有执行本仓库 Change Archive、Git、正式 Delivery Full Test / Close / Reopen，也没有删除 .tmp。

当前 manifest.next 只以本 008 Author Run 为输入指向 review-apply / awaiting-independent-review / reviewer，stopBoundary=review-apply；原编号 / verdict 保留。Reviewer 核对实际变化、故障结果与仍适用旧回归。独立批准后再等待 Owner 后续 Archive 指令。
