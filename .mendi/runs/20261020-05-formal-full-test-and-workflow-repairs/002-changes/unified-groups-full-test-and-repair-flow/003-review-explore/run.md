---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-review-explore-01
actionType: review-explore
role: reviewer
actor: codex-independent-reviewer
run: "003"
status: completed
actionStatus: completed
outcome: complete
verdict: changes-requested
result: explore-proof-artifact-corrections-required
nextAction: revise-explore
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/review-explore/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/002-explore/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/002-explore/run.md
---

# MVP-D05-A 独立 Review Explore

本次 Reviewer 固定审查 [002 Author Explore](../002-explore/run.md)及其 `artifacts/proof.ts` / `proof-results.json`，不修改 Author 正文或已交接证据。本轮 verdict：**changes-requested**，原因是 proof 的资源清理越权风险与 TypeScript 验证未满足仓库约定，而非否定 D05-A 产品方向。修订后可沿用仍成立的现状结论，勿重复实施无关工作。

## 已成立的调查结论

- P01：隔离真实 groups-v1 得到 prefix passed、middle failed、tail failed；普通独立失败后的继续收集已具基础。
- P02：本次夹具自身占有的 TCP 端口产生 middle blocked，释放并确认后新一次 initial 全部通过；只证明该已确认的 blocked 场景，不证明任意 failed 都可归类为环境问题。
- P03：旧 command failed 经夹具 Repair/Review approved 后，首次进入 groups-v1 抛出 `invalid-data: 当前 attempt 必须是非空字符串。`；`src/application/group-admission.ts:56-63` 无条件要求旧模式不存在的 `testAttemptRunRef`，旧失败 Run 保持原字节。夹具中 actor/approved 非真实独立审核授权。
- P04：既有局部 retest 只运行 middle，`candidate-verification` 从原初与局部两次 Run 合成 verified；与 D05-A 已确认的“修复后新一轮必需组全量执行，正式 Run 直接 passed、不额外 verification create”政策冲突。既有旧记录保留只读，不追改已交付 D04。
- Owner 对完整正式执行直接 `passed` 且 Close 仍另获授权的决定，002 与根路线图 §7 D05-A 已有明确文本，无需 Reviewer 再替 Owner 决定。未实现的 Close 消费、CLI、status/next 和安全负例属于 Propose/Apply 合同及验收，不应把本次 Explore 直接说成产品已经支持。

## 阻断 Finding

**F1 · 高 · proof 临时目录清理范围不受自身创建列表约束。** [proof.ts](../002-explore/artifacts/proof.ts) 的第 17、27 行已保存 `roots`，但第 141–151 行并未使用该集合进行清理，而是遍历所有从启动时起新出现的 `.tmp/mendi-apply-*` 目录；只排除当前检测到 `write.lock` 的目录。因此，另一并行任务新建且当前无锁的目录可能被本脚本递归删除。当前证据不能证明实际上发生过误删；但此行为不满足项目 AGENTS 的“仅操作明确本次目标”及资源归属原则，002 第 36 行的“按本次创建范围清理”表述也不能由实现证明。**不要再直接重跑这份脚本。** Author 修订时限定到自己返回并核实归属的具体绝对路径、谨慎处理未知/锁状态，不扫描清理其他会话的增量目录。

**F2 · 中 · Explore proof 未通过真正的严格 TypeScript 类型检查。** 本次 Reviewer 对 `002-explore/artifacts/proof.ts` 执行 `node node_modules/typescript/bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --allowImportingTsExtensions <proof.ts>`，exit 2，报告 **15 条 TypeScript 错误**，包括 TS7006 隐式 any、`net.listen` 参数类型、`Promise` resolve、`readFileSync` 与 JSON 误用，以及 `catch` unknown。该脚本位于 `.mendi`，`tsconfig.scripts.json` 只包含 `scripts/**/*.ts`；成功的 `node --experimental-strip-types` 不能代替类型检查，违反本项目对维护中 proof 脚本的要求。需给修订后的新 proof 配置实际可执行的严格类型检查并通过，不靠改名、排除或转成 `.mjs` 绕过。

**复现性提醒（不单独加审批 gate）：** 原 proof 第 139 行 `proof-results.json` 以 `flag:'wx'` 写入，已存在的本 Run 结果会阻止直接原路径重放。修订应使用新 Run 自己的输出路径，保留 002 不变，避免为了重放删除已正式交接原证据。

## 独立复核与边界

读取当前 manifest/AGENTS、D05-A 路线图、review/explore 方法、现行组协议与 delivery-verification 规格，逐段检查 `group-admission.ts`、`full-test-admission.ts`、`candidate-verification.ts`、`delivery-lifecycle.ts`、`group-attempt.ts`、`group-report.ts`、`delivery-runs.ts`，以及 002 的实际 proof 源码与结果。

在现有源码上独立执行 `node --experimental-strip-types --test tests/group-completion.test.ts tests/group-verification.test.ts`：**exit 0，6/6 tests passed，0 skipped/failed**。其中包含构建失败只阻断依赖、局部复验+多来源 verified/Close，证实当前行为基线。它并不是 D05 新正式直过与完整重跑的验收。本轮未运行根正式 Full Test，也未修改产品实现、旧历史、DreMo、稳定安装或 Git；只记录独立审核。

## 修订范围与下一步

Author 在原 D05-A 授权内新建 `revise-explore` 记录，针对 F1/F2 使用受管且严格类型检查通过的安全复现入口，证实自身路径清理，不覆盖 002 的旧证据；四项原业务结论若仍适用可引用，特别注明 P02 的局部场景限制。重新交独立 `review-explore`，本 Reviewer 不自签通过。

后续若获批准进入 Propose，应同步收敛 groups-v1 唯一正式入口、全量选取与单次一致性、直接 PASS 的严格提交/读回、旧 command 只读兼容、Repair/Review/环境例外、异常资源未确认，以及 CLI/status/next/Close 同一权威消费；补足 roadmap §7 D05-A 规定的未实施负例，但不要求 Explore 提前交付完整产品验收。

**交接：`revise-explore / author / changes-requested`。当前 Change 未获 Explore 批准，停止在 Reviewer 本次结论。