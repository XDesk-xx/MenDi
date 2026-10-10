---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: formal-full-test-and-scoped-repair
planningSlot: MVP-D02-B
batchId: 002-changes
actionId: formal-full-test-and-scoped-repair-review-propose-01
actionType: review-propose
role: reviewer
run: "016"
status: completed
actionStatus: completed
result: approved
verdict: approved
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/formal-full-test-and-scoped-repair/015-propose/run.md
---

# MVP-D02-B Review Propose

Owner 指令：重点检查正式 Full Test 输入、同一锁内执行接入、修复后结果适用性和引用边界，保持简单，不增加 gate。按项目 review-propose 方法，固定审核 015 Propose 及其 proposal、design、三份 delta specs 和 tasks，沿用 014 已认证的限定 proof。

**verdict：approved。** 无阻断发现。015 的方案、三份 delta 与 30 项任务足以进入 Apply；本次不认证尚未实现的正式验收能力，不修改 Author 方案或实现。

## 四项重点审核

| 重点 | 独立结论与任务落点 |
| --- | --- |
| 正式 Full Test 输入 | 首次执行要求 open product、无活动 / archiving Change、全部本轮计划槽位归档；只读这些项的直接 Archive / Review Apply / 固定 Apply Author。collection / basis 是显式声明，命令来自实际 full 入口，普通旧 PASS 不可被认领。admission 缺失、错身份、未完成审核与越界已有场景及 tasks 1.1、2.2、3.5 覆盖。 |
| 同一锁内执行 | 内部执行服务接受已取得的 lease，负责真实子执行生命周期，不二次获取或释放外层锁；普通 runTest 保留自身持锁合同。父 Run / 指针和子意图在启动前保存，终态前复核实际直接输入；日志、父子结果、读回或释放失败不发布已确认通过。tasks 2.1–2.4 同时覆盖旧合同、竞争、输入变化和部分写入，未以公开 runTest 嵌套代替接入。 |
| 修复后适用性 | 固定当前明确 failed、scope 和原完整 collection，修复后的新 Author 由独立 Review 固定；修订替换当前交接，旧 approved 不可复用。新 full 重跑整个集合，允许已审核的范围内配置修复，不因 script 字节变化机械重开 Explore。持久 outcome、scope / command 匹配和 requires-semantic-check 分开，未承诺自动认证任意源码。tasks 3.3–3.5、4.2、4.4、6.1 覆盖对应场景。 |
| 引用边界 | deliveryRunRef 表达当前进展，fullTestRunRef 表达最近正式结果；用途不同，不按最大目录号猜测。普通查询只消费当前头部和实际必要直接结果 / 日志；审核和正式执行才各自读直接对象，后续适用快照不递归追读旧批准或失败父链。tasks 4.1–4.7 包含旧材料缺失、当前输入错误、并存冲突与后续关联边界。 |

Design 的 admitted → prepared / running → 实际执行 → 父子结果读回 → 释放过程与 delta 的失败语义一致。声明固定后工具 / 依赖拒绝记正式 not-run，子 executionId 可空；普通命令预检不占号规则保持。新意图固定后指针不回退旧 PASS；unknown / 未完成现场只读诊断并停 Owner，不自动 finish、retry 或 unlock。

修复 / Review 使用同级 Delivery Run 和已有 save / submit / continue 的 scope 分支，旧 Change 规则保留；Full Test 禁止普通 submit 自填 passed。rejected 与 changes-requested 分别停 Owner 和转新修订，明显自签拒绝，actor 仍只是声明。首次必要输入核对与后续沿用快照的不同用途已写清，不把全部历史可读作为每次查询或重跑的门槛。

## 范围与复杂度

- 正式验收编排、Delivery 记录 / 规则、底层执行分别承担实际职责，未给普通 tests.ts 继续叠加整套验收逻辑。新增命令前整理 dispatch；验收按正式执行、修复、查询和写入 / 并发分组，不扩写旧 proof 或 planning-cli 长流程。
- 原有方法加载、编号、安全路径、写锁与记录原则复用，没有通用注册框架、恢复平台、材料批准阶段、全库 hash 或任意行数 / 证据 / 覆盖率 gate。普通 check 与维护观察保持工程侧约定。
- C 仅预留直接消费本轮范围、必要审核和适用正式结果的入口；本轮不实现 Close / Reopen、新范围编辑或新 Delivery Open，不迁移人工历史。
- 已对照主规格检查四项 MODIFIED Requirement 的原场景：2→2、6→8、5→5、8→10，未遗漏原场景；新增 Delivery 场景与旧 Change / manual-bootstrap 兼容边界一致。

## 验证及适用限制

| 检查 | 实际结果 |
| --- | --- |
| 固定 OpenSpec `validate formal-full-test-and-scoped-repair --strict --json` | exit 0，1/1 valid，issues=[]，见 [validate.json](artifacts/validate.json) |
| 固定 OpenSpec `instructions apply --change formal-full-test-and-scoped-repair --json` | exit 0，ready，0/30 complete、30 remaining，见 [apply-instructions.json](artifacts/apply-instructions.json) |
| 固定 OpenSpec `instructions tasks --change formal-full-test-and-scoped-repair --json` | exit 0，design / specs 依赖均 done，无额外 artifact rules；context 与范围、角色及授权边界一致，见 [task-instructions.json](artifacts/task-instructions.json) |
| 当前代码接入核对 | 实际 runTest 自行持锁、既有 lease owner 校验与同级编号扫描支持设计中的复用判断；当前 Change context 确实不能直接承接归档后修复 |

沿用 014 已独立重放的四组 Explore proof，只支持其限定事实。本阶段没有实现变更，不重跑全部行为测试或旧 proof；同一锁内的父子接入、失败保留、当前指针选择与实际适用性处理须在 Apply 按现有任务验证，不能由结构验证或旧 proof 提前认证。

语义限制已在方案中明确：项目锁不隔离编辑器或未遵约脚本修改源码；collection / basis 和 commit / changes 由真实阶段工作提供，CLI 不认证任意材料。发现受测变化或无法确认时须在阶段结论中说明并按影响补验，持久 passed 不直接成为 Close 授权。保留这些限制即可，不为消除限制新增自动源码扫描或历史补证流程。

## 交接

转交 Author `apply`，当前必要入口只指向本 Run，固定 authorRunRef 定位 015；保留 013–015 与全部旧编号、正文和 verdict。30 项任务仍未实施、未勾选。

完成后的新进程 status / next 读回见 [readback.json](artifacts/readback.json)。D02 open，D01 closed，A archived，B 为当前 Change，累计归档数 5。本轮未执行 Apply、根正式 Full Test、Archive、Git 写操作、Close / Reopen 或激活 C。
