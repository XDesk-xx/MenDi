---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-review-propose-01
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "007"
status: completed
actionStatus: completed
outcome: complete
verdict: changes-requested
result: proposal-semantic-contract-revision-required
nextAction: revise-propose
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/006-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/006-propose/run.md
---

# D05-A 独立 Review Propose（固定 Author 006）

**结论：changes-requested，两个明确的规格/设计冲突，暂不进入 Apply。** 此结论不否定 Owner 已批准的方向，也不回撤 005 的 Explore approved。当前受审对象为 [006 Author Propose](../006-propose/run.md)、`openspec/changes/unified-groups-full-test-and-repair-flow/` 下实际 proposal/design/4 份 delta specs/tasks。只读审查，不改 Author 方案、既有 Run/verdict、历史结果或产品实现。

## 认可的设计事实

- Proposal 已承接 Owner 决定：未来新正式验收只用 `groups-v1`，所有必需组本轮真实执行并稳定读回，由**同一正式 Run**直接 `passed`；不新增 `delivery verification create` 或例行 `owner-decision`；Close 独立授权。
- 全量失败收集、实际依赖阻断、取消与 unknown、资源安全、实质修复保留 `delivery-repair` → 独立 `review-delivery-repair` → 新完整正式执行，以及已确认纯环境问题的窄免修复例外，总体与 002/004 Explore 和 003/005 Review 一致。
- 方案明确旧 command、v1 attempt、verification 和旧 Close 历史只读，P03 旧 command failed 经审核修复后转入新 groups 首次运行，不伪造旧组或覆盖旧失败；未并入 D05-B/C/D、外部普通 Full 接纳或 DreMo。
- 四份 delta、proposal/design/tasks 均齐，13 项任务待 Apply；本 Reviewer 独立重跑固定 OpenSpec 1.14.1 `validate unified-groups-full-test-and-repair-flow --strict --json`，exit 0、issues 为空，详见 [openspec-validation.json](artifacts/openspec-validation.json)。**结构校验不代替语义审核。**

## 阻断 Finding

**F1 · 高 · 新 command 写入禁令与旧执行场景同时成立。**

- `openspec/changes/unified-groups-full-test-and-repair-flow/specs/delivery-verification/spec.md:5-7,25-27` 明确新正式写入只允许 `groups-v1`，旧 command 只能历史读取。
- **同一文件第 29–35 行**，MODIFIED 的 `Single operation execution and durable formal outcome` 仍有 `Scenario: Full command actually passes or fails`，其 WHEN 是“旧单次模式的 full 命令正常结束”，THEN 是“exit 0 为 passed、正常非零为 failed，**保存本次执行身份与结果**”。这是新的执行/持久化承诺，未限制为历史指定结果的只读解释，和禁令发生语义冲突。
- **影响：** Apply 可能保留 `delivery full-test run` 的旧 command 写入，或错误地删去旧记录读/查。**要求 Author 在同一 Propose 修订中**将场景明确限定为旧 Run 已存在时按当时合同**只读解释**，不新增 command 正式写入；需要验证新 command 请求在占号前拒绝，同时旧实际 passed/failed 的历史读回仍正常。无需新 Change、无需询问已经确定的 Owner 决定。

**F2 · 高 · 新 Close 类型、旧 Close 输入和持久指针尚不一致。**

- `openspec/changes/unified-groups-full-test-and-repair-flow/specs/delivery-lifecycle/spec.md:5-7,17-19` 规定新 Close 只从当前最新完整 v2 `groups-v1` 稳定 passed 收口，旧正式入口不得凭旧 PASS 收口；但**第 37–39 行**仍写“合法旧单次输入仍按原合同处理”，没有明确是历史 Close **查询**还是允许新 Close **写入**。
- `design.md:72–78` 提到新 v2 沿用 `manifest.testAttemptRunRef`、`deliveryRunRef`，同时 `fullTestRunRef` 可继续作 CLI 的输入名，旧 `fullTestRunRef` 又仅作历史定位。**缺少新 Close 的唯一权威选择/核对规则与类型分流表述**。该选择不可留给 Apply 猜测，因为它直接决定旧 PASS 是否可被误用。
- **真实现状支持：** `src/core/rounds.ts:159–170` 明确 `fullTestRunRef` 只接受 `delivery-full-test`，`testAttemptRunRef` 只接受 `delivery-test-attempt`；`src/adapters/delivery-runs.ts:72–78` 按这两种类型分别更新指针；`src/core/delivery-lifecycle.ts:80–113` 的旧 Close parser 也仅识别旧 full/verification。Reviewer 使用纯 `projectRound` / `readRounds` 与合法 v2 manifest 进行**真实纯函数负例**：两指针分开保存可以读回，把 v2 `delivery-test-attempt` Run 填进 `fullTestRunRef` 则得到 `轮次结果指针类型不符。`，证据在 [proof-results.json](artifacts/proof-results.json)。该实验并非新 Close 已实现的验证。
- **要求 Author 修订**：明确新版 Close 输入究竟沿用 `fullTestRunRef` 的**参数名作为别名**、还是引入/使用 typed `testAttemptRunRef`；无论选择哪种，必须说明持久化只使用哪个现有 typed 指针，怎样与最新 `deliveryRunRef`、当前轮、批准/材料快照、执行身份一致，旧 `fullTestRunRef`、`verificationRunRef` 的读历史边界和新写入拒绝边界。不要将 v2 Run 值简单写入旧 `fullTestRunRef` manifest 槽位。
- 同步修正生命周期 delta 第 37–39 行和 `tasks.md:18–20` 的测试，包括：本轮 v2 passed + manifest 保留旧 command/verification 指针时可以安全 Close；旧 command passed 或 v1 verified 不可作为新 Close；当前新 attempt 取代旧通过后的陈旧输入、多 selector、未知/锁/读回异常均 fail-closed；已完成历史 Close 按旧格式继续只读。不能混为“旧单次继续原合同就允许新写入”。

## 独立审核 proof 与限制

- 新建 [reviewer-proof.ts](artifacts/reviewer-proof.ts)、[tsconfig.json](artifacts/tsconfig.json)，审核脚本独立严格 TypeScript 检查通过，真实执行后生成 [proof-results.json](artifacts/proof-results.json)。其中保存 006 四份关键材料和当前相关实现的 source SHA、具体行号、`readRounds` 的正负例结果、固定 Author 及 Git HEAD。OpenSpec 原始校验输出只保存一份在 `openspec-validation.json`。
- 首次运行 Reviewer 自有检查脚本时，针对 `design.md` 的字符串定位漏掉 Markdown 反引号，辅助断言失败；修正本次**尚未提交的 Reviewer 脚本**查找文本后，独立严格类型检查及 read-only 语义证明成立。该失败是本 Reviewer 辅助定位错误，不是产品错误，未影响 Author 或删除文件。
- 本次是 Propose 合同与当前解析器的核对，**未实施**新的 v2 执行/Close，也不冒充真实端到端验收；未运行根正式 Full Test、Git/Close、DreMo、发布/部署，未修改前述历史。

## 下一步

Author 只需对 F1/F2 做**局部 revise-propose**，改动当前 design、相关 delta、必要 tasks 与说明；已一致的 Proposal、其它规格和 Explore 结论可以保留。修订后交独立 `review-propose`，保留本 007 `changes-requested` 与 006 原材料。此审核不新建额外全局门槛或强制重跑全部旧 proof。

**交接：`revise-propose / author / changes-requested`；停止，不自动执行 Apply。**
