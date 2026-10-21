---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: reduce-redundant-proof-inputs-and-artifacts
planningSlot: MVP-D05-C
batchId: 002-changes
actionId: reduce-redundant-proof-inputs-and-artifacts-review-explore-01
actionType: review-explore
role: reviewer
actor: codex-independent-reviewer
run: "027"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: explore-approved-with-explicit-proof-retention-boundaries
nextAction: propose
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-explore/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/026-explore/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/026-explore/run.md
---

# D05-C 独立 Review Explore：proof / inputs / artifacts 轻量化

**结论：approved（限 Explore，可以进入 Propose）；无此阶段阻断 Finding。** 固定 [026 Author Explore](../026-explore/run.md)，以根路线图 §7 D05-C、当前 `src/application/test-execution.ts`、`src/adapters/{test-store,test-process,group-store}.ts` 及真实 D04-B 014 历史为事实范围，核对 Author 的 P01–P04 和 Owner 已确认的保留与减量方向。当前 Change 仅有原生 OpenSpec `.openspec.yaml`，尚未 Propose/Apply。未修改 026 Author 原材料、历史 Run/审核、任何实际 product 代码或旧交付记录；D05-A/B 已归档的编号 014/015 保持。

## 026 关键结论和独立事实核对

| Source / Author 结论 | Reviewer 实际依据 | 判断 |
| --- | --- | --- |
| **P01** 历史 runs 文件与 0B 文件规模 | Author `026/artifacts/proof-results.json` 在其统计时点记录五个 Delivery **5,623 文件 / 353 零字节 / 66,537,110 bytes**；其中 D04-B 014 为 1,015 文件/77 零字节；脚本仅只读历史并列明目录统计。Reviewer 核对分 Delivery 数据合计、与路线图此前四 Delivery **5,410** 的不同时间范围。 | 数量是测量时快照，不是永久基线、可删除清单或大小 gate；仅 `.mendi/runs` 总体盘点，不应假定等于 product `.mendi/delivery-groups/*/tests` 日志总体 |
| **P02** group request/report 数量与缺失报告分类 | Reviewer 新建 [reviewer-history.ts](artifacts/reviewer-history.ts) 对真实 **D04-B 014-apply** 历史目录重新只读扫描，得 **114 request / 114 result / 107 report / 111 event**；缺 7 个 report 对应真实 child outcome `not-run:3 / interrupted:2 / unknown:2`；107 份报告清理状态 `confirmed:103 / unknown:4`，无缺失 report 与 passed/failed 同时出现的样本。结果见 [historical-audit.json](artifacts/historical-audit.json)。 | 026 分类与真实样本一致，但**缺失并不意味着这些 report/events 是可删除对象**，也不能将所有未来场景类比此历史样本；不可自行减损正式组报告、异常记录 |
| **P03** 真空日志不能等同可省略日志 | Reviewer 新建 [reviewer-quiet.ts](artifacts/reviewer-quiet.ts) 在新的**受控 product-v2 testTarget** 中实际执行 stdout 为 0 字节的 focused 命令，成功且 status `passed`；双日志为 `stdout=0B/stderr=13B`。暂时仅在该隔离目标重命名**零字节 stdout**，再次调用真实 `testStatus` 得 `unknown/ENOENT`；还原原字节再查为 `passed`。另执行 fast 实际失败，stdout 62B/stderr 92B，查询仍是 `failed`。见 [quiet-log-proof.json](artifacts/quiet-log-proof.json)。 | 当前系统必须有这两个受管日志文件；**禁止因为 0B 就直接删除或不再生成**。如实施新的明确 empty 协议，先一并修订 producer、身份/读回/诊断、正式组层与异常/恢复并用端到端正负例证明；如果兼容成本高，本轮可以保留 0B 日志 |
| **P04** 当前双日志读取与写入失败的真实性 | `src/application/test-execution.ts:85–93` 预建两个日志；`src/adapters/test-process.ts:38–45,124–174` 保留 fd/失败/取消观察；`src/adapters/test-store.ts:110–150` 的 `observeExecution/readExecution` 直接读取两个文件；`src/adapters/group-store.ts:65–103` 同时核 group 子结果、report、request 和日志。Reviewer 独立重跑 `node --test --test-concurrency=2 tests/test-log-integrity.test.ts`，**3/3 passed、exit 0**；含短写成功、零进展与抛错 unknown/锁保护，原始 [TAP](artifacts/test-log-integrity.tap.log) 和 [结果](artifacts/log-test-result.json) 已保存。 | 源码及行为足以证明零日志不是无关文件，且不能通过吞错、移除文件或清理未知现场来实现减量 |

