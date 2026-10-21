---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-apply-01
actionType: apply
role: author
actor: codex-author
run: "019"
status: completed
actionStatus: completed
outcome: complete
result: implemented-for-independent-review
nextAction: review-apply
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/apply/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/018-review-propose/run.md
---

# D05-B Author Apply

**现行 15 项任务实施完成，交独立 Review Apply。** 本会话保持 Author，没有 Reviewer verdict。依据 Owner 已激活的 D05-B、当前 `role: author` / `apply` 与固定 [018 approved](../018-review-propose/run.md) 的 017 现行方案；016 旧失败与所有已交接 Run 保持原样。

## 实施结果

- 新增 `delivery change add --project <root> --input <项目内 JSON> --role author --actor <id>`；输入固定 requestId、ownerDecision、reason、additions。角色、非空项、额外操作字段、路径、完整依赖 DAG、所有轮槽位去重及真实 baseline Close 在写前与锁内检查。actor/来源文字只记录责任，Host 必须持实际 Owner 范围授权；命令不认证真人，也不 bind/激活 Change。
- `src/core/scope-addition.ts` 定义 typed 收据、纯后缀追加和原指针；`rounds.ts` 保存有序 scopeAdditions / scopeAddRunRef，与顶层同步投影。`adapters/scope-additions.ts` 仅读取这些明确里程碑的实际 submitted Author 收据和原意图，不读取旧说明链或旧正式日志。没有追加字段的旧轮保持兼容。
- `recordRound` 按所属轮已提交的前后快照解释原 Open、正式 passed/failed、Repair/Review；completed 依据该 Run 保存时范围逐项核归档绑定。当前 `currentDeliveryRun` 额外严格比对最新完整 scope，旧失败的 `currentGroupProgress` 也核当前范围；不能把旧 PASS 指针写回后冒充当前 Close 资格。
- `src/adapters/change-add-store.ts` 负责共享编号、独立 draft/terminal 收据、原项目/manifest/直接输入意图、pending 入口、manifest 投影和入口收口；确认直接字节与读回才成功。普通完成不改变项目索引字节、批次、绑定、归档数、旧轮和已有 Run。新收据不担任 deliveryRunRef；旧正式 typed 指针保留历史定位。当前正规准入复用既有全量 groups-v1 与 typed Close。
- 同轮成功 requestId 的原 Author/输入路径/实际字节相同即返回原收据；不同输入拒绝。显式 `--resume <同次 Run>` 只补原 actor、原输入及确定前后状态中的缺失提交，不重新占号；已完成返回 alreadyCompleted。锁/unknown/临时文件保留，先由 Owner 核对停止写者并处置锁，不提供自动解锁。
- 追加允许普通 open、合法活动 Change、稳定且清理确认的正式 passed/failed；未决 Repair/Review、未完成执行、unknown、pending、closed、manual/legacy 写入拒绝。活动 Change latestRunRef、角色与阶段保留；无活动项且有追加后未绑定计划时 next=change-bind，不能落到旧 Archive / Close。
- 状态查询已从原 `src/application/project.ts` 移入 `project-query.ts`，原模块保留 Open/Bind 和共享状态投影，旧导入通过 re-export 兼容，没有新增转发函数层。测试分为收据/历史与活动阶段、恢复、完整生命周期三个场景文件。
- CLI help、专属 `skills/actions/delivery-change-add/SKILL.md`、README、OpenSpec context 与唯一根路线图同步。新方法用真实 `loadMethods('delivery-change-add', [])` 读回成功；候选未安装或发布。

## 场景与证据

013 P04/P05/P07 与 014 R03 的实际失配是本次回归来源：旧正式 passed/failed、原 Open 在 scope 扩大后仍须按原范围读取，而当前验收失效并提示 bind。本次用受控 TypeScript 夹具重新执行真实 writer、原生归档及目标 Node 组测试；没有把 Explore 的模拟 append 当作实现通过。

- 实际贯通 Open / Archive A/B → passed → append C/D → 分别显式 bind/原生 Archive → 新全部必需组 passed → 独立调用 typed Close → Reopen；旧 Run 字节不变。新增范围分别在未归档、已归档未重新测试时均拒绝旧 PASS Close；追加收据也不能 Close。另验证历史轮不能复用槽位、有效旧轮 Close 基线和跨进程状态。
- 实际 failed → append 可读旧失败；存在 Author Repair、draft Review、approved 但尚未重新完整测试的 Review 都阻断追加；重新实际全量 passed 后可追加，原 Repair/Review 可按原范围读取。旧 command 只读兼容，未创建新的旧 command 产品入口。
- 七个断点：intent、pending、terminal、manifest 提交前、manifest 后、index 后、锁释放。均由独立子进程故障退出，确认退出后才由夹具显式处置其自有锁；原 actor 恢复原号，query pending 不伪完成。另有真实第二进程持锁竞争、输入漂移、冲突请求和陈旧恢复拒绝。
- 目标 runner 实际报告 cleanup unknown 时，正式入口保留 draft / 运行现场与锁，outcome=unknown；追加拒绝且 `.mendi` 字节不变。未把此执行追认为 finished 或 PASS。

