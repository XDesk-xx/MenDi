# Design

## Context

见 [Proposal](proposal.md)。当前 D04 已有 `groups-v1` 实际 runner / group-report、Run/子执行、候选、锁与中断核对；根 D05-A 经 002/004 Explore 和 003/005 独立审核确认 P01～P04。P01 已能在中段失败后继续独立组；P02 的 known `blocked` 可在安全恢复后整轮 initial 重跑。P03 因现有 `groupAdmission` 直接取不存在的 `testAttemptRunRef` 而阻断旧 command failed → 修复审核 approved → 首次 groups-v1。P04 能把旧 PASS + 局部 retest 经 verification-create 拼成 `verified`，与 Owner 新合同冲突。

既有行为合同分别位于 `openspec/specs/{delivery-verification,test-execution,delivery-lifecycle,action-runs}/spec.md`；本 Change 的 delta 要替换新写入准入，但历史完成记录必须依其**当时版本和类型**可读。根 MenDi 工作区依旧为 `manual-bootstrap`，只用它记录当前阶段，产品改动验收需对隔离的 v2 product 夹具执行。D05-B/C/D 的其他需求和实验性 `external-full-test` stash 不并入。

## Goals / Non-Goals

**Goals**

- 将新正式验收收敛为 `delivery full-test run --input <groups-v1>` 的**一次全计划必需组执行**，建立稳定的正式结果身份。
- 新 Run 以自己的协议回执、命令、全部组、实际清理、写入和直接读回给出 `passed`/非通过，无额外 `delivery verification create` 或例行 `owner-decision`。
- 代码/断言/入口语义修复继续按 `delivery-repair` → 独立 `review-delivery-repair` → **新全量 Full Test**。纯可核实环境准备问题不产生空 Repair/Review Runs；不明现场停 Owner。
- 解决旧 command failed 且本轮已获独立修复批准时的首次 groups-v1 新执行衔接，同时保留旧记录和当前闭环授权边界。
- 一套一致的 CLI / status / next / Close / Run 解析与兼容测试，能区分旧历史和新正式 PASS。

**Non-Goals**

- 修改目标项目的实际业务断言、自动添加服务预检或调度资源；runner 仍由目标实现。
- 实现正式增量续测 / 来源合成、跨尝试缓存、外部未受管 Full 直接认证、自动 Reviewer、全量 hash / 证据图。
- 处理 D05-B 的追加 Change、D05-C 的全面证据去重、D05-D 的 Run amend/supplement；不改变旧 D01～D04 verdict 或已完成 Close。

## Decisions

### D1. 复用已存在的 group 执行器和 Delivery Run 类型；用新版本明确新正式语义

首选保留 `delivery full-test run`、`runGroupAttempt` 及其底层 group runner / 事件 / 子执行；新写入仍为现有受管 `delivery-test-attempt` 路径，但新增**带版本辨识的完整正式结果合同**（如 `attempt.version = 2`，包含 `formalOutcome`、完整组快照、观察/清理依据、已确认的候选与批准快照）。v1 `delivery-test-attempt` 和 `delivery-verification` 的解析、status 与已关闭生命周期消费维持历史分支，不把 v1 的 `progress` 自动追认成 v2 PASS。

- v2 只接受 `purpose: initial` 与选中全部必需组；新请求没有旧 `continue/retest` 写入。提交时 `Run.result = passed` 仅在 v2 自身的 `formalOutcome = passed` 且后续直接读回稳定时设置。
- 历史 v1 的合法已存 `continue/retest` 继续按旧规则查询；不能以新 v1 写入逃逸规则。所有关键消费者必须显式分支拒绝未知版本，不能误读 v2 为旧 attempt。
- 不新建第二条“Owner 接纳外部 command PASS”运行路径，不把整个旧 command 结果伪造为组报告。
- 同一请求/计划/候选和执行身份固定在原锁内，原父 Run、受管子命令、真实 `group-request` / `group-report` 一起解释，不提升 event 或 wrapper 成功为最终结论。

*对比方案*：另建一个全新 Run 类型或继续用 verification-create。前者增加路径、Run parser 和生命周期分支的重复；后者保持不必要的额外正式 Run。复用 typed attempt 的版本化合同改动更局部，但必须确保所有版本校验、Close 和 status 全面贯通。

### D2. 正式 PASS 由同次完整事实计算，不以文本或客户端声明决定

执行前固化完整计划（必需组、依赖、事前有理由排除的非必需范围）、当前轮完成绑定、直接审核/基线和实际候选。报告有效并不自动认定业务断言充足，但至少强制：

1. 全部必需组都属于本次 `selection`，每组恰一条与 `group-request` 一致的真实终态；无假填旧 `sourceRunRef`、旧成功组、旧缺口抵扣。
2. 逐组真实根容器和业务计数通过，必需 skip/TODO/cancelled/pending 为零，非业务 command 的完整产物与判据成立。单独预检或 wrapper exit0 不得 PASS。
3. `cleanup: confirmed`、真实子执行结束、必要日志 / 最终回执保存、Run 及其受管快照提交和直接读回稳定；出现取消、晚期错误、协议 invalid/unconfirmed 或写入/锁未知，按实际 outcome 拒绝 PASS。
4. 普通业务失败继续其后依赖独立且资源安全的组；依赖失败 blocked、清理失控停相应共享项，报告所有失败、阻断、未执行与耗时。最终失败不能被后续独立通过覆盖。

