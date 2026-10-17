---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: reopen-incremental-scope-and-compatibility
planningSlot: MVP-D04-A
batchId: 002-changes
actionId: reopen-incremental-scope-and-compatibility-apply-01
actionType: apply
role: author
actor: codex-author
run: "006"
status: completed
actionStatus: completed
outcome: complete
result: implementation-ready-for-review
nextAction: review-apply
nextRole: reviewer
completedOn: 2026-10-17
stageSkillRef: skills/actions/apply/SKILL.md
upstreamSkillRef: .agents/skills/openspec-apply-change/SKILL.md
recordingMode: manual-bootstrap
date: 2026-10-16
reviewProposeRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/005-review-propose/run.md
---
# MVP-D04-A Author Apply

Owner 指令 apply；固定 004 方案与 005 独立批准，保持 Author。按 27 项任务实施，完成后停独立 Review Apply。Git、实际目标迁移、稳定安装、DreMo 和根正式 Full Test / Close 不在本次执行范围。

当前使用 manual-bootstrap 人工记录，不伪报产品写入命令成功。实际 instructions 见 artifacts/apply-instructions-start.json；直接维护代码基准见 artifacts/maintained-lines-before.json，排除 fixtures、node_modules、生成物。首次计数误遍历夹具依赖，已停止本次进程并核对原 token 释放自有锁；未删除其他操作现场。

27/27 项已完成；实际 Apply instructions 逐项复核并达到 all_done（artifacts/apply-instructions-final.json）。结果为 implementation-ready-for-review，保持 Author，停在独立 Review Apply，无 verdict。

## 实际变更

- `core/scope`、`rounds`、`round-records` 分别维护范围规范化、唯一轮次 / 槽位 / 批次归属、当前投影及正式记录归属。项目入口与 manifest 的 v1 / v2 分开解释，manual-bootstrap 保留。新 Open 创建 r001，Reopen 只追加新轮，顶层旧 PASS / Close 留在旧轮；历史 `status --round` 不提供历史执行 next，也不改变选择。
- bind、Action / Run、Archive、普通 test、正式 Full Test / repair 及生命周期的实际写路径均接 v2 gate，并在锁内复核。旧 product 查询 / instructions / 结果读取保留；旧 pending、未确认原生效果和旧 resume / finish 须先兼容旧版恢复，无新版例外。
- `adapters/baselines` 只核对同项目已登记 product 的 manifest、archived binding 与指定 Close，支持同 Delivery 旧轮和跨 Delivery 的 v1 / v2 来源。不进入来源当前 Change、旧审核正文或日志，不强制迁移来源；manual 仅作说明。消费时核对直接输入变化，新正式结果保存 roundId / baselineFacts，Close 消费本轮保存事实。
- 旧范围转换、迁移计划 / intent 解释、本地预览及存储提交分别维护；复用受管路径、锁、占号、pending 和替换原语。预览不写文件或调用 OpenSpec；apply 重算候选并锁内复核直接输入，不信任手改计划。收据不替代原业务进展，原 Action / actor / draft / 固定 Author 保留，其他 Delivery 不改。
- 新迁移自身中断只按原 intent、原 actor 和同次 receipt 显式 resume；不清锁、不改终态、不重占号。最新已知产品操作半提交须恢复；被后续真实交接跨过的历史空号和未知说明目录不成为额外迁移前置。旧格式操作恢复与新迁移提交恢复分别报告。
- README、随包阶段方法及新增 delivery-migrate 方法说明以上操作边界；新场景按记录 / CLI / 生命周期 / 基线 / 迁移预览、提交、活动记录与故障组进入 tests，未扩展旧 C / D Explore proof。主规格等待后续独立审核与实际 Archive，不在 Apply 同步。

## 验证与修正记录

命令以固定 Node / pnpm / OpenSpec 稳定入口执行。普通工程检查不写产品 status / next。受控目标中的阶段批准是隔离记录夹具，明确标注用途，不构成本仓库的独立审核。

