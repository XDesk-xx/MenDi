---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: latest-run-supplement-and-limited-amend
planningSlot: MVP-D05-D
batchId: 002-changes
actionId: latest-run-supplement-and-limited-amend-review-apply-01
actionType: review-apply
role: reviewer
actor: codex-independent-reviewer
run: "044"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: d05-d-apply-approved-for-archive
nextAction: archive
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-apply/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/043-apply/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/043-apply/run.md
---

# D05-D 独立 Review Apply（固定 043 Author）

**verdict: approved（允许按后续 Author 指令准备 Archive），无本阶段剩余阻断 Findings。** 固定 [043 Author Apply](../043-apply/run.md)，基准为 [042 Review Propose approved](../042-review-propose/run.md) 的当前设计合同、Proposal/Design、三份 delta Specs 和 16/16 Tasks；独立查看真实代码与行为、当前根 D05 manifest、受影响端到端测试与必要直接历史。当前根为 manual-bootstrap，正式代码仅在隔离 product-v2 中执行验证；本 Reviewer 没有修改 Author 产品/Specs/Tasks、旧 Run/verdict、D05-A/B/C Archive、DreMo 或 Git。

## Source 审核和行为依据

1. **Current & authority：** `src/adapters/aftercare-target.ts:18–94` 读取当前 product-v2/open/current round 并在真实 Run 类型间明确区分活动 Change 的 binding.latestRunRef 与无活动 Change 的 `deliveryRunRef`；Delivery 仅已完成的 Repair/Review，正式 Full Test、Lifecycle、Close、旧 archived Change、历史轮均不得后补写。结合全 Delivery `scanRunNumbers` 拒绝下一 Run 的 draft、残留占号和任何大于目标编号的新 Run，原 role/actor/submitted、可写、批次及真锁都受控。新操作并未创建生命周期 Run 编号。
2. **F1 源时间、F2 幂等、F3/F4 amend：** `src/core/run-aftercare.ts:13–49` 限定 supplement JSON 来源日期仅 `sourceClaimedCollectedAt`（强制 `sourceTimeTrust=unverified`），本次真实记录 `recordedAt` 在事务创建时生成，旧审批时间不能由 mtime 或声明臆测。`src/application/run-aftercare.ts:63–133` 与 `src/drivers/arguments.ts:80–90,172–181,239–246` 要求显式 `requestId/kind`，互斥 `presentation-only + body` 或 `unreviewed-comment + comment`，且拒绝缺/未知/混搭模式。前者 `presentation()` 保守只允许非敏感普通段落安全空白差异，Markdown code/链接/表格/列表/标题/引用/hard-break/事实改写都拒绝；后者自由评论仅单独 typed `authoritative=false` 旁路呈现，文字即使自称 approved/PASS，也不改变官方 Review。
3. **唯一已确认操作与先提交保留：** `src/adapters/aftercare-store.ts:33–94` 对同目标 supplement requestId、或单 Run 唯一 amend 槽位进行相同直接输入身份/模式匹配；同 ID、kind、原字节重试只读 returned confirmed，改 kind/原件/请求或第二个 amend ID 均拒绝；仅符合明确真实来源身份的不同补证可追加，不以文本内容相同合并独立真实执行。原 `run.md`、原审核 verdict、next、manifest/project 均不原地变更。
4. **事务、只读和异常：** `src/adapters/aftercare-store.ts:95–214` 在真实锁下重核当前对象/直接输入/受管路径，先独占 intent、必要原件与完整旧 run 基线，最后原子发布 confirmed 并直接读回。锁、复制、读回/确认任一中断保存 pending、真实文件与必要锁，不宣称成功；显式 `--resume finish` 仅限同请求，验证原写者确已结束、当前基线和全部直接字节，无不明锁清理、自动回滚或复用旧 PASS。`src/adapters/aftercare-reader.ts:24–142` 只展示有有效 intentDigest、原 Run 基线和全部证据 digest 的 confirmed；缺失/损坏的收据或零字节原件不补造成功。Query 把非权威评论放在 `unreviewedComments` 单独槽位，原正式 next/outcome 不因文稿自述变更。
5. **正式结果与历史边界：** `src/application/project-query.ts` 只给真正选中的当前 Run 附加只读 `aftercare` 字段；`src/adapters/workspace.ts:214–237` 通过 `assertAftercareSettled` 拦截当前未确认附属状态下的新产品写入。现行正式 groups-v1 的结果来源、双物理 stdout/stderr（含 0B）、child 与 parent 报告、成功/失败/unknown 验收、Archive 原流程未被此 Change 直接更改。Owner 的 036 精确小写新授权仅用于 MenDi D05-D 研发，不能据此对 DreMo 或其 035 实际补证。

## Reviewer 独立执行、保留单源原始输出

