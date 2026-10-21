---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: latest-run-supplement-and-limited-amend
planningSlot: MVP-D05-D
batchId: 002-changes
actionId: latest-run-supplement-and-limited-amend-review-explore-01
actionType: review-explore
role: reviewer
actor: codex-independent-reviewer
run: "034"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: explore-approved-with-delivery-scope-pointer-constraint
nextAction: propose
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-explore/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/033-explore/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/033-explore/run.md
---

# D05-D 独立 Review Explore（固定 Author 033）

**verdict：approved，可以进入 Propose；无本阶段阻断 Finding。** 固定 [033 Author Explore](../033-explore/run.md)。目标以当前根路线图 `mendi-foundation-and-delivery-roadmap.md:666–675`、现行产品 Run/Action/Delivery APIs 为依据，检查真实最新 submitted Run 的附属 supplement 与有限 Markdown amend 两种后续能力。Author 033 只创建 OpenSpec scaffold 和 product-v2 隔离 Explore proof，没有实现 `run supplement` / `run amend`。其保存 6/6 proof 与 Action 回归 23/23，可由本人证据和 Reviewer 独立执行核对；并且已承认外部 `mendi-run-amend-supplement-design.md` 原件不在本地根，未冒称已读取其全文。根路线图已明确当前 Owner 约束；没有新的阻断性 Owner 产品选择。

## 现行事实与独立复核

- Author 033 [proof-results.json](../033-explore/artifacts/proof-results.json) 的 P01–P06 实际表现为：Change Author `submitted/complete` 且暂未下游时仍被 `currentRun` 选择；普通 `save/submit` 因 `run-already-submitted` 被拒；`managedPath` 拒绝 `../` 越界；Review draft 新占号后旧 Run 不再当前；Actor 与锁冲突拒绝；Reviewer approved 的 `verdict/authorRunRef` 与 Author 字节保留。其 OpenSpec readiness 是受控模拟，只能认证产品本地分支和 fixture，不是真实外部审批。Author 原本第一次证明对锁错误码的预期不符，已在其 033 文中记录并修正；历史结果没有覆盖。
- Reviewer 新建 [reviewer-proof.ts](artifacts/reviewer-proof.ts)，使用**另一份全新 product-v2 Change fixture**真实执行 7 项同类检查并附加 Reviewer approved 后下一条 `propose` draft 立即使原 Review 非 current 的负例。得到 [reviewer-proof-results.json](artifacts/reviewer-proof-results.json)：Author 001 submitted、Reviewer 002 approved，下一条 003-propose draft 出现后旧 Reviewer `save` 因 `run-not-current` 拒绝；锁冲突真实拒绝且由原测试持锁者正确释放，原 001/002 字节一直未变。该 Proof 从未运行尚不存在的 supplement/amend 新 CLI。
- Reviewer 额外新建 [reviewer-delivery-proof.ts](artifacts/reviewer-delivery-proof.ts)，独立探查根路线图所举 **DreMo 035 同类的 Delivery 级 `review-delivery-repair`**：在另一个隔离 product-v2 目标上用测试专用**历史 legacy 命令 fixture**造出真实失败源 #015，调用现有 `startDeliveryRepair` -> 016 Author submitted -> 017 `review-delivery-repair` approved；`manifest.deliveryRunRef` 真实指向 017，`query` 的 next 为 `delivery-full-test`，原 `saveRun` 因 `run-already-submitted` 被拒；接着建立 018 `revise-delivery-repair` **draft**，权威 `deliveryRunRef` 立即指向 018，旧 017 再次 `saveRun` 因 `run-not-current` 被拒；旧 016/017 原字节仍可读，详见 [reviewer-delivery-results.json](artifacts/reviewer-delivery-results.json)。该历史命令仅供**隔离研究旧修复审批来源**，不授权新的正式 command Full Test，且没有触碰真实 DreMo 035。
- Delivery 级实验另外发现必须区分的当前查询概念：无活动 Change 时，`currentRun()` **可返回最近 archived Change 的历史 Run**，而 `currentDeliveryRun()` 与 `manifest.deliveryRunRef` 表示当前 Delivery 进展；`src/core/associations.ts:22–35`、`src/adapters/runs.ts:42–48`、`src/adapters/delivery-runs.ts:37–66` 和 `src/application/project-query.ts:54–88` 直接支持此区别。初次 Reviewer 自有证明错误地预期 `currentRun() === null`，产生一次**Reviewer-only 的断言失败**，不属于产品故障。更正后重新通过，保留 [reviewer-proof-correction.json](artifacts/reviewer-proof-correction.json)；初次失败的自有 fixture 未作任何不受控的 `.tmp` 全局清理。
- Reviewer 独立真实运行 `node --test --test-concurrency=2 tests/actions.test.ts tests/action-write.test.ts`：**23/23 pass、0 fail/skip/cancel、exit0**，原始 [TAP](artifacts/action-regression.tap.log) 和 [result](artifacts/action-regression-result.json) 保存于当前 Reviewer Run。Author 和 Reviewer 共四份 TypeScript proof/runner 均经实际严格 TypeScript 检查（Author 原 033 proof 单独检查、Reviewer 三份脚本纳入同一 `tsconfig.json`），**均 exit0、无诊断**，原始命令在 [typecheck-results.json](artifacts/typecheck-results.json)。`git diff --check` 退出 0。

