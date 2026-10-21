# Design

## Context

依据 proposal.md、026 Author Explore 与 027 独立 approved。现行 TestExecution 在 prepared 阶段真实建立双日志并由 test-store/group-store 直接读取。Reviewer 独立证实：无 stdout 的 focused 可 passed，但将 0B stdout 文件临时移走后，status 变 unknown/ENOENT，恢复后 passed；3/3 日志故障回归通过。D04-B 014-apply 的 114 份 request 对应 107 report，7 份缺失属于 not-run/interrupted/unknown，不能因其缺失而推断安全删减。当前 tests/helpers.ts、tests/test-support.ts、tests/group-support.ts 可选择额外采集命令、执行、场景、report 与日志，部分信息被重复打包。

## Goals / Non-Goals

**Goals:** 让未来新阶段的唯一原件可定位、输入可复建，减掉测试/Proof 场景对相同原件的重复复制；失败、unknown、正式回执与未完成现场保持完整。

**Non-Goals:** 不修改 TestExecution formatVersion=1、双日志路径或正式 groups-v1 的请求/报告/清理语义；不回改 D01–D05-B 已提交历史；不建泛化证据数据库、全库 hash 链、自动清理后台任务或 D05-D supplement/amend。

## Decisions

### D1. 首版保留两个物理日志，零字节也不省

现行 src/application/test-execution.ts 为每次执行提前创建 stdout.log 和 stderr.log，src/adapters/test-process.ts 实际打开 fd、记录短写及取消，src/adapters/test-store.ts 读取两份真实日志，group-store.ts 还验证正式子命令与最终报告。新合同继续原样执行：真正 0B 的日志文件仍保存；缺失/截断/写入不确认仍是损坏或 unknown，不能作为“合法 empty”。

**拒绝的替代：**写后 stat.size=0 即删除，或读端将 ENOENT 强制替换为 empty。它会破坏 026/027 实际负例及历史兼容。以后若有新的明确范围和授权，可另行规划互斥 empty 状态及其全链路验证，不潜入本 Apply。

### D2. 有界的单源证据采集辅助，只作用于未来 opt-in Proof

在 tests/ 中建立一个明确职责的 TypeScript 辅助（可命名 evidence-support.ts），供已存在的 MENDI_TEST_EVIDENCE_DIR / MENDI_APPLY_EVIDENCE 环境模式及指定 Apply/Review 真实场景选择使用。一次受控采集会话里的同一受管源保留**一个必要原件**，其它摘要保存可核对的相对来源与真实执行身份、命令、场景和 outcome。不同真实执行即使 stdout 文本相同，也不是同一来源，不跨执行内容去重；不生成全库 hash 清单、追溯 DB 或附加审批。

引用的生命周期是准入条件：
- 输入可由受控 scripts/ 或 tests/fixtures/ 重新构建时，保存真实入口、参数和本次结果，不复制整棵临时工程。
- 如果同一原件已在当前或明确持久受管 Run 内保存，可直接引用它；重复 JSON/JSONL 不再嵌入第二份。
- 如果唯一原件仍在运行后要删除的隔离夹具，必须**在目标被清理前**仅复制真正必要字节一次到当前受管 evidence，或者报告 incomplete、保留现场，不能只留下死链。
- 失败/unknown、真实片段、资源清理、未提交/中断及 Reviewer 所需直接事实，继续保留足够的原始证据；不强制在成功场景复制所有 stdout / report。

**拒绝的替代：**全目录扫描、按照文件名/0B 判冗余、复制上一 Run 树、将所有成功 stdout 全部打包并在每份 Review 再保存。既不能保证身份，也会扩大已经发现的重复问题。

### D3. 对现有调用者定向适配，正式执行文件不参与去重

检查并按实际重叠点修改 tests/helpers.ts 的 command 记录、tests/test-support.ts 的 execute 场景结果和 tests/group-support.ts 的 groupRun / recordApplyScene：同一直接执行的原始日志与 report 优先复用已经真实保存的来源，必要时做一次稳定证据落盘，其他使用引用；每一份不同 group child 与其独立报告仍是不同真实事实。要保留启用与关闭 opt-in 环境变量两种行为的适用测试，未启用时不额外写证据。

src/application/test-execution.ts、src/adapters/test-process.ts、src/adapters/test-store.ts、src/adapters/group-store.ts 的**正式**保存/读回逻辑不改变。后续验收用受控 product-v2 夹具的真实 passed、failed、unknown 及 report 缺失等负例验证原结果与定位正常。若未来为证据辅助添加独立写路径，使用当前受管目录、唯一原件标识和安全写入，不覆盖已提交 Run/verdict。

### D4. 方法与文档只约束真实来源，不制造新审批字段

更新受影响的 Explore、Apply、Reviewer 工作方法，说明可复建输入的源码位置、执行方法和直接结果，以及唯一失败原件如何留在当前 Run。README 只记证据选用规则和现有 opt-in 入口，不复制总设计。记录缺少真实原件时明确限制，不能把语义不成立的链接当成 proof；不要求全部 Run 增加新字段，不强制为减少文件数创建额外 Change/Action。旧 014-apply、D05-A/B 以及其它 submitted 历史完全不修改。

## Risks / Trade-offs

- **临时路径引用失效** → 提交前验证来源生命周期，必要字节只保存一次或报告 incomplete；不可猜来源仍存在。
- **不同测试被错误合并** → 去重基于同一真实受管执行与精确原件，而非文本内容相同。
- **Reviewer 无法核对原始失败** → 场景测试覆盖失败、unknown、取消与部分写入，缺必要源必须拒绝完整证据声明。
- **零字节优化引起假 PASS** → 本轮明确不省略双日志、不放宽任何原解析/身份/恢复逻辑。
- **采集工具变新权威层** → 只改 opt-in 场景摘要，正式 Full Test/Close 唯一权威和历史 Run 保持原状。
- **历史证据被意外清理** → 无迁移、无删除 submitted、无批量文件清理。

## Migration Plan

1. 新辅助仅影响后续可选测试/Proof 采集，旧 TestExecution、groups-v1 和历史文件不需要格式迁移。
2. 在隔离 product-v2 中验证相同来源只存一份、临时唯一原件复制一次、失败/unknown 和正式 group 直接文件继续可查，再跑相关测试及 pnpm check / pnpm build。
3. 失败时只回退新的采集辅助与方法接线，不修改已经提交的历史或形式化测试终态。
4. 交独立 Review Apply 后再按 Owner 分别授权 Archive、Git、整个 D05 Full Test/Close 与版本安装。

## Open Questions

无。当前提案已经决定保留实体空日志。辅助实现的具体内部函数名可在 Apply 根据 tests 现有结构命名，但不得改变上面的范围与验收合同。