- 最终工程检查 `pnpm check` 已通过，见 [check-final-02.log](artifacts/check-final-02.log)：format、lint、src / scripts / tests 真正 TypeScript 检查全部通过。
- 根 `pnpm test` 首轮 248 项中 246 通过、2 失败，见 [test-final-01.log](artifacts/test-final-01.log)。失败为旧查询测试直接修改当前 plannedChanges 后仍预期沿用旧 PASS / 允许推进，与新轮次投影合同冲突；改为拒绝矛盾投影，合法增量通过真实 Close / Reopen 场景覆盖。定向修复 3 项通过，见 artifacts/repair-focused-01.log。首轮失败保持，不与定向 PASS 合并。修正后新整轮 250/250 通过，exit 0、无跳过，见 [test-final-02.log](artifacts/test-final-02.log)。本整轮包含新增边界场景，原始输出单独保存在 test-details-02，不沿用首轮失败作为最终结论。
- 受影响组 29 项通过（artifacts/affected-02.log）；实际同 Delivery 旧轮基线完整链 1 项通过（artifacts/same-delivery-baseline-01.log）；迁移保护最新 15 项通过（artifacts/migration-guards-03.log）。其他定向输出按当前 Run 内原文件引用，不复制原始输出树。
- 真实半提交补测先复现预览错误放行（migration-reservations-01.log），修正最新已知产品占号准入后 4 项通过（migration-reservations-02.log）。随后补测确认历史空号 / 未知说明不应被过度阻断、新迁移 intent 不应误指旧版恢复；对应初次失败与修正输出均保留（migration-historical-reservations-01 / 02.log、migration-intent-routing-01 / 02.log）。
- Archive none 初次夹具在 before-native-call 停止，缺原生退出见证，产品正确拒绝。改用 after-invoking 构造可确认 none，并保留原未知启动拒绝迁移 / 新版恢复负例；最新 3 项通过（migration-archive-03.log），实际诊断见 archive-none-diagnostic.json。另保留旧版本号 / 顶层旧指针断言和预设失败 / worker 退出码夹具修正的首次输出，不改旧 Run 或 verdict。
- 固定 OpenSpec `validate reopen-incremental-scope-and-compatibility --strict --json` 通过，valid=true / issues=[]，见 artifacts/validate-final.json。实际 CLI 迁移方法接线见 artifacts/method-wiring.json，直接引用最终整轮原输出；新方法随现有 skills 打包规则提供，未执行真实安装切换。未改变 UI 或独立安装准备接线，因此没有额外启动安装 / UI 集合。
- 原始跨进程 stdout / stderr、实际归档 / 生命周期场景在 artifacts/test-details-01 和 test-details-02 分别保留，后者为最终候选整轮；必要输入在受控 tests / fixtures，临时目标可重建。`.tmp` 不承载唯一必要证据。

## 维护代码与职责

物理行数按同范围直接前后快照核对，排除 fixtures、依赖、生成物与符号链接；见 artifacts/maintained-lines-before.json、maintained-lines-after.json，不作为行数 gate。

| 范围 | 前三名 | 本次增长与职责 |
| --- | --- | --- |
| src | application/project.ts 354；adapters/openspec.ts 346；adapters/lifecycle-store.ts 336 | project.ts 由 302 增至 354，增加当前 / 历轮状态与 queryRound、bind 基线接线；后两者未增长 |
| tests | action-write.test.ts 467；planning-cli.test.ts 444；delivery-repair.test.ts 394 | 三者均未增长；本轮行为按场景另入相应测试文件，未把旧全流程 proof 继续堆大 |
| scripts | proofs/mvp-d01-c-explore.ts 678；proofs/mvp-d01-d-explore.ts 487；proofs/mvp-d01-a-explore.ts 463 | 三者均未增长；保留旧限定用途，本轮未运行其整棵历史 proof |

扩展前已把原 delivery-full-test 的准入 / 直接复核从执行编排拆出，原文件 401 → 255 行，新 full-test-admission 承担实际准入职责；范围解析也从 records 分离。project.ts 保留项目应用入口，状态解释 / 查询与 Open / bind 为独立函数；轮次转换、来源核对与持久化分别在 core / adapters，不加纯转发层。当前没有按行数再拆模块；后续若继续扩大项目命令职责，再按实际耦合整理，不能据此预批 B / C。

## 边界与待交接

根仓库继续 manual-bootstrap；006 已按原人工方式完成 Author 交接，不伪报产品 submit 成功。分支和 HEAD 沿 checkpoint，包版本 0.1.0；稳定安装身份和保护文件的直接观察见 artifacts/environment-observation.json 和 environment-final.json。当前未修改根路线图、三份反馈原件、`.mendi/project.json` 或包 / 锁文件；未修改 DreMo 或切换稳定安装。

隔离目标真实执行了原生 Archive、正式测试和 Close / Reopen，以及受控迁移；未执行根 Change Archive、根正式 Delivery Full Test / Close、真实目标迁移、Git 写入 / push 或安装发布。根工程整轮 PASS 即使成立也不替代上述授权或独立 Review Apply。

本 006 为固定 Author 审核对象；next 为 review-apply / awaiting-review / reviewer，authorRunRef 指向本 Run。Author 不自签 verdict，不启动 Reviewer、不激活 B / C。工程回归通过不等于独立审核批准。

独立审核的直接输入为本 006、005 对 004 的批准、当前六份规划产物和本次实现 / 方法 / 场景差异。重点核对所有实际写入口的 v1 边界、迁移前态与中断恢复、保留活动 draft / 固定 Author、直接 product 基线的读取范围，以及正式结果的本轮适用性；按实际疑点复现必要场景，既有工程 PASS 不替代 Reviewer 判断。
