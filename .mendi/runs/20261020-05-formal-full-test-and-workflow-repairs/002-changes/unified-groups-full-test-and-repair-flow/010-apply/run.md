---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-apply-01
actionType: apply
role: author
actor: codex-author
run: "010"
status: completed
actionStatus: completed
outcome: complete
result: implemented-ready-for-independent-review
nextAction: review-apply
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/apply/SKILL.md
upstreamSkillRef: .agents/skills/openspec-apply-change/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/009-review-propose/run.md
---

# D05-A Author Apply

按 009 独立 Review Propose approved 的 008 修订方案实施 13 项 tasks。当前为 manual-bootstrap 人工开发记录，不通过产品写命令迁移根历史。停止边界为独立 Review Apply；正式 Full Test、Close、Archive、Git、稳定安装和 DreMo 不在本次操作内。

上游 Apply instructions 实际为 ready，0/13；已读取 proposal、design、四份 delta specs、tasks 和 context。context 中“未激活”是 Open 时背景，当前阶段以 manifest 与 009 交接为准。两项 operationGuidance 均适用：先 focused 检查、完成后独立审核。使用 incremental-implementation 分段验证；其 commit 建议受本次 Git 授权边界限制，不执行。

## 实施结果

- 新正式写入口只接受 groups-v1 / initial / 全部必需组，attempt.version=2；旧 command、continue/retest 和 verification create 在占号前拒绝。协议与真实子执行分层解释，完整必需业务计数、报告/退出、结束、清理和直接持久读回共同决定正式终态；没有真实 child 的元数据不能形成 passed。
- 本轮旧 command failed 经真实直接 Repair/Review approved 后可首次进入新全量，无需补造旧 attempt。新 v2 failed 同样须实质修复及当前独立定向批准，再重新全部必需组；陈旧、空正文、自签、changes-requested/rejected 和局部 selection 均拒绝。后续重跑沿用已核对的本轮归档批准快照，仅核对当前绑定与必要修复审核，不重新读更早 Archive/Review/Apply 正文。
- 纯环境恢复保存直接失败、原准备阶段/组/资源身份、恢复/清理/再预检及材料一致性；materialRefs 只固定显式必要直接输入及 package.json，不做全库 hash 清单，也不认证未声明源码的语义。无法证明材料/执行语义未变时走 Repair/Review；安全 known blocked/not-run 的实质准备修复也可走该路径，不被卡在只能 environmental retry 的死路。unknown、外部资源、锁、清理不明、原报告无准备失败或夹带业务失败不允许环境旁路。
- 新 Close 唯一选择 testAttemptRunRef，等于当前轮 manifest.testAttemptRunRef 和最新 deliveryRunRef；实际对象须稳定完整 v2 passed，保存 typed acceptance。rounds、生命周期提交/恢复、workspace、基线读回同步支持 typed-only closed；不挪用 fullTestRunRef，旧指针可继续留存。新旧选择器混用、旧 command passed/v1 verified、陈旧结果、缺日志或未知均拒绝。已完成旧 Close 与旧正式记录保持只读，新写入口及旧未完成 Close 恢复不通过兼容分支绕行。
- 方法、组协议、Close 方法、CLI help、README 与安装验收的源码场景同步。安装测试仅更新并严格类型检查，本次没有准备/安装新包或认证已安装稳定包具备 D05 能力。

## 实现组织与历史边界

记录解析仍在 core/delivery-runs / group-records；delivery-next 独立承接真实交接决策，formal-attempt 负责本次正式聚合，group-environment 负责窄环境恢复。原 command/verification 新写路径从产品应用层移除，旧解析留给历史读取；不新增纯转发压行数层。src 不导入 tests/fixtures/legacy-*。

受影响的旧 command / Close / 迁移测试改由 tests/fixtures/legacy-command.ts、legacy-admission.ts、legacy-lifecycle.ts 构造旧格式隔离记录，使用真实普通 Node 执行和现行只读解析；这些是固定旧合同的历史夹具，不代表产品仍允许旧正式写入。旧六阶段/生命周期的有效检查继续沿用，仅修正旧写入口假设。两份旧 Explore 脚本只调整导入指向历史夹具以保持真实 TypeScript 检查；未扩展或重跑旧完整 proof，未改旧 Run/编号/verdict。

当前新增产品端到端断言在 group-* 场景测试，覆盖单次正式通过、双失败/依赖阻断、零业务/skip/TODO/取消、协议矛盾/unknown、P01～P04、修复及环境恢复、typed Close/中断恢复/Reopen/基线。夹具中的 reviewer actor/verdict 只测试产品记录准入，不构成 MenDi 根 Change 的独立审核。

## 验证、失败与复验

工程回归只在隔离可重建 product 目标执行，未触碰根 manual 历史、DreMo 或稳定安装。统一业务 PASS 来自本次 tests 实际执行，不使用旧 Explore proof 代替。