- 真实独立 `node --test --test-concurrency=2` 两个范围批次，原始 [aftercare TAP](artifacts/aftercare.tap.log) 和 [baseline TAP](artifacts/baseline.tap.log) 分别仅保留一份，完整真实命令/退出码/测试数在 [independent-tests.json](artifacts/independent-tests.json)：**aftercare 新增行为 20/20 pass**、`action-write/query/delivery-query/workspace` 回归 **36/36 pass**，**总计 56/56、0 fail/skip/cancel、两个 exit0**。此为受影响测试，不能冒称 D05 根正式 Full Test，也不能将隔离 fixture 的 Review actor 标签当作真实独立批准。
- Reviewer 新建 [reviewer-independent.ts](artifacts/reviewer-independent.ts) 使用两个新标记的 product-v2 受控目标真实调用编译后 CLI：相同自称“审核已批准”的内容在 `presentation-only` 被拒绝、在 `unreviewed-comment` 仅以 `authoritative=false` 保存；另实证相同 ID/内容重读、不同 kind/内容/第二 ID 拒绝、Review 后新 draft 令旧 Run 禁止新写、仍可只读旧 confirmed；冲突 supplement 的 `sourceClaimedCollectedAt=1999-01-01` 必为 `unverified`，真原件持久保存后源 `proof.txt` 删除也能独立读回，旧 run.md 字节和 next 不变。成功两案结果在 [independent-scenarios.json](artifacts/independent-scenarios.json)。该脚本从 `tests/aftercare-support.ts` 真实受控来源可复建，非真实 DreMo 或 MenDi 已提交工作流操作。
- 独立 fixture 第一次错误断言要求**有意创建下一条 Reviewer draft 后的 manifest 不变**（实际指针必须更新）而失败；仅修正 Reviewer 的断言位置和对象，不修改产品实现。原第一次失败 fixture 为避免误清保留，说明见 [reviewer-proof-correction.json](artifacts/reviewer-proof-correction.json)。更正后相同独立场景通过，成功夹具只按自己的 realpath、nonce marker、无锁边界精确清理，不扫描其他目录。
- 独立五项工程实际命令及唯一 stdout/stderr 见 [engineering-results.json](artifacts/engineering-results.json) 与 `artifacts/engineering-{check,build,openspec,reviewer-ts,diffcheck}.log`：`pnpm check`、`pnpm build`、OpenSpec 1.14.1 `validate latest-run-supplement-and-limited-amend --strict --json`（**1/1 valid**）、Reviewer 严格 TS 检查、`git diff --check` 均 **exit0**。四份 Reviewer TS scripts 均以严格 `tsc -p` 另存直接 [typecheck-results.json](artifacts/typecheck-results.json)，**exit0、零诊断**；工程通过与阶段 verdict 的语义审查分别判断。
- 通过独立 [reviewer-history.ts](artifacts/reviewer-history.ts) 定向核当前 033/034/035/036 与 D05-A/B/C 的 012/025/032 Archive **7 份实际原字节仍与先前已知源一致**，其中三份 Archive 同时与当前 Git HEAD 实际 blob 逐字节一致；结果见 [independent-history.json](artifacts/independent-history.json)。本核对仅是必要输入保证，不新增全库历史 hash 台账。

## 维护代码物理行数（含空白行，不设门槛）

本轮 [maintenance-results.json](artifacts/maintenance-results.json) 从维护 `.ts` 源文件独立统计前三，真实已有文件以 Git HEAD `9c818e6` 比较；未在 HEAD 的新增文件不捏造基准。

| 区域 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| `src/` | `application/delivery-lifecycle.ts` 368 | `application/group-attempt.ts` 361 | `adapters/workspace.ts` 354（原 346、+8） |
| `tests/` | `action-write.test.ts` 467 | `planning-cli.test.ts` 444 | `delivery-repair.test.ts` 395 |
| `scripts/` | `proofs/mvp-d01-c-explore.ts` 678 | `proofs/mvp-d01-d-explore.ts` 487 | `proofs/mvp-d01-a-explore.ts` 463 |

本 Change 的明显增长有直接对应职责：新 `run-aftercare.ts` 核心输入/Markdown 合同 108 行、`aftercare-target.ts` 目标与直接源 113、`aftercare-reader.ts` 只读检验 143、`aftercare-store.ts` 原子事务与恢复 214、`application/run-aftercare.ts` 组装 152；现有 `drivers/arguments.ts` 297→330、`project-query.ts` 158→163、`workspace.ts` 346→354。最大增长集中在真正独立的收据事务模块，旧大模块未承载新的事务状态机；新 `aftercare-recovery.test.ts` 228 行是围绕真实进程断点的验收测试，暂不为行数另拆简单转发层或改写旧 C/D Explore proof。后续触发职责混杂或新范围再做整理。

## 事实限制与下一步

本 Reviewer 只验证本机 Windows/Node 的受控文件系统、真实隔离 CLI 与本轮受影响测试。并未证明其它平台 ACL、外部不合作的写者或长时运行的任意故障都可自动恢复，也没有对真实 DreMo 执行任何补证。旧原 Run 历史不受当前虚构 actor 赋予权限；完成 Review 不是根 D05 的正式 groups-v1 Full Test、Close 或稳定安装。

**结论：approved；下一步 `archive / author / awaiting-instruction`。** 按授权由 Author 后续单独 Archive；本 Reviewer 不提前执行 Propose/Apply/Archive、根 D05 正式 Full Test、Close、Git commit/push、稳定安装或其他项目修改。