另外 Reviewer 三份新的 [TypeScript proof](artifacts/reviewer-quiet.ts) 包含历史只读、安静/失败真实执行与已有回归 runner，由 [tsconfig.json](artifacts/tsconfig.json) 严格编译，**exit 0、零诊断**，真实命令/输出见 [typecheck-results.json](artifacts/typecheck-results.json)。Author 026 `proof.ts` 和 `history-proof.ts` 也由 Reviewer 独立以严格 `tsc --noEmit` 逐一检查，两项均 exit0，见 [author-proof-tscheck.json](artifacts/author-proof-tscheck.json)。因原 Author 脚本刻意要求原证据目标文件尚不存在，Reviewer 没有去覆盖/删除 026 已保存输出以复跑，而采用新位置的新 proof 重测影响结论的事实。

## Propose 必须收敛的可实施合同（并非新的 Owner 问卷）

1. **优先去无意义重复，而非减损证据身份。** 将可复建输入固定在受控 `scripts/`、`tests/fixtures/`（或项目明确受管的长期来源），新 Run 保留真实必要命令、路径、结果和**单一原始证据引用**，不得把唯一必要输入仅遗留在 ignored `.tmp/runtime`；同样不反复嵌套复制旧 Run 树、临时项目、同一成功输出和派生截图。不能将“只留引用”改成引用不存在/未经实际保留的目标。D05-B 已修复历史追加 intent 重复问题，C 不再设计第二套 hash 链或通用证据库。
2. **选择本轮 zero-byte 日志策略并将代价落到正式 Specs/Tasks。** 若保持两个物理日志（安全的最小方案），明确本 Change 不省略 TestExecution 的真实空日志、以证据复制去重为主要交付。若选择明确 `empty` 语义的新存储合同，要求有互斥、可验证的已结束空输出状态，不能把写入前空、运行中空、意外丢失、截断或未知统统按 empty 算 passed；同步 `parseExecution`、日志生成/读回、`testStatus`、groups-v1 父子验收及新旧格式只读与恢复，负例覆盖。**两条可行路线不要在 Apply 时由开发者自行猜测**；按实际收益选最小的可审方案，无需再向 Owner 请求同一已定方向。
3. **保留失败和正式验收原件。** 必需 `group-request`、实际 child `result`、protocol report / events（当语义要求）、stdout/stderr、清理和恢复现场、取消/not-run/unknown 的真实事实、独立 Reviewer 所需的直接源都不得因统计 0B 或缺 sibling 而无声删除。D01–D04 与已经提交的旧历史全部只读，不批量修复、补造或迁移空日志，也不得用跨尝试拼接 PASS。Propose 要区分“历史确实未生成某文件”和“未来协议允许合法省略它”两个不等价命题。
4. **验收按业务风险而非文件数量硬 gate。** 场景级别完成实际“输入可重建且单源、正常/失败/未知有可定位证据、历史仍可读、正式必需组完整”的正负例；缩小文件量只记录真实观测。UI 非范围内，不制造 Storybook 或其他目标安装需求。保持 Owner 新 Change 授权、Git、正式 D05 Full Test、Close、版本安装边界。

## 证据适用限制、授权与交接

- P02 重新扫描的是 D04-B **014-apply 这一个真实已批准历史目录**；不是全项目故障报告统计和未来形式的兼容证明。P01 的五 Delivery 统计是 Author **当时**快照，Reviewer 新增 027 证据后文件数自然变化，不应把该数字作为当前仓库 live 值。
- Reviewer 的零日志实验只在新建隔离 product-v2 `.tmp/mendi-apply-*/minimal-project` 目标进行；临时重命名仅影响自己的零字节日志，恢复后完成查询。自己的临时目标仅在精确路径、nonce marker、realpath、无锁验证满足时清理，不枚举/删除其它人的临时环境。没有运行新的正式 groups-v1 全量 Full Test，不因 focused/fast 成功推断正式交付。
- Owner 已在根路线图 §7 D05-C 确定“可复现输入优先、异常和历史保留、无需数量/体积 gate”；当前剩余是 Propose 的内部可逆选型，不存在需要为 Explore 暂停并再次索取 Owner 决定的未解产品方向。026 本阶段未修改实现、未生成 proposal/specs/design/tasks，是正确停止边界。

**verdict：approved；next：`propose / author / awaiting-instruction`。** 本 Reviewer 不提前创建 Propose/Apply、Archive、根 D05 Full Test、Close、Git、安装或 DreMo 写入。