- `pnpm check`：格式、基础 lint、src/scripts/tests 真实 TypeScript 通过；`pnpm build` 通过。最终完整检查与构建日志见 artifacts/final-validation.log；exit 0，git diff --check 同样通过。
- 扩大到 group/delivery/lifecycle/migration/baseline/rounds 共 29 个受影响测试文件，因为共享的历史夹具导入、typed acceptance、轮次和基线解释都有直接影响。实际选择命令为 `Get-ChildItem tests -Filter '*.test.ts' | Where-Object {$_.Name -match '^(group-|delivery-|lifecycle-|migration-|baseline-|rounds\.|methods\.|action-upstream)'}`，随后 `node --test --test-concurrency=2 <该文件集合>`；原始输出保留在 artifacts/engineering-tests.log。实际初轮 102 项，99 passed / 3 failed，exit 1，耗时 1327685ms；三个失败分别由下述定向复验闭环，不把初轮改写成整次全绿。其余有效通过结论沿用，没有再跑整套旧流程。
- 扩展回归初轮保留三项失败：旧 baseline Close 和旧跨进程 command 场景还调用已禁止的新写入口；改为明确历史夹具后，baseline-recheck.log 与 legacy-repair-recheck.log 各 1/1 通过，没有放宽产品拒绝规则。group-reuse-target 迟注册 exit 监听导致错过 worker 退出、顶层 await 未结束；修正为创建 worker 时立即登记退出，仍等待真实业务结果、实际退出码及隔离产物。原 stderr 为 reuse-failure.stderr.log，reuse-recheck.log 1/1 通过。
- 收尾针对当前准入/快照与 typed CLI 的 final-group-recheck.log 8/8 通过；针对准备 failed/blocked 与实质 blocked/not-run 修复的 preparation-repair-recheck.log 6/6 通过；方法真实读取与编号规则 methods-recheck.log 4/4 通过。早期开发检查曾暴露旧 proof 的 verification 类型依赖、测试变量先使用后声明及 invalid/取消优先级问题，均在本 Run 修正；后续检查不覆盖旧失败。
- P01、P02、P03/P04 的最小指定场景快照在 artifacts/P01-collection-*.json、P02-{blocked,failed}-*.json、P03-P04-legacy-repair-full-*.json，包含真实父/子、完整回执和必要输出，每次实际执行各保存一份。原失败对象和必要日志仍可核对，不复制整个历史证据树。

## 维护代码物理行数与职责

以实际 .ts 文件计物理行，排除 node_modules/dist/runtime/.tmp；无硬门槛，不另建台账。

| 目录 | 当前最多的三个维护文件 | 物理行数 |
| --- | --- | --- |
| src | src/application/project.ts；src/application/delivery-lifecycle.ts；src/application/group-attempt.ts | 374；368；361 |
| tests | tests/action-write.test.ts；tests/planning-cli.test.ts；tests/delivery-repair.test.ts | 467；444；395 |
| scripts | scripts/proofs/mvp-d01-c-explore.ts；scripts/proofs/mvp-d01-d-explore.ts；scripts/proofs/mvp-d01-a-explore.ts | 678；487；463 |

本次开始时 src/tests/scripts 无既存未提交修改，Git HEAD 可作为本次源码增长的可靠基准（不是受测提交声明或 Git 写入授权）。delivery-runs 从 372 到 257 行，新增 delivery-next 153 行承接交接职责；delivery-lifecycle 371→368、candidate-verification 260→41、delivery-full-test 286→103，移除新的旧写路径。group-records 244→312 是 v2 与恢复快照的真实解析增长，职责仍为核心类型/持久格式。group-admission 的增长来自当前失败/审核及窄恢复准入，已移走环境事实解释，取消旧 continue/retest 组织；group-support 108→143 用于少量指定场景留痕。历史夹具新增 192/243/385 行是固定旧 command/Close 形成器，与产品新写入隔离，没有包装成额外产品层。最大 project.ts 本次仅调整 next 导入，group-attempt 比旧实现缩减；最长三个 scripts 未扩展。后续若扩展这些文件，应继续按真实职责拆分，不能用转发层或行数 gate 代替设计。

## 当前收尾状态

最终 OpenSpec Apply instructions 为 all_done / 13 complete / 0 remaining；固定 1.14.1 strict validate 为 valid true、issues=[]，原始结果见 artifacts/openspec-final-validation.json。实际 CLI next 已读回 review-apply / reviewer / awaiting-review，authorRunRef 固定本 Run。

实现与 009 批准的 008 方案一致，13/13 tasks 完成。工程初轮三项失败均保留且已按影响定向复验通过；最终 check/build 通过。Author 不给 verdict，不自签 Review。当前交接为 review-apply / reviewer / awaiting-review，固定本 010 Author Run；审核须独立核对本次源码候选与实际证据。正式 Full Test、Close、Archive、Git checkpoint/push、部署/发布与稳定安装仍各自独立授权；本次未执行。