## 必须进入 Propose 的明确规则

1. **Current latest 的身份不能靠一个指标。** 同时核当前 product-v2、open、当前轮、当前 selected Delivery、目标 Run 的真实类型与受管路径、Role/Actor、`submitted` 状态、实际相应权威指针（Change 的 active binding 或 Delivery 的 `deliveryRunRef`）、全 Delivery Run 共享编号占位与下游 draft/正式 Run，以及 Close/Reopen/锁/unknown。Change 级和 Delivery 级都必须有真实正负例。尤其当最新 approved 对象是 Delivery 级 Reviewer、`activeChangeId=null` 时不能错误地用 archived Change 的 `currentRun` 准入。下一条 draft 已生成便拒绝原对象，不能仅靠其 `next` 文本或旧 approved 头部继续补写。Propose 应精确定义哪些 Run 类型支持本操作，并明确拒绝不符合合同的类型。
2. **Supplement 保持附属记录而非审批时光倒流。** 对已提交的当前最新 Run 增加必要附件及真实后续时间、操作者/来源/原因；不得改原 Run 正文、身份、verdict/result、编号或交接指针，不新建生命周期 Run。现有批准时点之后新执行的 Proof 必须标示自己的实际时间；与原结论冲突应记录冲突并停 Owner/独立复核，而不是自动改变或确认先前审批。相同附件重试、路径越界、外部来源失败、缺失原件、直接输入变化和未确认的写入应可区分并 fail-closed。
3. **Limited amend 必须有可执行的非实质边界。** 只能处理已确认的排版、错字、普通链接、非实质引用或明确标注的事后附注；需保存 original bytes/旧正文、修订后正文、精确差异、操作者/时间/理由及受管恢复路径。不能因 frontmatter/verdict 未动就接受正文中改变失败/通过、权限、范围、证明来源、测试覆盖或审核含义的修改；不能简单依赖关键词/自由 Markdown 替换或 AI 自判。Propose 应选定保守、可测、可拒绝不确定改动的白名单/校验流程，并提供等价正例与**语义变更负例**，无把握则拒绝，改走正式修订和独立 Review，不能在 Apply 随意放宽。
4. **事务、归属与历史只读。** Supplement/Amend 的记录与索引/Run 正文关联要避免局部成功被宣告完成，具备明确事务意图、持锁前后核对、原子写入或可诊断、有限恢复与幂等；不得自动清理锁/unknown，不改旧 Run/verdict，也不额外设空 Action、强制 proof 数量、全库历史 hash 表或通用编辑器。既有 Run 无补充字段照旧读。可直接被原产品查询看见的后续事实不替代当前 Role 的审核授权。
5. **授权范围继续独立。** Owner 原始 `Owner 授权` 已激活**MenDi D05-D 研发**，并未授权对真实 DreMo 035 或任何外部历史实际补证。D05-D 的 Propose/Apply 必须在本机 MenDi 的独立 product-v2 fixtures 测试，不自动改 DreMo；未来要使用需再次核当时仍为真实最新未消费 Run 与目标自身授权。正式 D05 Full Test、Close、Git、安装继续独立授权。

## 审核限定与交接

Reviewer 本次复用已有 Author 实验，并独立重放 Change 级和 Delivery 级的**当前现行产品边界**，不声称新补证/修订功能已实现、能防一致重写攻击或已经具备正式事务恢复能力；这正是待 Propose 定稿/Apply 实现的范围。所有实际写入只发生于 Reviewer 新建的隔离 product-v2 夹具及本 034 的 Reviewer artifacts，按 nonce/realpath/无锁规则只清理确知自有成功夹具。没有改变任何已提交 Author/Reviewer Run、产品源码、OpenSpec Change 正式 Proposal/Specs/Design/Tasks、D01–D05-C Archive、真实 DreMo、Git 或稳定安装。

**verdict：approved；下一步 `propose / author / awaiting-instruction`。** 033 Explore 已足以收敛为可审核方案，尤其 Delivery 级当前指针与有限 amend 的非实质边界在 Propose 必须具体落实。Reviewer 不提前执行 Propose/Apply、Archive、正式 Full Test、Close 或发布。
