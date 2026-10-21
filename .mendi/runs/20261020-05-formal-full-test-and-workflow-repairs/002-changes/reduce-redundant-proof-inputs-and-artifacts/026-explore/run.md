---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: reduce-redundant-proof-inputs-and-artifacts
planningSlot: MVP-D05-C
batchId: 002-changes
actionId: reduce-redundant-proof-inputs-and-artifacts-explore-01
actionType: explore
role: author
actor: codex-author
run: "026"
status: completed
actionStatus: completed
outcome: complete
result: proof-supported
nextAction: review-explore
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/explore/SKILL.md
upstreamSkillRef: .agents/skills/openspec-explore/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/025-archive/run.md
---

# D05-C Author Explore：proof / inputs / artifacts 轻量化

Owner 原始消息：owner 授权 激活 D05-C：proof / inputs / artifacts 轻量化，进入 Proof Explore。

本 Change 仅处理现行 D05-C Scope 的已确认实际证据冗余与零日志边界。固定 OpenSpec 1.14.1 原生 new change 仅建立 .openspec.yaml；不在 Explore 提前创建 proposal/specs/design/tasks，也不实现新代码。根项目为 manual-bootstrap，阶段沿既有人工 Run 规则保存，不假称产品 CLI 对根仓库成功写入。

## Proof 依据、实测与设计边界

**P01 历史盘点（只读）。** [proof.ts](artifacts/proof.ts) / [proof-results.json](artifacts/proof-results.json) 统计五个 Delivery 的历史 .mendi/runs，**测量时**为 5,623 文件、353 零字节、66,537,110 字节。路线图此前 5,410 是 2026-10-20 快照，不是本次实时数量。D04-B 014-apply 为 1,015 文件、77 零字节；同名、0B 不等于可删除。

**P02 groups-v1 报告与异常。** [history-proof.ts](artifacts/history-proof.ts) / [historical-group-proof.json](artifacts/historical-group-proof.json) 只读审计 D04-B 014-apply：114 group-request、107 group-report、111 group-events；7 个无报告的 request 实际对应 not-run 3、interrupted 2、unknown 2。107 份报告中 103 cleanup confirmed、4 unknown。缺失 report 与异常/未执行对应，绝不能据此省略必要报告或猜为 PASS；没有修改任何旧文件。

**P03 真实空 stdout 缺失后果。** 使用受控 product-v2 testTarget 与真实 pnpm，将 focused 设为无业务输出的 Node 命令，结果 passed，stdout.log 0 字节、stderr.log 13 字节；实际 status=passed。在自己的隔离目标中临时移走这个**空** stdout，实际 testStatus 返回 unknown/ENOENT；恢复原文件后重新 passed。另一次真实 fast 执行 failed，stdout 62 字节、stderr 92 字节、身份和读回保留。成功时只对自己 nonce-marker/realpath/无锁的精确夹具目录安全清理，绝不遍历删除其它共享临时目录。此 Proof 不是 D05 根正式 Full Test。

**P04 现有代码与日志完整性。** src/application/test-execution.ts 在 prepared 阶段主动预建双日志，src/adapters/test-process.ts 用实际 fd 写入并保留取消/unknown，src/adapters/test-store.ts 的 readExecution/observeExecution **都直接要求双日志存在**；src/adapters/group-store.ts 对正式 groups-v1 又实际核子结果、request/report、stdout/stderr、cleanup。现有 tests/test-log-integrity.test.ts 的真实短写、零进展、抛错场景执行 **3/3 passed（exit 0）**；零进展/抛错保留 unknown/锁。见 [existing-log-integrity.tap.log](artifacts/existing-log-integrity.tap.log)、[existing-log-integrity-result.json](artifacts/existing-log-integrity-result.json)。本 Run 两份可复现 TS Proof 严格 tsc --noEmit 均 exit0，见 [proof-typecheck.json](artifacts/proof-typecheck.json)。

## Propose 必须固定的取舍

- **优先避免重复复制：** Explore/Apply proof 的可重建输入留于受控 scripts/、tests/fixtures/；Run 保留真实命令、结果、必要原始日志和一处唯一原件引用。不在新 Run 重复粘贴整棵临时工程、旧 Run 树、相同成功 stdout 或多份截图。D05-B 已解决历史追加 intent 递归复制，不在 C 再造并行 hash 或证据数据库。
- **空日志省略不是简单删除文件：** 旧 TestExecution 的 stdoutRef/stderrRef 和两个读回路径要求真实文件存在，删除造成 unknown。若首版提出显式 empty 状态，应同时改变生产端、解析、test status、groups-v1 子结果/父验收和中断恢复，区分真正完成并确认零输出与 prepared/running/unknown/意外缺失或篡改；旧历史不自动补造 empty。若收益不及兼容复杂度，可以本轮先保留空日志，仅解决第一项重复证据。
- **正式协议不缩减：** group-request、result、必需 group-report/真实 stdout、stderr、清理确认与 Reviewer 的直接定位能力继续保留；失败、blocked、not-run、interrupted、unknown 记录和锁/半提交现场不得以“减少文件”为由抹去。旧 D01–D04 submitted 原样只读，永不批量清理，不设置文件数/字节数硬验收门槛。
- **后续必须有真实负例：** 如果改变 empty 协议，独立测试新旧格式、真空/非空/丢失/截断/写入失败、prepared/running/取消/unknown、report 缺失/cleanup 未确认、正式完整组覆盖、路径越界与旧文件状态读取；减量量化仅为影响分析，不替代正确性验收。

## 交接

Owner 已在路线图 §7 D05-C 确定可复现输入优先、历史保留、异常保留和无体积硬 gate；当前没有阻断性新 Owner 产品问题。Author 026 Proof Explore 已完成，下一步交独立 review-explore。未写 Proposal、specs、design、tasks；未修改产品源码、任何旧 Run/verdict、D05-A/B Archive 014/015、DreMo、Git 或稳定安装；不提前 Apply、正式 Full Test、Close、D05-D 激活。
