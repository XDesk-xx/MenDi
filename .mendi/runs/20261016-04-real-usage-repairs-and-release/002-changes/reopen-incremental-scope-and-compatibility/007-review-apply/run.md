---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: reopen-incremental-scope-and-compatibility
planningSlot: MVP-D04-A
batchId: 002-changes
actionId: reopen-incremental-scope-and-compatibility-review-apply-01
actionType: review-apply
role: reviewer
actor: codex-independent-reviewer
run: "007"
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
authorRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/006-apply/run.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/006-apply/run.md
---

# MVP-D04-A 独立 Review Apply

结论：**approved，无阻断发现**。Owner 本会话明确 Reviewer，当前指令为 `review-apply`。固定审核 [006 Author Apply](../006-apply/run.md)，对照 005 已批准方案、六份当前规划产物、实现 / 方法 / 场景差异及直接证据。未修改实现后自行批准。

## 方法与重点判断

采用稳定安装 MenDi review-apply 方法及 OCR delegate。OCR 仅选文件、解析规则，语义判断由本 Reviewer 完成。preview 前排除历史 .mendi artifacts、生成物、依赖与前阶段未扩展 Explore proof。321 个候选中 43 个选入，全部审核、跳过 0；278 个被规则排除，另补读实际必要测试、Markdown 与 JSON 示例。完整选入与补读清单见 [coverage](artifacts/review-coverage.json)，原 preview / rules 各保存一份。文件处理率不是正确性结论。

详见 [语义核对](artifacts/semantic-review.md)。核心结论：

- rounds 权威与当前投影统一解释，跨轮槽位 / binding / batch 归属受控；历史摘要不切换选择，当前轮不继承旧 PASS / Close。
- 旧 product 的普通写入及旧 resume / Archive finish 均受写前、锁内检查；v2 项目可保留登记 v1 来源，manual 不转换。
- 迁移 preview / 纯转换 / intent / 提交分离，充分旧范围允许 legacy-baseline。完整活动 draft 保留原 actor、Action、固定 Author 和字节；未知效果、pending、未完成执行与当前产品半提交停止。
- apply 重算及锁内复核直接输入；原 actor 同次 resume 只补既有前后态，重复与陈旧恢复分开，迁移收据不成为当前业务交接。
- baselineDependencies 直接核对同项目登记 product 的 archived binding 与 Close 快照，支持来源后来 Reopen / v1；不递归其旧审核、日志或活动 Change。Full Test 固定本轮 roundId / baselineFacts，Close 消费实际保存快照，同轮修复规则保持。

## 独立验证与证据

本次所有行为测试在可重建隔离夹具运行，未操作真实目标迁移。

| 命令 / 检查 | 实际结果与证据 |
| --- | --- |
| `pnpm check` | exit 0，格式、lint、src / scripts / tests 真正类型检查通过；[check.log](artifacts/check.log) |
| `pnpm build` | exit 0；[build.log](artifacts/build.log) |
| `node --test --test-concurrency=2 tests/migration*.test.ts tests/legacy-write-gate.test.ts tests/baseline*.test.ts tests/round*.test.ts` | 37/37，通过，无失败 / 取消 / 跳过；[targeted-tests.log](artifacts/targeted-tests.log) |
| `node --test --test-concurrency=2 tests/lifecycle-reopen.test.ts tests/records.test.ts tests/workspace.test.ts` | 12/12，通过，无失败 / 取消 / 跳过；[round-regression.log](artifacts/round-regression.log) |
| 固定 OpenSpec 1.14.1 `validate reopen-incremental-scope-and-compatibility --strict --json` | exit 0，严格校验通过；[validation.json](artifacts/validation.json) |
| 同版 `instructions apply --change reopen-incremental-scope-and-compatibility --json` | 27/27 完成，剩余 0；[apply-instructions.json](artifacts/apply-instructions.json)，仅辅助核对 |
| 当前候选 `status --project D:/Projects/MenDi --json` | manual-bootstrap、固定 Author006、review-apply / reviewer；[status-before.json](artifacts/status-before.json) |
| `git diff --check` | exit 0 |

37 项包含真实 CLI 旧格式各类写请求拒绝、历史查询、跨 Delivery 基线消费、原 draft 继续、多轮迁移、原生 Archive prepared / none、缺来源 / 陈旧输入 / 错 actor 负例及七个迁移提交边界。12 项补核同 Delivery Close → Reopen → Archive → 新正式集合 → Close、跨轮拒绝及基础记录 / 锁行为。受测 HEAD 为 982159b42d7b6ce88dea0ebf178e13d75514adae 加 006 当前工作树候选。

沿用并直接核对 006 的根 `pnpm test` 最终原输出 test-final-02.log：250/250、0 skip；保留其首轮 246 pass / 2 fail、局部修正和最终整轮记录，不拼接成新 PASS。本 Reviewer 独立重跑以上 49 项及工程检查，没有重跑整个 250 项集合，也未将根工程回归写成 Delivery 正式 Full Test。没有 UI / 安装接线变化，本次不扩大到这些集合。

## 维护代码与职责

独立物理行数统计见 [maintained-lines.json](artifacts/maintained-lines.json)，排除 fixtures、依赖、生成物；与 006 的 before / after 直接基准核对。

| 范围 | 前三名 |
| --- | --- |
| src | application/project.ts 354；adapters/openspec.ts 346；adapters/lifecycle-store.ts 336 |
| tests | action-write.test.ts 467；planning-cli.test.ts 444；delivery-repair.test.ts 394 |
| scripts | proofs/mvp-d01-c-explore.ts 678；proofs/mvp-d01-d-explore.ts 487；proofs/mvp-d01-a-explore.ts 463 |

project.ts 302→354，增加当前 / 历史状态及 bind 基线接线；转换、模型、持久化保持独立。delivery-full-test.ts 401→255，准入与直接输入复核拆到 full-test-admission.ts 181 行，属于职责拆分。其余上述前列文件未增长。未发现本次继续扩展的混杂职责需要先行重构；后续扩大项目入口职责时再按实际耦合整理。旧 C / D 大型 proof 未扩展，保留原限定用途，未来若扩展先按 AGENTS 分开 Apply 记录与 Archive 效果组；不按行数改写历史或新增 gate。

## 交接与边界

按既有 manual-bootstrap 方式新增本 Run / artifacts，更新当前 manifest、README 与 context；不伪报产品 submit 成功。006 与此前 Run / verdict、源码、测试和规划产物保持。B / C 未激活，累计成功归档仍为 10。

下一步为 `archive / author / awaiting-instruction`，由对应角色会话承接。本 Reviewer 不切换 Author，未执行根 Change Archive、根正式 Full Test / Close、真实目标迁移、DreMo 修改、稳定安装切换或 Git 写操作。