可重用 `interpretReport`、`inspectAttempt`、现有组事件和时间模型，但必须建立一个以**本次完整 v2 Run**为边界的最终聚合/读回，并让 `status` / `next` / `Close` 使用同一含义，而非各自重新猜 PASS。

*对比方案*：仅令全部 `progress` 为 passed 即退出，或新增一个无真实子测试的 verification Run。均不足以证明当前完整执行身份与最终清理一致。

### D3. 准入衔接只引用真实当前失败与审核，不构造旧 group attempt

新运行的 `fromRunRef` 若指向当前提交完成的 `review-delivery-repair`，先按当前轮、真实 Author、直接失败、reviewer actor、verdict approved、非空正文和范围/计划一致性验证必要修复。修复的失败来源可为：

- 已存的旧 command `delivery-full-test` failed：直接消费旧失败与当前修复审核，创建新的完整 v2 组 Run；无需不存在的旧 `testAttemptRunRef`，更不更改旧 `fullTestRunRef`/Run/outcome。
- v2 组 Full Test 的 known failed：消费当前对应修复审核并创建新的完整 v2 Run，**不沿用旧通过组**。
- 安全确认无实质更改的本轮环境准备失败/blocked：按 D4 的窄例外，重建整轮，不提交空 Repair/Review。

继续保留必要的直接批准/基线和本轮完整计划对照，遵守当前锁与 direct input 一致性；不能把 `fromRunRef` 文本或 Reviewer 标签当真人授权。rejected、changes-requested、陈旧、跨轮与 unknown 均拒绝。

*对比方案*：在旧 Run 上补 `testAttemptRunRef`、导入旧 stdout 推断组通过或修改 `failed`。这些会伪造事实，禁止采用。

### D4. Repair / Review 是实质修复交接，环境例外是窄的 Author 重跑准入

- 代码、断言、测试入口或配置语义修改 → 现有 `delivery-repair` / `review-delivery-repair` 及相应 `revise-delivery-repair`；Reviewer 只审核真实改动与定向验证，不替 Author 执行根正式全量测试。
- 本项目普通服务/端口/临时资源已真实确认归属、恢复与清理，且无源码/断言/执行配置语义改变 → 保留原测试记录，当前新执行声明仅指向该次直接失败/阻断和实际可核实环境处置（原因、涉及资源、身份和清理/再预检结果）；不生成空修复 Run，重新**完整初始执行**。
- 不通过泛化的 `reason: environment` 字符串自动批准：程序核对必要直接身份、旧结果稳定、真实场景与当前完整计划/候选一致，Author 负责真实性说明，必要时用目标已有准备脚本重新确认。必要证据缺失、环境分类无法证明、资源属外部、未知停止/锁均 fail-closed，实质变化归 Repair/Review。
- 修改测试配置行为本身不是环境例外；修复合法完成也不自动授权新的 Full Test（沿当前范围内实际正式测试授权边界）。

*对比方案*：所有 failed 一律建两份 Run 审核，会重复 DreMo 已暴露的环境准备成本；所有 failed 一律允许立即重跑又会绕过实质缺陷审查。按可核实的失败类型和真实资源状态区分。

### D5. Close 消费最新完整正式组 Run，并保留旧历史查询

**唯一新 Close 选择：`testAttemptRunRef`（不采用旧 `fullTestRunRef` 参数别名）。** 新 v2 正式 Full Test Run 继续使用 `delivery-test-attempt` 身份、`attempt.version=2`，持久化后当前 `manifest.testAttemptRunRef` 指向它、`manifest.deliveryRunRef` 同时指向最新本次正式进展。新 `delivery close --input` 的 JSON 必须恰含 `testAttemptRunRef`（另含必要材料适用性），指向这个同一 Run；不接收 `fullTestRunRef` 或 `verificationRunRef` 作为新写入选择器。收口保存其**原 typed 指针**及经校验的 v2 acceptance 快照；扩展 `Lifecycle` 解析、轮次/投影/closed 完整性及 Close 读回以识别这条新类型，但**不把 v2 Run 赋给 `manifest.fullTestRunRef`**。

旧 `manifest.fullTestRunRef` 仍只指向旧 `delivery-full-test`，旧 `verificationRunRef` 仍只指向旧 `delivery-verification`，旧 v1 attempt 自身可以按历史类型查询；本轮后续 v2 执行不覆写这些旧指针。旧已完成 Close 仍使用保存时的 `fullTestRunRef` 或 `verificationRunRef` 来**只读解释历史快照**；新版 Close 写入绝不接受它们，即便本轮已存在旧 command passed / v1 verified。