[execution-observations.json](artifacts/execution-observations.json) 保存四个选定场景的直接 Run、真实子结果、最终报告、stdout/stderr 及必要追加收据/意图；原始输出只在该有界文件保存。其他场景 JSON 是操作结果与状态快照，不复制整个历史树。所有必要输入在受控 tests / fixtures，临时目标可由它们重建；失败/unknown 现场没有清理。

## 检查、修复与限制

| 实际命令 / 结果 | 证据与说明 |
| --- | --- |
| `pnpm check` exit 0 | [check-final.log](artifacts/check-final.log)：format、基础 lint、src/scripts/tests 三套真正 TypeScript 检查 |
| `pnpm build` exit 0 | [build-final.log](artifacts/build-final.log) |
| 9 个受影响测试文件，33 场景初跑 31 passed / 2 failed | [affected-tests.log](artifacts/affected-tests.log)；两项是新增测试夹具断言错误，保留原失败 |
| `node --test --test-name-pattern='unknown\|真实 failed' tests/change-add-lifecycle.test.ts` exit 0，2/2 | [unknown-repair-retest.log](artifacts/unknown-repair-retest.log)；unknown 应检查保留 draft/锁的停止结果，不能调用仅适用于完整终态的 attemptResult |
| `node --test --test-concurrency=2 tests/change-add-recovery.test.ts tests/rounds.test.ts` exit 0，8/8 | [recovery-rounds-final.log](artifacts/recovery-rounds-final.log)；修正内存夹具共享对象导致的假负例，并核对已完成 resume 标识 |
| `node --test --test-concurrency=2 tests/change-add-lifecycle.test.ts tests/delivery-query.test.ts tests/group-history.test.ts tests/migration-rounds.test.ts` exit 0，14/14 | [current-scope-final.log](artifacts/current-scope-final.log)；补当前指针必须匹配最新 scope 后复验真实 Close、旧 command/v1 attempt/verification、failed/Repair/Review、query、迁移与旧轮来源 |
| OpenSpec `validate append-planned-changes-to-open-delivery --strict` exit 0 | 实际返回 Change is valid；工具检查不代替独立 Reviewer |
| `git diff --check` exit 0 | 只读检查，没有 Git 状态变更 |

另外保留 [第一轮](artifacts/change-add-first.log) 4/8 与 [第二轮](artifacts/change-add-second.log) 8/10 的原失败：前者中断测试误用要求 PID 已退出的锁处置助手、漏写组修复影响输入、误把 closed 后同请求重放当新追加；后者记录式 Open 错用绝对输入路径、把缺报告的 invalid 当 unknown。已逐项修正夹具并按影响复验。未知清理采用 runner 的真实 unknown 控制，并保留真实停止语义。33 个唯一场景的两项失败均有后续通过记录；没有宣称重新执行了一个 33/33 的单次完整套件。

验证仅限本次变化及上述受影响部分。夹具 actor/reviewer/verdict 只构造前置记录，不认证当前仓库独立审核。未重新运行无关 UI/安装/旧全量 proof，未将工程测试当作 D05 Delivery 正式 Full Test。MenDi 根仍为 manual-bootstrap，只人工记录本阶段；没有产品迁移根历史，也没有修改 DreMo、Archive、本轮 Full Test/Close、Git checkpoint/Push 或稳定安装。

## 维护代码物理行数与职责

按当前 `.ts` 文件（含空行）与真实 HEAD 对照，完整结果见 [line-counts.json](artifacts/line-counts.json)。新文件无同名历史基准，不虚构增长率，不建立行数门槛。

| 目录 | 当前前三名 | 增长依据、职责及处理时机 |
| --- | --- | --- |
| src | `src/application/delivery-lifecycle.ts` 368；`src/application/group-attempt.ts` 361；`src/adapters/workspace.ts` 346 | 前二与 HEAD 同行数，本次未扩展。workspace 从 344 到 346，只加入有界收据验证 hook，追加事务在独立 store。原 project.ts 混合查询与写入，本次先拆查询后扩展：374→233，project-query.ts 158；新增 application 220 / store 268 / core receipt 137，分别负责准入、提交恢复、纯合同，没有纯转发层压行数。 |
| tests | `tests/action-write.test.ts` 467；`tests/planning-cli.test.ts` 444；`tests/delivery-repair.test.ts` 395 | 三者与 HEAD 相同；本次新增测试按收据/恢复/完整生命周期分组（239 / 107 / 232 行），没有继续混合增长旧大文件。 |
| scripts | `scripts/proofs/mvp-d01-c-explore.ts` 678；`scripts/proofs/mvp-d01-d-explore.ts` 487；`scripts/proofs/mvp-d01-a-explore.ts` 463 | 三者与 HEAD 相同，均保留历史 Explore 限定用途，本次未扩展。产品场景放 tests；未来确需扩展这些旧 proof 时先分开 Apply 记录流与 Archive 效果组，保留简单 TS 入口和原输出。 |

## 当前交接

`review-apply / reviewer / awaiting-instruction`，固定 Author 为本 019。Reviewer 按实际影响独立判断；本次工具成功与任务勾选不产生审核批准。Archive、D05 正式 Full Test、Close、Git 和安装发布仍各守独立授权。
