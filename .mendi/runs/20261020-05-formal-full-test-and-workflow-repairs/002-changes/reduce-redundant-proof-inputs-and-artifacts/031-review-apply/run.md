---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: reduce-redundant-proof-inputs-and-artifacts
planningSlot: MVP-D05-C
batchId: 002-changes
actionId: reduce-redundant-proof-inputs-and-artifacts-review-apply-01
actionType: review-apply
role: reviewer
actor: codex-independent-reviewer
run: "031"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: d05-c-apply-approved-for-archive
nextAction: archive
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-apply/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/030-apply/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/030-apply/run.md
---

# D05-C 独立 Review Apply（固定 Author 030）

**结论：approved。** 依据 [030 Author Apply](../030-apply/run.md)、[029 Review Propose approved](../029-review-propose/run.md)、028 Proposal/Design、`action-runs` 与 `test-execution` 两份 delta Specs 及 14/14 Tasks，独立审查源码、真实 opt-in 采集、正式 TestExecution/groups-v1 和旧历史保护；未发现此范围内的阻断项。**本批准仅允许 Author 在下一次独立授权下 Archive 当前 D05-C；不表示整个 D05 已经正式 Full Test/Close、Git checkpoint 或稳定发布。**

## 实施核对与源码边界

1. **受控单源采集：** `tests/evidence-support.ts:59–199` 用当前 opt-in evidence 目录限定采集会话，真实文件 canonical path + inode/创建身份作为同源依据；为同一文件复用唯一受管原件，其他摘要仅存可读引用；另一次独立执行即使 stdout 相同也不会依文本合并。临时源读取前后核对身份/字节，短写补完，零进展/发布错误/来源改变使采集 incomplete，保留失败现场、不用完成标记掩盖失败。新的 `tests/evidence-scenes.ts:28–109` 分离来源与场景摘要，缺必需原件记录 `missing` 且 `state=incomplete`；摘要 `captured` **不是正式 PASS**，更不能绕过需要源文件的产品读回。
2. **限定接线而非全局新权威：** `tests/helpers.ts:21–53` 仅在 `MENDI_TEST_EVIDENCE_DIR` 存每次真实命令的单一 stdout/stderr/error 原件；`tests/test-support.ts:102–112` 可选复用 result 和双日志；`tests/group-support.ts:63–96` 的 `groupRun/recordApplyScene` 共用同一单源库，TEST 与 APPLY 双开时第二处仅引用第一处，不复写相同 report/stdout/child。原未启用 opt-in 的脚本行为未变，调用者 actor 不认证独立 Reviewer。需清理的唯一临时源在删除前保存必要字节一次，否则明确 incomplete；禁止外部 symlink、错误相对路径和已提交 Run 目标写入。
3. **正式安全合同原样保留：** `git diff -- src` 没有修改。现行 `src/application/test-execution.ts` 的两个真实 `stdout.log/stderr.log`（即使 0B）没有虚拟化，`src/adapters/test-store.ts` 不将 ENOENT 推断为 empty；正式 `groups-v1` 的 run/child result/request/report/events（存在时）、stdout/stderr、资源清理与 locked/unknown 仍由当前产品持久写入与直接读回。新 collector 仅保存额外证据，不删原生源，不在原 failed/invalid/unknown 上合成 PASS。
4. **旧记录保护与历史读取：** 新 `tests/evidence-history.test.ts` 针对真实 D01–D04 closed delivery、已提交的 D05-A/B archive 与 Review Run 进行显式只读加载，并核对选择的原始 bytes 不变；D04 旧 formatVersion=1 执行、0B stdout 与 stderr 按原格式解析，不迁移旧 Run。D04-B 114 request / 107 report 只是 027 固定历史样本，不视为合法省略正式新报告的通用规则。
5. **文档/范围：** 四份 Explore/Apply/Reviewer Skills、README 与根路线图保持首版明确选型：**保留 0B 物理日志，只减少未来选定 opt-in 场景重复采集**，不引入通用 proof 数据库、跨历史哈希账本、隐式权限或 D05-D supplement/amend。没有对不存在的长期重复基线造效果断言或文件数/字节硬 gate。

## 本 Reviewer 真正独立执行的证据