新 Close 的准入按同一组事实核对：当前轮 open、所有槽位已归档、无活动/未完成写入，**Close JSON `testAttemptRunRef` = `manifest.testAttemptRunRef` = `manifest.deliveryRunRef`**；读取对象必须是该轮的 v2 `delivery-test-attempt`，本次 `formalOutcome = passed`、全必需组真实覆盖、协议/完整报告/清理与命令终态 confirmed、批准/基线和材料适用性成立，Run 与必要直接快照稳定。后续 Repair/Review 或新的正式 attempt 已取代旧进展时，最新指针不一致就拒绝；不能退回历史 PASS。对合法完成的旧 Close 显式只读查询仍按其旧型字段解释，不要求重做正式测试，不借历史读兼容进行新的旧格式 Close 写入。

写入与查询分流须在核心 parser、`src/core/rounds.ts` 的 pointer/type 与 closed 准入、`src/adapters/delivery-runs.ts` 的 typed 指针投影、`src/core/delivery-lifecycle.ts` 的新 Close 格式、`src/application/delivery-lifecycle.ts` 的当前事实核对和 status/next 全部使用同一 v2 权威选择。当前 product 仍要求 closed 轮次有旧 `fullTestRunRef` 或 `verificationRunRef`，**Apply 必须扩展为允许本轮新 `testAttemptRunRef` 完整收口**，同时确保旧轮按旧 Close 可读。

*对比方案*：让新 Close 继续绑定 `verificationRunRef`，会保留旧多来源拼接路径；在新 Run 中假装 `fullTest` command 会混淆类型。采用明确 typed 分支。

### D6. 同步 CLI、方法、规格和回归，而不是只改指引

`src/application/{delivery-full-test,group-admission,group-attempt,full-test-admission,candidate-verification,delivery-repair,delivery-lifecycle}.ts`、`src/core/{group-records,delivery-runs,delivery-verification}.ts`、各 readback adapter/CLI 和 `skills/actions/{delivery-full-test,delivery-repair,review-delivery-repair}/SKILL.md`、`skills/group-tests.md` 必须根据新合同对齐。新正式 `verification create`、`purpose: continue/retest` 只读历史，不允许从 CLI 或内部 API 绕行。避免将 v1 查询逻辑直接删除，因为它仍负责读旧 Run 与旧 Close。

常规 `check / build` 和受影响测试完成后，专门做隔离 product-v2 真实执行端到端测试；不得用本次 Explore 的夹具 reviewer 标签当 MenDi 根审核、也不能直接操作 DreMo 历史来验收。

## Risks / Trade-offs

- **[新 Run v2 与稳定 0.2.0 不兼容]** → 新旧格式按版本读，回归覆盖老 Run；发布之前验证新的稳定安装读取新格式，升级后生成新格式的目标不得直接降级到不认识它的旧安装。
- **[环境豁免分类不够可靠]** → 严格限定有直接证据的已知环境准备问题；缺充分证据时拒绝旁路，不把原因字符串当自动认证。
- **[旧 verified 的新 Close 误放行]** → 当前指针与格式/version/type 判别，负例覆盖新尝试取代旧 verified、混用 selector、旧 PASS 不能收口。
- **[失败组继续时资源污染]** → 依赖阻断与共享资源隔离仍由目标 runner 实施，MenDi 核对实际组终态与清理；unknown 不继续。
- **[压缩验收流程降低审核质量]** → 仅取消没有执行测试的汇总 Run，不取消真实独立 Repair Review、必需覆盖、失败原始日志、Close 授权或 Reviewer 的语义审核。
- **[模块职责继续膨胀]** → 新读写版本与正式结论分支按边界局部整理已增长的混杂职责，不为压行数新增无意义转发层；Apply / Review Apply 列出 `src/`、`tests/`、`scripts/` 当前最长文件和有依据的增长。

## Migration Plan

1. 新实现只切换**后续新正式写入**路径，先针对旧 command failed 和新 v2 的多种当前状态做只读/写入准入矩阵；不修改 D01～D04 已存 Run / verdict / Close 或归档目录。
2. 在隔离 product-v2 目标验证全量组通过、失败、修复审核、环境例外、旧 command 首次衔接与断点恢复；保留 0.2.0 的真实历史报告只读；新写入不再接受 v1 continue/retest/verification-create。
3. 根据 Author Apply / 独立 Review 的实际结果和另行授权的正式 Full Test、Close、打包/稳定安装，再考虑切换候选版本。Git、部署和真实 DreMo 迁移均不在本 Proposal 自动实施。
4. **回退**：若尚未产生 v2 新 Run，可以恢复先前稳定安装与配置；若目标已写入 v2 记录，旧 0.2.0 无法保证读取，不直接用旧软件接管，应保留现场并使用识别 v2 的版本按单独授权处置。

## Open Questions

无阻断中的 Owner 产品决定。Owner 已明确：新完整正式 Full Test 可直接 `passed`，无额外 `delivery-verification` / 例行 `owner-decision`；但 Close 仍单独授权。具体字段名与代码拆分以 Propose 审核及 Apply 的最小可维护实现确定，不得改变以上验收语义。
