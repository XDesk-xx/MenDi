---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-explore-01
actionType: explore
role: author
actor: codex-author
run: "002"
status: completed
actionStatus: completed
outcome: complete
result: proof-supported
nextAction: review-explore
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/explore/SKILL.md
upstreamSkillRef: .agents/skills/openspec-explore/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/001-delivery-open/run.md
---
# D05-A Author Explore：统一正式 Full Test 与修复交接

Owner 原始授权：owner 授权 激活 下一个change，进行 proof explore，关键问题向我提问，后续的修复处理是否确认了使用 delivery repair 和 review delivery repair 的runs？

## 激活与范围

已执行 OpenSpec 1.14.1 的 new change unified-groups-full-test-and-repair-flow，只生成原生 scaffold。
当前手工记录模式不支持通过产品 Action 写入，沿此前已实际使用的人工绑定方式登记 D05-A、002-changes 和当前 002 Run；不冒称产品 CLI 绑定成功。
本次 Explore 重点是目前 groups-v1、旧 command 历史至新执行入口、正式失败修复 / 审核及环境排除边界，范围来自路线图 §7 D05-A。

## 核心现状、证据入口与适用边界

- 仅激活 D05-A：固定 OpenSpec 1.14.1 的 `new change unified-groups-full-test-and-repair-flow` 已创建原生 scaffold；`status --change` 为 proposal ready、其他产物尚未开始。已读取项目 context、openspec-explore、现行 `delivery-verification` / `test-execution` 等规格、源码与 Repair Skills。根项目为 `manual-bootstrap`，本次 002 Run 为人工记录，不冒称产品 CLI 写入成功。
- 使用当前真实产品函数及已有受控目标夹具，**运行四次隔离 proof**。可重建的源码在 [proof.ts](artifacts/proof.ts)，实际 JSON、组结果、执行身份及关键回执保存在 [proof-results.json](artifacts/proof-results.json)。命令：`node --experimental-strip-types <本 Run>/artifacts/proof.ts`；进程 exit 0。完成并确认无夹具锁的临时目标按本次创建范围清理，没有整树复制生成证据。
- 夹具中的 Author/Reviewer actor、approved 仅检验产品准入，**不能替代根 Change 的真实独立审核**；未修改 MenDi 正式测试、D04 历史、DreMo 或稳定安装。

| 编号 | 实际观测 | 结论 |
| --- | --- | --- |
| P01 | 真实 group runner 在同一次执行得到 `prefix passed / middle failed / tail failed`，协议 valid，next=delivery-repair。 | 已能收集独立的多个失败；无需另建通用调度器。 |
| P02 | 本地真实 TCP 服务占用 middle 的目标端口：`passed / blocked / passed`。确认本次服务结束后重新完整 initial：`passed / passed / passed`，**未产生 Repair/Review Run**。 | 已知 blocked 已有免修复 Run 的重跑基础，但这不证明所有 `failed` 环境冲突已正确分类。 |
| P03 | 旧 command 正式 failed → 隔离 Author delivery-repair → Reviewer review-delivery-repair approved → 首次 groups-v1 admission，真实报 `invalid-data: 当前 attempt 必须是非空字符串。`；旧 failed Run 字节保持。 | `src/application/group-admission.ts:56–63` 无条件读取不存在的 `testAttemptRunRef`；需衔接新完整分组首次运行，不伪造旧组和 PASS。 |
| P04 | 初次 `passed / failed / passed`，仅 middle 有实质修复并经夹具审核后，`retest` **只执行 middle**，`delivery verification create` 仍从两次执行拼出 `verified`。 | 现行局部 retest + candidate-verification 是 D04 已交付行为，**与 D05-A 正式完整重跑的目标相冲突**，须同时改写实现与规格，不只修改说明。 |

## 修复与审核 Run 的确定边界

- **保留 `delivery-repair` 与 `review-delivery-repair`**：实际修改业务代码、测试断言、测试入口或执行配置语义时，由 Author 修复 Run 保存变化与必要 Focused/Fast，独立 Reviewer 的 Review Run 给 verdict；`changes-requested` 后按需要修订并重审。批准后**新一次完整 Full Test 覆盖全部必需组**，不借旧 PASS 合成。
- **已确认的环境准备例外不创建 Repair/Review Runs**：只有实际证明本项目资源、执行终态及清理均可确认，且没有代码、断言或受测语义改变，才可简记处置并重新完整运行。P02 的 blocked 已实测；其它 `failed` 需要 D05-A 调整 CLI 准入和 Skills。unknown/锁/资源归属不明停 Owner，不自动清理。
- 现行 `src/application/full-test-admission.ts:85–91` 仍将旧 failed 强制导入审核；`skills/actions/delivery-repair/SKILL.md` 仍要求无代码变更的失败分析也产生独立 Review。新政策尚未实现，不能把 Explore 的结论当作现行产品已生效。
- 现行 `openspec/specs/delivery-verification/spec.md` 明确允许局部复验和多来源 verified；D05-A Propose/Apply 必须改这一正式合同、`src/application/group-admission.ts`、`candidate-verification.ts`、`delivery-lifecycle.ts` 和相关方法，保留历史结果只读。

## Owner 已确认：正式 Full Test 直接 PASS，不额外卡 Owner 决策

Owner 本次回复：**“这里为什么 要 owner-decision？ 直接 pass 不行吗？”**。据此明确采用直接通过的简化合同：新版 `groups-v1` 在**本次声明的所有必需组真实执行通过、完整报告有效、执行与资源清理均 confirmed、正式 Run 稳定提交与读回成功**时，由这次正式 Full Test Run 直接产生 `passed`；不需要先走 `owner-decision`，也不额外创建 `delivery verification create` 汇总 Run。一次完整正式执行对应一次真实验收结果，不能用旧组 PASS、跨尝试选来源或局部 Focused/Fast 补齐。

遇到普通已知业务失败或未覆盖必需组时，保留真实失败和缺口；代码/测试合同的实质修复继续使用 `delivery-repair` → 独立 `review-delivery-repair`，随后**新完整 Full Test**；普通且可核实的本项目环境准备问题免额外修复/评审 Run，安全处置后重新完整执行。执行、清理、写入及资源归属 `unknown` 时停止依赖操作、保留现场，必要时再进入 Owner 决策。**正式测试 `passed` 不自动授权或执行 Delivery Close、Git、部署。**

以上是 D05-A 后续需实现的目标合同，未声称当前安装版已经支持。具体统一 Run 类型、历史查询及 Close 消费在后续 Propose 细化；旧 command、`delivery-test-attempt` 和 `delivery-verification` 历史保留只读，不改既有 verdict。

## 阶段与停止

四项隔离真实 proof 已完成，Owner 关键决定已收敛在本 Run。**本次 Author Explore 完成，交给独立 Reviewer 执行 `review-explore`**；没有自签独立审核结论，不直接进入 Propose/Apply。未写 Proposal/design/specs/tasks，不进行 Archive、正式 Full Test、Close、Git checkpoint 或部署。
