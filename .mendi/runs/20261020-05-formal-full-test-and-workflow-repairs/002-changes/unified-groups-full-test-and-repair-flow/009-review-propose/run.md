---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-review-propose-02
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "009"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: revised-proposal-approved-for-apply
nextAction: apply
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/008-revise-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/008-revise-propose/run.md
---

# MVP-D05-A 独立 Review Propose（针对 008 修订）

**结论：approved，仅批准最新 Propose 进入 Apply。** 固定审核对象为 [008-revise-propose](../008-revise-propose/run.md)，其修订原始 006，且承接 007 Review 的 `changes-requested`。原 006/007、005 Explore 及实际 proof/verdict 不改。当前并没有证明 D05-A 产品实现已满足新合同。

## 007 两项阻断问题：独立复核

| Finding | 最新事实及直接位置 | 结论 |
| --- | --- | --- |
| F1：新 command 正式写入与旧 command 场景冲突 | `openspec/changes/unified-groups-full-test-and-repair-flow/specs/delivery-verification/spec.md:7,25–27,33–35`：新增正式 run 只接受 groups-v1；旧 command 场景的 WHEN 限定为已存在历史 Run 的只读查询，THEN 明示“不启动 command、不创建或改写 Run”，旧 passed 不能成为新版 Close 输入。Tasks 1.2 含占号前拒绝负例 | **已解决** |
| F2：新 Close typed 指针与旧 selector 混淆 | `design.md:72–80`、`specs/delivery-lifecycle/spec.md:21–43`、`tasks.md:19–20`：新 Close JSON 唯一输入 `testAttemptRunRef`，与同轮当前 `manifest.testAttemptRunRef = manifest.deliveryRunRef` 一致、目标版本 v2，保存 typed acceptance；旧 `fullTestRunRef` / `verificationRunRef` 仅供已存在历史 read，任何旧 selector 的新版 Close 写入拒绝；新增 parser/round closed/readback 修改与正负例明确成为 Apply 任务 | **已解决** |

## Reviewer 独立证据

实际写入的 Reviewer 可重放入口为 [reviewer-proof.ts](artifacts/reviewer-proof.ts)，严格 TypeScript 配置为 [tsconfig.json](artifacts/tsconfig.json)。[proof-results.json](artifacts/proof-results.json) 保存执行日期、固定 Author、相关直接材料与代码、四项合同断言、当前轮次 parser 正负例和适用限制。[openspec-validation.json](artifacts/openspec-validation.json) 保存本次独立重跑固定 OpenSpec 1.14.1 strict validate 的原始 stdout/stderr、退出码。

- F1 跨文档合同断言成立：新命令正式写入被禁止，既存旧 command 成功/失败按原始事实只读解释，没有通过只读兼容推出写入权。
- F2 跨 design/spec/tasks 合同断言成立：选定单一 typed `testAttemptRunRef`，严格规定与当前进展指针相等，并覆盖新 Close / 历史只读 / 旧 selector 拒绝的实施验证。
- 以当前 `src/core/rounds.ts` 实际 `projectRound/readRounds` 纯函数执行合成 v2 scope 的直接负例：新 attempt 与旧 command 指针**分开保存时可以读取**；把 typed attempt 错填旧 `fullTestRunRef` 实际拒绝“轮次结果指针类型不符”；新 typed-only closed 当前仍拒绝“closed 轮次缺少一致收口”。**这是尚未 Apply 的事实与新增任务必要性，不是已经实现新 Close 的证明。**
- OpenSpec `validate unified-groups-full-test-and-repair-flow --strict --json`：exit 0、无 issues；方案的四份 delta 与 13 项待实施任务一致。仅证实结构，不能代替本次 Reviewer 语义审核。
- Reviewer 本次辅助脚本初次运行有一处文字匹配期望不符合新版规范实际前缀，未生成成功证据；本 Reviewer 修正脚本自身定位断言后重跑，通过且才保存上述 proof/results。不是产品或 Author 缺陷，未改受审方案。

## Apply 必须兑现的边界（非新增设计门槛）

新 v2 groups-v1 完整本次报告与结束/清理/持久读回才可正式 passed；实质修复保留 Author Repair / 独立 Review，之后重跑所有必需组；安全确认的纯环境问题仅按窄合同免空 Repair/Review；旧 command failed + 当前 Repair/Review approved 首次新分组准入须有效；当前/旧格式 parser、CLI、status/next、round/current pointers、Close、历史已 Closed 的只读兼容需端到端同步。特别是当前 `readRounds` **尚不能收口 typed-only round**，不能把 Reviewer 的解析器负例当作产品测试通过。

对比 Owner 决定，新正式 Full Test 可由同一 Run 直接 passed，但 Close、Git、安装、DreMo 操作仍分别独立授权。新正式写入只支持 groups-v1，不允许继续新建旧 command、v1 continue/retest 或新 verification 汇总，不引入外部普通 Full 追认与其他 D05-B/C/D 能力。保持实际失败/取消/资源 unknown 现场与受控日志；适用范围未变，当前无需重复向 Owner 提问。

## 完成与交接

仅新增本 009 Review Propose Run/artifacts、调整 MenDi 当前 manual-bootstrap manifest 的 Reviewer 交接；未修改 008/006 Author 方案、旧 007 verdict、产品实现或历史 Close，也未执行正式 Full Test、Archive、Git、稳定安装、DreMo。

**下一步：`apply / author / awaiting-instruction`。Reviewer 停在此处，不自动 Apply，也不表示新正式 Full Test 已具备生产使用条件。**
