---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: full-test-orchestration-continuation-and-revalidation
planningSlot: MVP-D04-B
batchId: 002-changes
actionId: full-test-orchestration-continuation-and-revalidation-review-explore-02
actionType: review-explore
role: reviewer
actor: codex-independent-reviewer
run: "011"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: exploration-approved-with-adversarial-evidence
nextAction: propose
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/review-explore/SKILL.md
authorRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/009-explore/run.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/010-review-explore/run.md
---

# MVP-D04-B 补充独立 Review Explore

Owner 要求保留原审核，重点检查 009 实验设计的遗漏，按疑点补做真正独立的对抗验证，保持 Reviewer，完成停下。固定 Author 仍为 [009](../009-explore/run.md)；[010](../010-review-explore/run.md)及其 verdict / 证据保持原样。本次另建 011，不将新实验补写进旧审核，采用已完成审核后的新审核 Action。

**结论：approved，仍只允许进入 Propose；新增五类实验盲点及一项边界确认。** 原先重复 Author 实验不能排除这些反例，本次从结论的必要条件反向构造了独立夹具。反例否定了“pass 事件 / 文件成功集合 / 退出 0 / collection 文本可直接证明逻辑组完整通过”的捷径，但没有推翻 009 已明确限定的命令粒度、机器事件可行性及显式逻辑组方向。009 第 39–40、89、91–97 行已经将映射、未确认、真实退出、完整覆盖和协议设计列为后续义务，因此不要求 Author 修改已提交的 009 或假装新协议已存在。以下实证是后续 Propose 的直接审核输入，不能仅沿用 010 的成功重放摘要。

## 独立实验设计

使用 MenDi review-explore 方法，重读当前合同、009 原结论和测试 / 正式准入实际实现。没有复用 009 / 010 的 proof 脚本、旧临时目标或结果；新建 [adversarial.ts](artifacts/adversarial.ts)、[event-worker.ts](artifacts/event-worker.ts)及五份小型 TypeScript 夹具。复用项目 testTarget / verificationTarget 仅为构造合法隔离 workspace、真实 pnpm 和明确标注的阶段记录；实验刺激、事件判定、故障位置及断言由 Reviewer 独立设计。夹具 actor / verdict 不认证实际角色，也不构成根正式验收。

| 疑点与新刺激 | 实际观察 | 对 009 实验设计的判断 / 后续义务 |
| --- | --- | --- |
| E1：文件包含一个 skip 和一个 TODO，没有成功业务断言 | 两条 test:pass；summary success=true，但 counts.passed=0、skipped=1、todo=1。包装进程 exit 0。 | 原文件集合算法只看 type，会把该文件列入 passed；原例因每文件单一普通测试而没有暴露。必须定义必需项及 skip / TODO 对覆盖的影响，不能把无 fail 或 summary success 直接当覆盖充分。[证据](artifacts/results/skip-todo-summary.json) |
| E2：同文件一个成功断言、一个失败断言，另有独立 tail | 同一 mixed.ts 同时出现在 pass 与 fail 事件；独立 tail 仍通过。 | “成功文件集合”与“失败文件集合”可相交，文件不是天然互斥组终态。需要稳定逻辑组身份、聚合边界及失败优先规则，不能按第一个 / 最后一个事件覆盖。[证据](artifacts/results/mixed-and-tail-summary.json) |
| E3：断言已通过后，文件进程真实 exit 7；另做前项 pass 后 AbortController 取消 | late.ts 先 pass 后 fail；取消例先 pass，随后两个 test:fail 的 failureType=testAborted，根 summary 为 failed=0 / cancelled=2。tail 没有业务测试通过事实。 | 提前 pass 不等于组完成；test:fail 也不都表示业务断言失败，取消和未完成须独立解释。文件、子测试、根 summary 的层级不能混淆。此例没有外部服务，不证明资源全部清理。[late](artifacts/results/late-exit-summary.json)、[abort](artifacts/results/partial-abort.jsonl) |
| E4：真实 run() TestsStream 已有失败，包装器只遍历事件、不设置 exitCode | 包装器退出 0；通过真实 pnpm 和生产 runTest 执行时，MenDi command outcome=passed，stdout 原样含 test:fail。 | 原机器事件小例本身也是可行性 harness，不能默认事件流会替目标传播退出码。新协议必须核对回执与执行终态的一致性，任一失败 / 缺口不能由另一路成功掩盖；旧命令模式仍按退出码解释，不能从 stdout 猜测。[生产结果](artifacts/results/production-command-versus-receipt.json)、[原始输出](artifacts/results/production-command.stdout.log) |
| E5：保持合法完整 collection 声明，但实际 full 入口仅执行 skip / TODO 文件 | 真实 pnpm full exit 0，正式 Run passed；TAP 为 pass 0、skip 1、todo 1。 | 009 证明了“缩减声明被拒绝”，未证明声明和实测覆盖一一对应。此反例表明即使不改源码也可能没有有效覆盖；候选材料一致与本次必需组完成是两个独立条件。新协议应直接核对计划 / 回执 / 完成条件；旧模式的覆盖真实性仍须阶段工作与独立审核，不可宣称工具测得。[正式结果](artifacts/results/formal-all-skipped.json)、[原始输出](artifacts/results/formal-all-skipped.stdout.log) |
| E6：真实子命令完成后，在 before-terminal-commit 注入一次持久化错误，再请求新执行 | 返回顶层 unknown、保留锁；内存 observed 曾为 passed，但磁盘仍 running / unknown。第二次请求在分配 executionId 前拒绝，执行目录列表不变。 | 既有保护在此边界成立。未来汇总不能挑 observed 内层成功绕过顶层 / 持久化不确定状态；恢复与完成条件需覆盖命令结束之后。此注入发生于 child close 之后，没有制造存活孤儿或自动清锁。[故障](artifacts/results/terminal-write-failure.json)、[持久结果](artifacts/results/terminal-failure-persisted.json)、[拒绝后续](artifacts/results/followup-after-unknown.json) |

