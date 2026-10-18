---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: full-test-orchestration-continuation-and-revalidation
planningSlot: MVP-D04-B
batchId: 002-changes
actionId: full-test-orchestration-continuation-and-revalidation-review-apply-01
actionType: review-apply
role: reviewer
actor: codex-independent-reviewer
run: "015"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: apply-approved
nextAction: archive
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/review-apply/SKILL.md
authorRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/014-apply/run.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/014-apply/run.md
---

# MVP-D04-B 独立 Review Apply

**结论：approved，无阻断发现。** 固定 [014 Author Apply](../014-apply/run.md)，对照 [011 补充审核](../011-review-explore/run.md)、[013 方案审核](../013-review-propose/run.md)及当前正式方案、规格、任务。当前批准是本 Change 的实施审核，不是根 Delivery Full Test / Close、发布或真实项目接线批准。保持 Reviewer，没有修改实现后自签。

## 独立方法与覆盖

读取稳定安装 MenDi review-apply 与 OCR delegate 方法。OCR 仅负责选文件与规则，语义审核由本 Reviewer 完成。preview 前排除历史 artifacts、依赖、生成物及未扩展的009 Explore脚本。1263项中选入38项，逐项审核，跳过0；另外补读默认漏选的行为测试、关键 Node / Worker fixtures、方法与正式规划。清单和排除理由见 [review-coverage](artifacts/review-coverage.json)。第一次规则命令把路径误拼成单参数，保留该输出并用路径数组重取；只采用 ocr-rules-corrected.json。选中文件数量不代替正确性判断。

审核重点是从真实 target 输出到 protocolState、durable attempt、当前 progress、显式来源、候选结论和 Close 的消费链。检查了旧 command 分流、修复准入、轮次投影和历史读取差异；旧测试改动是实际 union 收窄，原断言未删除。直接运行当前全部 group 行为测试，而非只沿用014的通过数量；另编写独立组合程序，复用建靶/真实启动助手，独立编排刺激、断言和消费者调用。

## 011 E1–E6 的落地核对

| 疑点 | 实际实现与本次验证 |
| --- | --- |
| E1 skip/TODO 发 pass；E5 collection完整但零业务 | group-node-runner读取真实文件业务摘要，空文件容器不算业务；group-report要求实际passed非空，未排除failed/cancelled/skipped/todo/pending为零。group-attempt真实全skip/TODO及空文件失败；group-completion另验证执行前排除、非空必需断言与实际构建产物。计数不宣称业务充分性认证。 |
| E2 同文件先pass再fail | 真实同文件混合断言失败；最终根结束/错误及业务计数共同约束，不能由成功文件集合或尾项pass覆盖。独立组合进一步消费较新失败后的成功尾项。 |
| E3 pass后exit7；取消与断言失败 | 真实beforeExit置7被拒；真实前台树取消与文件AbortSignal取消分别验证，文件cancelled不被根容器failed替代，后项not-run。取消+wrapperZero为invalid，确认停止的取消仍不可复用部分成功。 |
| E4 回执失败而包装器exit0 | 真包装器exit0保留child passed，协议为invalid，attempt失败；inspectAttempt、当前progress及候选准入共同禁止挑选其通过组。安全完成的invalid释放自己的锁；清理未知仍保留现场。 |
| E6 child close后保存/读回/释放失败 | group-boundaries对三处真实执行后故障注入，顶层unknown、锁保留、不占后号。独立补验特意选择最容易误认的释放前故障：磁盘父记录已经submitted/result passed、协议valid、三个组全passed；verification create和旧verified Close仍因锁拒绝，编号不增长。 |

对应原维护场景与测试名见 [group-tests.log](artifacts/group-tests.log)：**26/26，exit0，332548ms**。这些包含真实pnpm/Node执行、真实端口占用、取消和故障注入；group-contract中的畸形字段/计时检查是结构单元测试，未混称业务执行证据。不是每个E反例都另跑一次完整Close：各实际负例验证非通过事实，汇总/Close共同消费门另由集成场景与下述组合验证覆盖。

## 013 组合路径及独立对抗结果