- 新增 [reviewer-collector-tests.ts](artifacts/reviewer-collector-tests.ts)，独立在当前源码运行 `node --test --test-concurrency=2` 的四份新场景测试 `evidence-support/evidence-recorder/evidence-groups/evidence-history`：**16/16 passed，exit 0，0 fail/skip/cancel**。包含同一原件跨进程一次发布、相同文本不同执行不合并、opt-in 开关、已提交 Run 禁止修改、读取时源变更、短写/零进展/权限/发布中断、quiet stdout、passed/failed/unknown、真实 failed/invalid/cleanup unknown 的 groups-v1、旧历史。仅一份原始 [collector TAP](artifacts/collector-tests.tap.log)，实收参数和计数见 [collector-tests-result.json](artifacts/collector-tests-result.json)。新场景的 product fixture 均为隔离测试，不等同整个 D05 正式 Full Test。
- 新增 [reviewer-regression-tests.ts](artifacts/reviewer-regression-tests.ts)，独立以两个完整批次验证未被本轮修改的产品底座：`test-execution/test-log-integrity` **10/10 passed**、`group-boundaries/group-environment` **16/16 passed**，各 exit0，0 fail/skip。原始输出仅各保存一次为 [execution TAP](artifacts/execution.tap.log) 与 [formal groups TAP](artifacts/formal-groups.tap.log)，实际命令和计数在 [regression-tests-result.json](artifacts/regression-tests-result.json)。总计**42/42 独立测试通过**，但这不是 MenDi D05 根 Delivery 的正式 Full Test。
- Reviewer 独立 [reviewer-source-proof.ts](artifacts/reviewer-source-proof.ts) 只新建一个带 nonce 标记的隔离临时来源，并使用当前 031 自有受管 artifact 目录持久保存。原始同一文件重复两次、第二实例再次捕获，共复用同一个直接原件；另一个**不同身份但相同文本**的真实文件独立保存；源头两个临时文件删除后两个副本仍可读；可重建 fixtures 直接引用；越界/不存在/临时假冒 durable 受到拒绝。精确证据和原件引用在 [independent-source-proof.json](artifacts/independent-source-proof.json) 与 [唯一原件场景](artifacts/one-source-originals/reviewer-scenes.jsonl)。清理只作用于该 nonce 验证通过、realpath 位于 repo `.tmp` 下且无锁的自己的受控源目录，绝不按历史目录前缀广泛清理。**此 proof 验证临时原件生命周期，不推断不同文件系统上的所有发布能力**。
- Reviewer [reviewer-engineering.ts](artifacts/reviewer-engineering.ts) 独立运行 `pnpm check`、`pnpm build`、OpenSpec 1.14.1 `validate reduce-redundant-proof-inputs-and-artifacts --strict --json` 以及 `git diff --check`：**4/4 exit0**，完整 stdout/stderr 仅在 [engineering-check.log](artifacts/engineering-check.log)、[engineering-build.log](artifacts/engineering-build.log)、[engineering-openspec.log](artifacts/engineering-openspec.log)、[engineering-diff-check.log](artifacts/engineering-diff-check.log)，回执见 [engineering-results.json](artifacts/engineering-results.json)。四份 Reviewer 自有 TS 脚本严格 `tsc -p` **exit0/零诊断**，真实命令及结果在 [typecheck-results.json](artifacts/typecheck-results.json)。工具 PASS 只证明对应工程边界；本独立 verdict 另依据上面实际代码与来源审查。

## 维护性和责任边界

Reviewer 当次 [maintenance-results.json](artifacts/maintenance-results.json) 独立统计 `src/tests/scripts` 可维护 TypeScript 物理行数（含空行；末尾换行不算多一行），可靠 HEAD 基线为 `4774bde`，不存在的新增文件不捏造历史行数：

| 目录 | 维护代码物理行数前三（含并列） |
| --- | --- |
| `src/` | `application/delivery-lifecycle.ts` 368；`application/group-attempt.ts` 361；`adapters/openspec.ts`、`adapters/workspace.ts` 各 346 |
| `tests/` | `action-write.test.ts` 467；`planning-cli.test.ts` 444；`delivery-repair.test.ts` 395 |
| `scripts/` | `proofs/mvp-d01-c-explore.ts` 678；`proofs/mvp-d01-d-explore.ts` 487；`proofs/mvp-d01-a-explore.ts` 463 |

`tests/helpers.ts` 86→93、`test-support.ts` 137→128、`group-support.ts` 143→104；新增 `evidence-support.ts` 199 和 `evidence-scenes.ts` 109。实际职责按受管原件、场景选择、调用者 hook 划分；三旧入口没有进一步混杂扩张。当前无需为行数另拆文件或建独立行数账本。旧 C/D Explore proof 未扩展，无理由仅因长度重写旧证明。

## 明确限制与停止

本次仅审核**有限 opt-in 采集路径**；并未证明所有未来人工 Stage 的 proof 会被统一软件强制去重，也未认证在任意外部文件系统/权限模型上的原子发布。阶段真实原始来源及 Owner 责任仍需按 Skills 正确使用。提交/恢复正式 product 协议没有因本 Change 修改；实际长期存储减量只按各受控场景解释，不虚构全工程压缩比。此前 026 Explore 和 029 Propose 的历史与 verdict 不回写。

**交接：`archive / author / awaiting-instruction`，本 Reviewer 停止。** 不自动执行 OpenSpec Archive、根 D05 正式 Full Test/Close、Git Commit/Push、稳定安装或 DreMo 操作。根项目为 manual-bootstrap，本 031 仅保存独立 Review Apply Run/artifacts，并将当前 manifest 更新到下一阶段。