E4 / E5 是受控不充分目标的反例，不是本 Reviewer 批准这些目标的验收，也不将现行命令级合同描述为已实现新协议后的漏洞。现行 delivery-verification 对声明、执行事实与语义覆盖的区分与这些结果一致。E3 的 conclusions 中 abortLeavesTailUnexecuted 仅指本例取消后没有 tail 业务测试完成；不能外推为任意目标进程 / 资源都已停止，详细类型以原始事件为准。

## 执行记录和失败保留

- 初次 `pnpm exec tsc -p <本 artifacts>/tsconfig.json` 报 TS2783：Reviewer 的 Error 序列化对象属性重复；原输出保留在 [typecheck.log](artifacts/typecheck.log)。执行实验前调整展开顺序，第二次同命令 exit 0，见 [typecheck-02.log](artifacts/typecheck-02.log)。这是本次审核脚本修正，未修改 Author 或产品代码。
- `node <本 artifacts>/adversarial.ts`：exit 0，E1–E6 断言成立；见 [命令输出](artifacts/adversarial-command.log)、[结论](artifacts/results/conclusions.json)。进程返回 0 表示审核断言成立，受控业务失败、取消及持久化错误原样保留，不合成为业务 PASS。
- 四组事件实验各有原始 JSONL / stderr 和提取摘要；生产普通 / 正式命令各有直接结果与 stdout / stderr。E6 另保存真实持久化结果，未只引用内存对象。原始输出各保存一次。
- 受测 HEAD 仍为 168a4cb54f0c9028eaf9c271b43d9ee14c3ae904。产品实现、tests、skills、主规格、包 / 锁与根 project 没有新差异；两个 Author proof 入口未修改。根工程检查沿用 010 的当前候选有效结果，本次新增脚本及夹具独立通过真实 TypeScript 检查，不重复整套 250 项或根正式 Full Test。

## 未证明的部分与审核结论

没有用自造的未来协议实现来“证明”方案。跨尝试来源去重、计划 / 候选 / 环境的失效判定、逻辑组依赖阻断、资源清理与复用、不同 runner 的回执归一化以及 Close 消费仍未实现。本次不能认证这些能力，但它们在 009 中已明确属于 Propose / Apply，不构成要求 Explore 提前完成全部验收的理由。

下一阶段必须把 E1–E6 揭示的覆盖、终态、取消分类和双通道一致性落进具体合同与负例；特别是“同候选”不能替代“覆盖充分”，“旧 command passed”不能自动变成新协议的组级事实。具体 schema / 命令和是否需要新增字段由 Propose 收敛，本 Reviewer 不代写方案。若后续方案仍直接把 pass 文件集合或 exit 0 作为组完成，届时应退回，而不能援引本次 approved 放行。

保留 010 原 verdict；当前最新审核为本 011 的 Explore 范围 approved。更新当前人工 manifest / README / context 指向本次补充审核，下一步仍为 `propose / author / awaiting-instruction`。本 Reviewer 已停下，未编写方案、实施、修改旧 Run、清理故障锁、推进 C、执行根 Archive / Full Test / Close、真实迁移、稳定安装切换或 Git 写操作。