1. **中段失败→独立尾项continue通过→修复原失败→当前独立批准→局部retest→多来源verified/Close**：本次重新执行group-verification的真实集成链。latest tail的command passed并不解除progress中原失败；currentFailure固定未解决直接来源，修复/审核没有回退当前指针。原失败字节保持。
2. **跨候选沿用与公共影响**：真实局部断言修复可在当前影响批准下保留prefix/tail；真实共同模块与全部消费者改变时，缩减选择写前拒绝，完整复验后才verified。common/unknown影响不能声明局部沿用；影响判断仍是实际阶段审核责任，不是源码扫描认证。
3. **旧通过→较新中段失败→尾项又通过→显式挑旧中段通过**：新增 [independent.ts](artifacts/independent.ts) 验证该完整组合。来源特意只将middle换成旧通过，prefix/tail选当前真实通过，避免因其他无关来源不匹配就误称证实。返回incomplete，唯一业务缺口为middle当前仍失败/来源被替代；旧verified与新incomplete均不能Close，原失败字节保持。第一组刺激改了测试源码却复用候选声明，是额外的不诚实声明负例；随后用 [same-source.ts](artifacts/same-source.ts) 补强：首次执行前即写好相同测试，之后只切换受控业务刺激，校验测试源码字节未变，再次得到同一拒绝。结果分别见 independent-results.json、same-source-results.json，两个程序均exit0。
4. **新尝试替代旧verified**：真实CLI场景重新验证旧入口Close拒绝，Reopen不继承新轮指针，历史查询仍保留原结论。当前必要快照坏不回退历史；移走非当前旧失败/审核正文不强迫递归旧链。
5. **外层unknown而内层全成功**：independent.ts第二条如E6所述，直接尝试构造结论和使用先前verified Close，均拒绝且未分配后号。隔离目标的实际锁保留，不自动处置。该证据比仅断言下一次run失败更直接地覆盖了正式消费端。

独立程序保存本次request/report/events/child与必要日志在artifacts/groups，场景输出为group-scenes-*.jsonl；仅存各次直接原件，不复制历史树。受控目标可由脚本和维护helpers重建，.tmp不是唯一输入。隔离夹具中的Author/Reviewer标签只是产品准入测试，不代表根会话换角色或自动审批真实修复。

## 工程结果、历史失败与限制

- 本次 `pnpm check`、`pnpm build` 均exit0，见check.log/build.log；包含真实src/scripts/tests类型检查，无自动修复。
- 本次 `node --test --test-concurrency=2 tests/group-*.test.ts` 为26/26；两个Reviewer程序经独立tsconfig真实tsc检查并实际执行成功。
- OpenSpec固定1.14.1 strict validation exit0，见validation.json；git diff --check通过。
- 014的root-test-repaired.log确为完整273/273，其较早中止/失败集合仍保留；随后一致性修补有consistency-before两失败、after两通过及final-focused31/31。核对了这些结果的先后和改动范围，未把273冒称为最后两处修补后的新全根收集。本次26项包含收尾一致性两例；旧command未受这两处新typed/group修补影响，沿用原完整根回归。本次未重跑根273项，更不是根正式Full Test。
- 参考runner信任目标如实报告真实业务/资源情况，材料适用性仍需语义审核；未认证任意第三方runner或恶意伪造报告。复用/并发仅验证受控同次Worker目标，没有对照组，不宣称提速比例。Windows/当前Node环境的观察不扩展为其他平台认证。

## 维护代码规模与职责

独立以物理行计数，排除fixtures/依赖/生成物；增长基准为当前HEAD 168a4cb54f0c9028eaf9c271b43d9ee14c3ae904，详见review-code-counts.json。

| 目录 | 前三名及物理行数 | 对HEAD变化 |
| --- | --- | --- |
| src | application/project.ts 374；core/delivery-runs.ts 372；application/delivery-lifecycle.ts 371 | +20、+100、+37 |
| tests | action-write.test.ts 467；planning-cli.test.ts 444；delivery-repair.test.ts 394 | 0、0、0 |
| scripts | proofs/mvp-d01-c-explore.ts 678；mvp-d01-d-explore.ts 487；mvp-d01-a-explore.ts 463 | 0、0、0 |

明显增长集中在typed记录总入口和Close分支，已把计划/报告/组记录解析、直接存储检查、attempt准入/执行、候选构造分到实际承担职责的模块；project只增加类型分派，未承接协议实现。新增group-attempt 367行协调同一锁下父子执行/持久提交，拆出的group-admission与group-store有独立职责，当前没有为压行数添加纯转发层。旧长proof未扩展，保持限定用途；未来若继续扩展须先分离Apply记录流与Archive效果组。本次旧proof仅结果union收窄，不重写其历史输出。暂无需先行整理的阻断项。

## 交接与停止

仅新增015 Reviewer记录及直接证据，并按manual-bootstrap更新manifest/README/context；009–014及原verdict保持，未改Author实现/测试/规划。A仍归档011，累计归档11，C未激活。未执行根Archive、正式Full Test/Close、真实迁移、稳定切换、DreMo操作或Git写入。

下一步 `archive / author / awaiting-instruction`，固定Author014与本次Review015。当前会话保持Reviewer，完成后停下。
